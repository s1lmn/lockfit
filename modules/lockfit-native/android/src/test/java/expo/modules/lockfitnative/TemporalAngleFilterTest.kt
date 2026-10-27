package expo.modules.lockfitnative

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class TemporalAngleFilterTest {
  @Test
  fun suppressesSingleFrameSpike() {
    val filter = TemporalAngleFilter()
    val values = listOf(160.0, 159.0, 161.0, 80.0, 160.0, 159.0)
    val output = values.mapIndexed { index, value -> filter.process(value, index * 33L) }

    assertTrue(output.minOrNull()!! > 145.0)
  }

  @Test
  fun resetsAfterLongTrackingGap() {
    val filter = TemporalAngleFilter()
    filter.process(160.0, 0L)
    filter.process(150.0, 33L)

    assertEquals(75.0, filter.process(75.0, 700L), 0.001)
  }

  @Test
  fun followsSameMotionSimilarlyAtDifferentFrameRates() {
    val outputs = listOf(15, 30, 60).map { fps -> simulateMotion(fps) }

    assertTrue(abs(outputs[0] - outputs[1]) < 4.0)
    assertTrue(abs(outputs[1] - outputs[2]) < 4.0)
  }

  private fun simulateMotion(fps: Int): Double {
    val filter = TemporalAngleFilter()
    var output = 160.0
    for (frame in 0..fps) {
      val timestamp = frame * 1_000L / fps
      val rawAngle = 160.0 - 85.0 * (timestamp / 1_000.0)
      output = filter.process(rawAngle, timestamp)
    }
    return output
  }
}
