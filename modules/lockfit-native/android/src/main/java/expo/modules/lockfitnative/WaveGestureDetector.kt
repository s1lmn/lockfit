package expo.modules.lockfitnative

import java.util.ArrayDeque
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

internal enum class WaveSide {
  LEFT,
  RIGHT
}

internal data class WaveGestureResult(
  val passed: Boolean,
  val progressPercent: Int,
  val sweep: Double,
  val reversals: Int,
  val durationMs: Long
)

/** Detects a left-right wave using wrist movement relative to the same-side shoulder. */
internal class WaveGestureDetector(
  private val windowMs: Long = 1_800L,
  private val minimumDurationMs: Long = 350L,
  private val minimumSweep: Double = 0.45,
  private val minimumDirectionLeg: Double = 0.16
) {
  private data class Sample(val timestampMs: Long, val offset: Double)

  private val samples = ArrayDeque<Sample>()
  private var activeSide: WaveSide? = null

  fun process(side: WaveSide, normalizedWristOffset: Double, timestampMs: Long): WaveGestureResult {
    require(normalizedWristOffset.isFinite()) { "Wrist offset must be finite" }

    if (activeSide != side || (samples.isNotEmpty() && timestampMs <= samples.last().timestampMs)) {
      reset()
      activeSide = side
    } else if (activeSide == null) {
      activeSide = side
    }

    samples.addLast(Sample(timestampMs, normalizedWristOffset))
    while (samples.isNotEmpty() && timestampMs - samples.first().timestampMs > windowMs) {
      samples.removeFirst()
    }

    val offsets = samples.map { it.offset }
    val sweep = if (offsets.isEmpty()) 0.0 else {
      (offsets.maxOrNull() ?: 0.0) - (offsets.minOrNull() ?: 0.0)
    }
    val reversals = countMeaningfulReversals(offsets)
    val duration = if (samples.size >= 2) {
      samples.last().timestampMs - samples.first().timestampMs
    } else {
      0L
    }
    val sweepProgress = (sweep / minimumSweep * 100.0).toInt()
    val progress = if (reversals > 0) sweepProgress else min(sweepProgress, 85)
    val passed = duration >= minimumDurationMs && sweep >= minimumSweep && reversals >= 1

    return WaveGestureResult(
      passed = passed,
      progressPercent = progress.coerceIn(0, 100),
      sweep = sweep,
      reversals = reversals,
      durationMs = duration
    )
  }

  fun reset() {
    samples.clear()
    activeSide = null
  }

  private fun countMeaningfulReversals(values: List<Double>): Int {
    if (values.size < 3) return 0

    var direction = 0
    val anchor = values.first()
    var extreme = anchor
    var reversals = 0

    for (value in values.drop(1)) {
      when (direction) {
        0 -> {
          val delta = value - anchor
          if (abs(delta) >= minimumDirectionLeg) {
            direction = if (delta > 0.0) 1 else -1
            extreme = value
          }
        }
        1 -> {
          extreme = max(extreme, value)
          if (extreme - value >= minimumDirectionLeg) {
            reversals += 1
            direction = -1
            extreme = value
          }
        }
        else -> {
          extreme = min(extreme, value)
          if (value - extreme >= minimumDirectionLeg) {
            reversals += 1
            direction = 1
            extreme = value
          }
        }
      }
    }

    return reversals
  }
}
