package expo.modules.lockfitnative

internal data class SideSelection<T>(
  val side: T?,
  val changed: Boolean
)

/** Prevents landmark confidence flicker from swapping the measured side mid-repetition. */
internal class StableSideSelector<T>(
  private val switchMargin: Double = 0.15,
  private val switchHoldMs: Long = 180L
) {
  private var selected: T? = null
  private var candidate: T? = null
  private var candidateSinceMs: Long? = null
  private var lastTimestampMs: Long? = null

  fun select(scores: Map<T, Double>, timestampMs: Long): SideSelection<T> {
    if (lastTimestampMs != null && timestampMs <= lastTimestampMs!!) {
      reset()
    }
    lastTimestampMs = timestampMs

    if (scores.isEmpty()) {
      clearCandidate()
      return SideSelection(null, false)
    }

    val current = selected
    if (current == null) {
      val initial = scores.maxBy { it.value }.key
      selected = initial
      return SideSelection(initial, true)
    }

    val currentScore = scores[current]
    val alternate = scores
      .filterKeys { it != current }
      .maxByOrNull { it.value }

    if (currentScore != null && (alternate == null || alternate.value < currentScore + switchMargin)) {
      clearCandidate()
      return SideSelection(current, false)
    }

    val target = alternate?.key ?: return SideSelection(null, false)
    if (candidate != target) {
      candidate = target
      candidateSinceMs = timestampMs
      return SideSelection(if (currentScore != null) current else null, false)
    }

    val stableSince = candidateSinceMs ?: timestampMs.also { candidateSinceMs = it }
    if (timestampMs - stableSince < switchHoldMs) {
      return SideSelection(if (currentScore != null) current else null, false)
    }

    selected = target
    clearCandidate()
    return SideSelection(target, true)
  }

  fun reset() {
    selected = null
    clearCandidate()
    lastTimestampMs = null
  }

  private fun clearCandidate() {
    candidate = null
    candidateSinceMs = null
  }
}
