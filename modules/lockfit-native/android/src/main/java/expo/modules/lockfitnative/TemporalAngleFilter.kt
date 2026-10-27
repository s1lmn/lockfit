package expo.modules.lockfitnative

import java.util.ArrayDeque
import kotlin.math.exp

/** Smooths landmark noise by elapsed time, so the result is stable across camera FPS. */
internal class TemporalAngleFilter(
  private val timeConstantMs: Double = 90.0,
  private val medianWindowMs: Long = 120L,
  private val resetGapMs: Long = 500L
) {
  private data class Sample(val timestampMs: Long, val angle: Double)

  private val samples = ArrayDeque<Sample>()
  private var filteredAngle: Double? = null
  private var lastTimestampMs: Long? = null

  fun process(angle: Double, timestampMs: Long): Double {
    require(angle.isFinite()) { "Angle must be finite" }

    val previousTimestamp = lastTimestampMs
    if (previousTimestamp == null || timestampMs <= previousTimestamp || timestampMs - previousTimestamp > resetGapMs) {
      reset()
    }

    samples.addLast(Sample(timestampMs, angle))
    while (samples.isNotEmpty() && timestampMs - samples.first().timestampMs > medianWindowMs) {
      samples.removeFirst()
    }

    val median = samples.map { it.angle }.sorted().let { sorted ->
      val middle = sorted.size / 2
      if (sorted.size % 2 == 0) {
        (sorted[middle - 1] + sorted[middle]) / 2.0
      } else {
        sorted[middle]
      }
    }

    val previousFiltered = filteredAngle
    val result = if (previousFiltered == null || previousTimestamp == null) {
      median
    } else {
      val deltaMs = (timestampMs - previousTimestamp).coerceIn(1L, resetGapMs)
      val alpha = 1.0 - exp(-deltaMs / timeConstantMs)
      previousFiltered + alpha * (median - previousFiltered)
    }

    filteredAngle = result
    lastTimestampMs = timestampMs
    return result
  }

  fun reset() {
    samples.clear()
    filteredAngle = null
    lastTimestampMs = null
  }
}
