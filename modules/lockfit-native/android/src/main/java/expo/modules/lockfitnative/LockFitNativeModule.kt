package expo.modules.lockfitnative

import android.Manifest
import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.TimeUnit

class LockFitNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LockFitNative")

    AsyncFunction("getDeviceSnapshotAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      mapOf(
        "installedApps" to getInstalledApps(context),
        "permissionStatus" to mapOf(
          "usageAccessGranted" to isUsageAccessGranted(context),
          "accessibilityGranted" to isAccessibilityServiceEnabled(context),
          "overlayGranted" to isAccessibilityServiceEnabled(context)
        ),
        "manufacturer" to Build.MANUFACTURER.lowercase(Locale.US)
      )
    }

    AsyncFunction("getTodayUsageByPackageAsync") { packageNames: List<String> ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      getTodayUsageByPackage(
        context,
        packageNames.asSequence()
          .filter { PACKAGE_NAME_PATTERN.matches(it) }
          .distinct()
          .take(MAX_USAGE_PACKAGES)
          .toList()
      )
    }

    AsyncFunction("getStepCounterSnapshotAsync") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("E_NO_CONTEXT", "React context is not available", null)
        return@AsyncFunction
      }

      if (!hasActivityRecognitionPermission(context)) {
        promise.resolve(
          mapOf(
            "supported" to hasStepCounter(context),
            "permissionGranted" to false,
            "sensorValue" to null
          )
        )
        return@AsyncFunction
      }

      readStepCounterSnapshot(context, promise)
    }

    AsyncFunction("openUsageAccessSettingsAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      openSettings(context, Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }

    AsyncFunction("openAccessibilitySettingsAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      openSettings(context, Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    AsyncFunction("openOverlaySettingsAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      openSettings(context, Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    AsyncFunction("confirmAccessibilityDisclosureAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      BlockingConfigStore.recordConsent(context)
      true
    }

    AsyncFunction("syncBlockingConfigAsync") { rawRules: List<Map<String, Any>> ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      val rules = rawRules.asSequence().mapNotNull { item ->
        val packageName = item["packageName"] as? String ?: return@mapNotNull null
        val appName = item["appName"] as? String ?: packageName
        val dailyLimit = (item["dailyLimitMinutes"] as? Number)?.toInt() ?: return@mapNotNull null
        if (!PACKAGE_NAME_PATTERN.matches(packageName) || dailyLimit !in 5..1_440) {
          return@mapNotNull null
        }
        BlockingRule(packageName, appName.take(100), dailyLimit)
      }.distinctBy { it.packageName }.take(MAX_USAGE_PACKAGES).toList()

      BlockingConfigStore.saveRules(context, rules)
      true
    }

    AsyncFunction("hashPasswordAsync") { password: String ->
      PasswordHasher.hash(password)
    }

    AsyncFunction("verifyPasswordAsync") { password: String, encoded: String ->
      PasswordHasher.verify(password, encoded)
    }

    AsyncFunction("clearLocalDataAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      BlockingConfigStore.clearAll(context)
      ExerciseSessionStore.clear(context)
      true
    }

    AsyncFunction("launchExerciseUnlockAsync") {
      exerciseType: String,
      challengeType: String,
      requiredRepetitions: Int,
      bonusMinutes: Int,
      bottomThreshold: Double,
      topThreshold: Double ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      val intent = Intent(context, ExerciseUnlockActivity::class.java).apply {
        putExtra(ExerciseUnlockActivity.EXTRA_EXERCISE_TYPE, exerciseType)
        putExtra(ExerciseUnlockActivity.EXTRA_CHALLENGE_TYPE, challengeType)
        putExtra(ExerciseUnlockActivity.EXTRA_REQUIRED_REPETITIONS, requiredRepetitions)
        putExtra(ExerciseUnlockActivity.EXTRA_BONUS_MINUTES, bonusMinutes)
        putExtra(ExerciseUnlockActivity.EXTRA_BOTTOM_THRESHOLD, bottomThreshold)
        putExtra(ExerciseUnlockActivity.EXTRA_TOP_THRESHOLD, topThreshold)
      }

      val currentActivity = appContext.currentActivity
      if (currentActivity != null) {
        currentActivity.startActivity(intent)
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }

      true
    }

    AsyncFunction("consumePendingExerciseResultAsync") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")

      ExerciseSessionStore.consume(context)
    }
  }

  private fun openSettings(context: Context, intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  private fun hasActivityRecognitionPermission(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return true
    }

    return ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.ACTIVITY_RECOGNITION
    ) == PackageManager.PERMISSION_GRANTED
  }

  private fun hasStepCounter(context: Context): Boolean {
    val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    return sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
  }

  private fun readStepCounterSnapshot(context: Context, promise: Promise) {
    val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val sensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    if (sensor == null) {
      promise.resolve(
        mapOf(
          "supported" to false,
          "permissionGranted" to true,
          "sensorValue" to null
        )
      )
      return
    }

    val handler = Handler(Looper.getMainLooper())
    var completed = false
    lateinit var listener: SensorEventListener

    fun finish(value: Double?) {
      if (completed) return
      completed = true
      sensorManager.unregisterListener(listener)
      promise.resolve(
        mapOf(
          "supported" to true,
          "permissionGranted" to true,
          "sensorValue" to value
        )
      )
    }

    listener = object : SensorEventListener {
      override fun onSensorChanged(event: SensorEvent) {
        val value = event.values.firstOrNull()?.toDouble()
        finish(value?.takeIf { it.isFinite() && it >= 0.0 })
      }

      override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
    }

    val registered = sensorManager.registerListener(
      listener,
      sensor,
      SensorManager.SENSOR_DELAY_NORMAL,
      handler
    )
    if (!registered) {
      finish(null)
      return
    }

    handler.postDelayed({ finish(null) }, STEP_SENSOR_TIMEOUT_MS)
  }

  private fun getInstalledApps(context: Context): List<Map<String, String>> {
    val packageManager = context.packageManager
    val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_LAUNCHER)
    }

    val resolveInfoFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      PackageManager.ResolveInfoFlags.of(0)
    } else {
      null
    }

    val resolvedApps = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.queryIntentActivities(launcherIntent, resolveInfoFlags!!)
    } else {
      @Suppress("DEPRECATION")
      packageManager.queryIntentActivities(launcherIntent, 0)
    }

    return resolvedApps
      .mapNotNull { resolveInfo ->
        val activityInfo = resolveInfo.activityInfo ?: return@mapNotNull null
        val packageName = activityInfo.packageName

        if (packageName == context.packageName) {
          return@mapNotNull null
        }

        mapOf(
          "packageName" to packageName,
          "appName" to resolveInfo.loadLabel(packageManager).toString()
        )
      }
      .distinctBy { it["packageName"] }
      .sortedBy { it["appName"]?.lowercase(Locale.US) }
  }

  private fun getTodayUsageByPackage(
    context: Context,
    packageNames: List<String>
  ): List<Map<String, Any>> {
    if (!isUsageAccessGranted(context)) {
      return packageNames.map { packageName ->
        mapOf(
          "packageName" to packageName,
          "usedMinutes" to 0
        )
      }
    }

    val usageStatsManager =
      context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    val calendar = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }

    val startOfDay = calendar.timeInMillis
    val now = System.currentTimeMillis()
    val selectedPackages = packageNames.toSet()

    val lifecycleEvents = mutableListOf<AppLifecycleEvent>()
    val usageEvents = usageStatsManager.queryEvents(startOfDay, now)
    val usageEvent = UsageEvents.Event()
    while (usageEvents.hasNextEvent()) {
      usageEvents.getNextEvent(usageEvent)
      val packageName = usageEvent.packageName ?: continue
      if (packageName !in selectedPackages) continue
      when (usageEvent.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> lifecycleEvents.add(
          AppLifecycleEvent(packageName, usageEvent.timeStamp, resumed = true)
        )
        UsageEvents.Event.ACTIVITY_PAUSED -> lifecycleEvents.add(
          AppLifecycleEvent(packageName, usageEvent.timeStamp, resumed = false)
        )
      }
    }

    val eventUsage = aggregateForegroundMillis(
      selectedPackages,
      lifecycleEvents,
      startOfDay,
      now
    )
    val fallbackUsage = packageNames.associateWith { 0L }.toMutableMap()
    val stats = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      startOfDay,
      now
    )

    stats.orEmpty().forEach { usageStat ->
      val packageName = usageStat.packageName ?: return@forEach
      if (selectedPackages.contains(packageName)) {
        fallbackUsage[packageName] = usageStat.totalTimeInForeground
      }
    }

    return packageNames.map { packageName ->
      mapOf(
        "packageName" to packageName,
        "usedMinutes" to TimeUnit.MILLISECONDS.toMinutes(
          eventUsage[packageName]?.takeIf { it > 0L }
            ?: fallbackUsage[packageName]
            ?: 0L
        ).toInt()
      )
    }
  }

  private fun isUsageAccessGranted(context: Context): Boolean {
    val appOpsManager = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOpsManager.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOpsManager.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    }

    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun isAccessibilityServiceEnabled(context: Context): Boolean {
    val expected = ComponentName(context, LockFitAccessibilityService::class.java)
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false

    return enabledServices.split(':').any { flattened ->
      ComponentName.unflattenFromString(flattened) == expected
    }
  }

  private companion object {
    const val STEP_SENSOR_TIMEOUT_MS = 2_500L
    const val MAX_USAGE_PACKAGES = 100
    val PACKAGE_NAME_PATTERN = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+$")
  }
}
