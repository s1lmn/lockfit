package expo.modules.lockfitnative

internal data class AppLifecycleEvent(
  val packageName: String,
  val timestampMs: Long,
  val resumed: Boolean
)

internal fun aggregateForegroundMillis(
  packageNames: Set<String>,
  events: List<AppLifecycleEvent>,
  intervalStartMs: Long,
  intervalEndMs: Long
): Map<String, Long> {
  val totals = packageNames.associateWith { 0L }.toMutableMap()
  val activeSince = mutableMapOf<String, Long>()

  events.sortedBy { it.timestampMs }.forEach { event ->
    if (event.packageName !in packageNames || event.timestampMs !in intervalStartMs..intervalEndMs) {
      return@forEach
    }

    if (event.resumed) {
      activeSince.putIfAbsent(event.packageName, event.timestampMs)
    } else {
      val startedAt = activeSince.remove(event.packageName) ?: return@forEach
      totals[event.packageName] = (totals[event.packageName] ?: 0L) +
        (event.timestampMs - startedAt).coerceAtLeast(0L)
    }
  }

  activeSince.forEach { (packageName, startedAt) ->
    totals[packageName] = (totals[packageName] ?: 0L) +
      (intervalEndMs - startedAt).coerceAtLeast(0L)
  }

  return totals
}
