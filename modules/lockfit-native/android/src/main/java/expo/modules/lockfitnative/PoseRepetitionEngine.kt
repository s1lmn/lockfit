package expo.modules.lockfitnative

internal enum class RepetitionPhase {
  SEEKING_TOP,
  TOP,
  BOTTOM
}

internal enum class RepetitionEvent {
  NONE,
  START_LOCKED,
  BOTTOM_LOCKED,
  REPETITION_COUNTED,
  MOVEMENT_TOO_FAST,
  MOVEMENT_TOO_SLOW,
  TRACKING_RESET
}

internal data class RepetitionEngineConfig(
  val bottomThreshold: Double,
  val topThreshold: Double,
  val topHoldMs: Long = 160L,
  val bottomHoldMs: Long = 120L,
  val minimumRepetitionMs: Long = 650L,
  val maximumRepetitionMs: Long = 12_000L,
  val trackingGraceMs: Long = 650L
)

internal data class RepetitionEngineResult(
  val repetitions: Int,
  val phase: RepetitionPhase,
  val event: RepetitionEvent
)

/** Counts only a stable top -> bottom -> top cycle and is independent of camera FPS. */
internal class PoseRepetitionEngine(
  private val config: RepetitionEngineConfig
) {
  private var repetitions = 0
  private var phase = RepetitionPhase.SEEKING_TOP
  private var topCandidateSince: Long? = null
  private var bottomCandidateSince: Long? = null
  private var movementStartedAt: Long? = null
  private var lastValidAt: Long? = null
  private var lastTimestampMs: Long? = null

  fun process(angle: Double, timestampMs: Long): RepetitionEngineResult {
    if (timestampRegressed(timestampMs)) {
      return snapshot(RepetitionEvent.TRACKING_RESET)
    }
    if (!angle.isFinite()) {
      return trackingLost(timestampMs)
    }
    lastValidAt = timestampMs

    val movementStart = movementStartedAt
    if (movementStart != null && timestampMs - movementStart > config.maximumRepetitionMs) {
      resetMovement()
      return snapshot(RepetitionEvent.MOVEMENT_TOO_SLOW)
    }

    return when (phase) {
      RepetitionPhase.SEEKING_TOP -> seekInitialTop(angle, timestampMs)
      RepetitionPhase.TOP -> seekBottom(angle, timestampMs)
      RepetitionPhase.BOTTOM -> seekReturnToTop(angle, timestampMs)
    }
  }

  fun trackingLost(timestampMs: Long): RepetitionEngineResult {
    if (timestampRegressed(timestampMs)) {
      return snapshot(RepetitionEvent.TRACKING_RESET)
    }
    // Missing frames must never contribute to a stability hold.
    topCandidateSince = null
    bottomCandidateSince = null
    val lastSeen = lastValidAt
    if (lastSeen != null && timestampMs - lastSeen <= config.trackingGraceMs) {
      return snapshot()
    }

    val hadActiveMovement = phase != RepetitionPhase.SEEKING_TOP ||
      topCandidateSince != null || bottomCandidateSince != null
    resetMovement()
    lastValidAt = null
    return snapshot(if (hadActiveMovement) RepetitionEvent.TRACKING_RESET else RepetitionEvent.NONE)
  }

  fun resetSession() {
    repetitions = 0
    lastValidAt = null
    lastTimestampMs = null
    resetMovement()
  }

  private fun timestampRegressed(timestampMs: Long): Boolean {
    val previous = lastTimestampMs
    lastTimestampMs = timestampMs
    if (previous == null || timestampMs >= previous) return false
    resetMovement()
    lastValidAt = null
    return true
  }

  private fun seekInitialTop(angle: Double, timestampMs: Long): RepetitionEngineResult {
    if (angle < config.topThreshold - TOP_ENTRY_TOLERANCE_DEGREES) {
      topCandidateSince = null
      return snapshot()
    }

    val candidateSince = topCandidateSince ?: timestampMs.also { topCandidateSince = it }
    if (timestampMs - candidateSince < config.topHoldMs) {
      return snapshot()
    }

    phase = RepetitionPhase.TOP
    topCandidateSince = null
    return snapshot(RepetitionEvent.START_LOCKED)
  }

  private fun seekBottom(angle: Double, timestampMs: Long): RepetitionEngineResult {
    if (angle < config.topThreshold - MOVEMENT_START_TOLERANCE_DEGREES && movementStartedAt == null) {
      movementStartedAt = timestampMs
    }

    if (angle > config.bottomThreshold) {
      bottomCandidateSince = null
      return snapshot()
    }

    val candidateSince = bottomCandidateSince ?: timestampMs.also { bottomCandidateSince = it }
    if (timestampMs - candidateSince < config.bottomHoldMs) {
      return snapshot()
    }

    phase = RepetitionPhase.BOTTOM
    bottomCandidateSince = null
    movementStartedAt = movementStartedAt ?: candidateSince
    return snapshot(RepetitionEvent.BOTTOM_LOCKED)
  }

  private fun seekReturnToTop(angle: Double, timestampMs: Long): RepetitionEngineResult {
    if (angle < config.topThreshold) {
      topCandidateSince = null
      return snapshot()
    }

    val candidateSince = topCandidateSince ?: timestampMs.also { topCandidateSince = it }
    if (timestampMs - candidateSince < config.topHoldMs) {
      return snapshot()
    }

    val durationMs = timestampMs - (movementStartedAt ?: timestampMs)
    phase = RepetitionPhase.TOP
    topCandidateSince = null
    bottomCandidateSince = null
    movementStartedAt = null

    if (durationMs < config.minimumRepetitionMs) {
      return snapshot(RepetitionEvent.MOVEMENT_TOO_FAST)
    }

    repetitions += 1
    return snapshot(RepetitionEvent.REPETITION_COUNTED)
  }

  private fun resetMovement() {
    phase = RepetitionPhase.SEEKING_TOP
    topCandidateSince = null
    bottomCandidateSince = null
    movementStartedAt = null
  }

  private fun snapshot(event: RepetitionEvent = RepetitionEvent.NONE) = RepetitionEngineResult(
    repetitions = repetitions,
    phase = phase,
    event = event
  )

  private companion object {
    const val TOP_ENTRY_TOLERANCE_DEGREES = 6.0
    const val MOVEMENT_START_TOLERANCE_DEGREES = 12.0
  }
}
