package expo.modules.lockfitnative

import android.content.Context
import android.os.SystemClock
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject

internal data class BlockingRule(
  val packageName: String,
  val appName: String,
  val dailyLimitMinutes: Int
)

internal object BlockingConfigStore {
  private const val PREFS_NAME = "lockfit_blocking_config"
  private const val KEY_RULES = "rules"
  private const val KEY_CONSENT_AT = "accessibility_consent_at"
  private const val KEY_TARGET_PACKAGE = "target_package"
  private const val KEY_TARGET_APP_NAME = "target_app_name"
  private const val KEY_UNLOCK_PACKAGE = "unlock_package"
  private const val KEY_UNLOCK_UNTIL_ELAPSED = "unlock_until_elapsed"
  private const val KEY_UNLOCK_BOOT_COUNT = "unlock_boot_count"

  fun saveRules(context: Context, rules: List<BlockingRule>) {
    val json = JSONArray()
    rules.distinctBy { it.packageName }.take(100).forEach { rule ->
      json.put(
        JSONObject()
          .put("packageName", rule.packageName)
          .put("appName", rule.appName.take(100))
          .put("dailyLimitMinutes", rule.dailyLimitMinutes.coerceIn(5, 1_440))
      )
    }
    prefs(context).edit().putString(KEY_RULES, json.toString()).apply()
  }

  fun loadRules(context: Context): Map<String, BlockingRule> {
    val raw = prefs(context).getString(KEY_RULES, null) ?: return emptyMap()
    return runCatching {
      val json = JSONArray(raw)
      buildMap {
        for (index in 0 until json.length()) {
          val item = json.optJSONObject(index) ?: continue
          val packageName = item.optString("packageName")
          val appName = item.optString("appName").take(100)
          val limit = item.optInt("dailyLimitMinutes")
          if (PACKAGE_NAME_PATTERN.matches(packageName) && limit in 5..1_440) {
            put(packageName, BlockingRule(packageName, appName.ifBlank { packageName }, limit))
          }
        }
      }
    }.getOrDefault(emptyMap())
  }

  fun recordConsent(context: Context) {
    prefs(context).edit().putLong(KEY_CONSENT_AT, System.currentTimeMillis()).apply()
  }

  fun hasConsent(context: Context): Boolean = prefs(context).getLong(KEY_CONSENT_AT, 0L) > 0L

  fun setCurrentTarget(context: Context, rule: BlockingRule) {
    prefs(context).edit()
      .putString(KEY_TARGET_PACKAGE, rule.packageName)
      .putString(KEY_TARGET_APP_NAME, rule.appName)
      .apply()
  }

  fun clearCurrentTarget(context: Context) {
    prefs(context).edit()
      .remove(KEY_TARGET_PACKAGE)
      .remove(KEY_TARGET_APP_NAME)
      .apply()
  }

  fun clearAll(context: Context) {
    prefs(context).edit().clear().commit()
  }

  fun grantCurrentTarget(context: Context, bonusMinutes: Int): Boolean {
    val store = prefs(context)
    val packageName = store.getString(KEY_TARGET_PACKAGE, null)
      ?.takeIf { PACKAGE_NAME_PATTERN.matches(it) }
      ?: return false
    val now = SystemClock.elapsedRealtime()
    val existingPackage = store.getString(KEY_UNLOCK_PACKAGE, null)
    val existingUntil = if (existingPackage == packageName && isSameBoot(context, store)) {
      store.getLong(KEY_UNLOCK_UNTIL_ELAPSED, 0L)
    } else {
      0L
    }
    val base = maxOf(now, existingUntil)
    val durationMs = bonusMinutes.coerceIn(1, 240) * 60_000L
    store.edit()
      .putString(KEY_UNLOCK_PACKAGE, packageName)
      .putLong(KEY_UNLOCK_UNTIL_ELAPSED, base + durationMs)
      .putInt(KEY_UNLOCK_BOOT_COUNT, bootCount(context))
      .remove(KEY_TARGET_PACKAGE)
      .remove(KEY_TARGET_APP_NAME)
      .apply()
    return true
  }

  fun unlockUntil(context: Context, packageName: String): Long {
    val store = prefs(context)
    if (!isSameBoot(context, store) || store.getString(KEY_UNLOCK_PACKAGE, null) != packageName) {
      return 0L
    }
    return store.getLong(KEY_UNLOCK_UNTIL_ELAPSED, 0L)
  }

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private fun bootCount(context: Context): Int = runCatching {
    Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT)
  }.getOrDefault(-1)

  private fun isSameBoot(context: Context, store: android.content.SharedPreferences): Boolean {
    val current = bootCount(context)
    return current >= 0 && current == store.getInt(KEY_UNLOCK_BOOT_COUNT, Int.MIN_VALUE)
  }

  private val PACKAGE_NAME_PATTERN = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+$")
}
