package expo.modules.lockfitnative

import android.accessibilityservice.AccessibilityService
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Calendar
import java.util.concurrent.TimeUnit

class LockFitAccessibilityService : AccessibilityService() {
  private var overlayView: View? = null
  private var overlayPackageName: String? = null
  private var foregroundPackageName: String? = null
  private val checkHandler = Handler(Looper.getMainLooper())
  private var pendingCheck: Runnable? = null
  private val windowManager by lazy { getSystemService(Context.WINDOW_SERVICE) as WindowManager }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val foregroundPackage = event?.packageName?.toString() ?: return
    foregroundPackageName = foregroundPackage
    cancelPendingCheck()
    if (foregroundPackage == packageName) {
      removeOverlay()
      return
    }
    if (!BlockingConfigStore.hasConsent(this)) {
      removeOverlay()
      return
    }

    val rule = BlockingConfigStore.loadRules(this)[foregroundPackage]
    if (rule == null) {
      removeOverlay()
      return
    }

    val usedMillis = getTodayForegroundMillis(foregroundPackage)
    val decision = decideBlocking(
      usedMillis = usedMillis,
      dailyLimitMinutes = rule.dailyLimitMinutes,
      unlockUntilElapsedMs = BlockingConfigStore.unlockUntil(this, foregroundPackage),
      nowElapsedMs = SystemClock.elapsedRealtime()
    )
    if (decision == BlockingDecision.BLOCK_LIMIT_REACHED) {
      showOverlay(rule, usedMillis)
    } else {
      removeOverlay()
      scheduleNextCheck(rule, usedMillis)
    }
  }

  override fun onInterrupt() {
    removeOverlay()
  }

  override fun onDestroy() {
    cancelPendingCheck()
    removeOverlay()
    super.onDestroy()
  }

  private fun getTodayForegroundMillis(targetPackage: String): Long {
    val manager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val startOfDay = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    val now = System.currentTimeMillis()
    val lifecycleEvents = mutableListOf<AppLifecycleEvent>()
    val events = manager.queryEvents(startOfDay, now)
    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.packageName != targetPackage) continue
      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> lifecycleEvents.add(
          AppLifecycleEvent(targetPackage, event.timeStamp, resumed = true)
        )
        UsageEvents.Event.ACTIVITY_PAUSED -> lifecycleEvents.add(
          AppLifecycleEvent(targetPackage, event.timeStamp, resumed = false)
        )
      }
    }
    val eventUsage = aggregateForegroundMillis(
      setOf(targetPackage),
      lifecycleEvents,
      startOfDay,
      now
    )[targetPackage] ?: 0L
    if (eventUsage > 0L) return eventUsage

    return manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startOfDay, now)
      .orEmpty()
      .filter { it.packageName == targetPackage }
      .maxOfOrNull { it.totalTimeInForeground }
      ?: 0L
  }

  private fun showOverlay(rule: BlockingRule, usedMillis: Long) {
    cancelPendingCheck()
    if (overlayPackageName == rule.packageName && overlayView != null) return
    removeOverlay()

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(28), dp(48), dp(28), dp(48))
      background = GradientDrawable().apply {
        setColor(Color.rgb(239, 232, 216))
      }
      contentDescription = "LockFit блокирует ${rule.appName}: дневной лимит исчерпан"
    }

    root.addView(TextView(this).apply {
      text = "LOCKFIT"
      textSize = 13f
      setTextColor(Color.rgb(75, 100, 82))
      typeface = Typeface.DEFAULT_BOLD
      letterSpacing = 0.18f
      gravity = Gravity.CENTER
    })
    root.addView(TextView(this).apply {
      text = "Пора немного подвигаться"
      textSize = 31f
      setTextColor(Color.rgb(38, 48, 42))
      typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
      gravity = Gravity.CENTER
      setPadding(0, dp(18), 0, dp(12))
    })
    root.addView(TextView(this).apply {
      val usedMinutes = TimeUnit.MILLISECONDS.toMinutes(usedMillis).coerceAtLeast(rule.dailyLimitMinutes.toLong())
      text = "Лимит ${rule.appName} исчерпан: $usedMinutes из ${rule.dailyLimitMinutes} мин. Камера проверит упражнение только на устройстве."
      textSize = 16f
      setTextColor(Color.rgb(83, 91, 85))
      gravity = Gravity.CENTER
      setLineSpacing(0f, 1.2f)
    })
    root.addView(Button(this).apply {
      text = "Разблокировать через упражнение"
      textSize = 15f
      setTextColor(Color.WHITE)
      isAllCaps = false
      background = GradientDrawable().apply {
        cornerRadius = dp(18).toFloat()
        setColor(Color.rgb(75, 100, 82))
      }
      setPadding(dp(20), dp(14), dp(20), dp(14))
      setOnClickListener {
        BlockingConfigStore.setCurrentTarget(this@LockFitAccessibilityService, rule)
        removeOverlay()
        openExerciseScreen()
      }
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { topMargin = dp(28) })
    root.addView(TextView(this).apply {
      text = "Для выхода используй системный экран «Домой». LockFit не читает содержимое ${rule.appName}."
      textSize = 12f
      setTextColor(Color.rgb(112, 116, 111))
      gravity = Gravity.CENTER
      setPadding(0, dp(18), 0, 0)
    })

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
        WindowManager.LayoutParams.FLAG_SECURE,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.CENTER
    }

    runCatching {
      windowManager.addView(root, params)
      overlayView = root
      overlayPackageName = rule.packageName
    }
  }

  private fun openExerciseScreen() {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("lockfit://exercise")).apply {
      setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    runCatching { startActivity(intent) }
  }

  private fun scheduleNextCheck(rule: BlockingRule, usedMillis: Long) {
    val delay = nextBlockingCheckDelayMs(
      usedMillis = usedMillis,
      dailyLimitMinutes = rule.dailyLimitMinutes,
      unlockUntilElapsedMs = BlockingConfigStore.unlockUntil(this, rule.packageName),
      nowElapsedMs = SystemClock.elapsedRealtime()
    ) ?: return

    val task = Runnable {
      pendingCheck = null
      if (foregroundPackageName != rule.packageName || !BlockingConfigStore.hasConsent(this)) {
        return@Runnable
      }
      val currentRule = BlockingConfigStore.loadRules(this)[rule.packageName] ?: return@Runnable
      val currentUsage = getTodayForegroundMillis(rule.packageName)
      val decision = decideBlocking(
        currentUsage,
        currentRule.dailyLimitMinutes,
        BlockingConfigStore.unlockUntil(this, rule.packageName),
        SystemClock.elapsedRealtime()
      )
      if (decision == BlockingDecision.BLOCK_LIMIT_REACHED) {
        showOverlay(currentRule, currentUsage)
      } else {
        scheduleNextCheck(currentRule, currentUsage)
      }
    }
    pendingCheck = task
    checkHandler.postDelayed(task, delay.coerceAtLeast(MINIMUM_CHECK_DELAY_MS))
  }

  private fun cancelPendingCheck() {
    pendingCheck?.let(checkHandler::removeCallbacks)
    pendingCheck = null
  }

  private fun removeOverlay() {
    val view = overlayView ?: return
    runCatching { windowManager.removeViewImmediate(view) }
    overlayView = null
    overlayPackageName = null
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  private companion object {
    const val MINIMUM_CHECK_DELAY_MS = 250L
  }
}
