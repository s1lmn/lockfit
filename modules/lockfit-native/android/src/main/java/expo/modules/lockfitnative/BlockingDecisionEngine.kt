package expo.modules.lockfitnative

internal enum class BlockingDecision {
  ALLOW,
  BLOCK_LIMIT_REACHED
}

internal fun decideBlocking(
  usedMillis: Long,
  dailyLimitMinutes: Int,
  unlockUntilElapsedMs: Long,
  nowElapsedMs: Long
): BlockingDecision {
  if (dailyLimitMinutes !in 5..1_440) return BlockingDecision.ALLOW
  if (unlockUntilElapsedMs > nowElapsedMs) return BlockingDecision.ALLOW

  val limitMillis = dailyLimitMinutes * 60_000L
  return if (usedMillis >= limitMillis) {
    BlockingDecision.BLOCK_LIMIT_REACHED
  } else {
    BlockingDecision.ALLOW
  }
}

internal fun nextBlockingCheckDelayMs(
  usedMillis: Long,
  dailyLimitMinutes: Int,
  unlockUntilElapsedMs: Long,
  nowElapsedMs: Long
): Long? {
  if (dailyLimitMinutes !in 5..1_440) return null
  if (unlockUntilElapsedMs > nowElapsedMs) {
    return unlockUntilElapsedMs - nowElapsedMs
  }

  val remaining = dailyLimitMinutes * 60_000L - usedMillis
  return remaining.takeIf { it > 0L }
}
