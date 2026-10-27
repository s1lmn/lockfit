package expo.modules.lockfitnative

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WaveGestureDetectorTest {
  @Test
  fun acceptsSweepWithDirectionChange() {
    val detector = WaveGestureDetector()
    val offsets = listOf(0.0, 0.18, 0.42, 0.58, 0.38, 0.08)
    val result = offsets.mapIndexed { index, value ->
      detector.process(WaveSide.LEFT, value, index * 100L)
    }.last()

    assertTrue(result.passed)
    assertTrue(result.reversals >= 1)
  }

  @Test
  fun rejectsStaticRaisedHand() {
    val detector = WaveGestureDetector()
    var result = detector.process(WaveSide.LEFT, 0.2, 0L)
    repeat(10) { index -> result = detector.process(WaveSide.LEFT, 0.2, (index + 1) * 100L) }

    assertFalse(result.passed)
  }

  @Test
  fun rejectsOneDirectionMovement() {
    val detector = WaveGestureDetector()
    val offsets = listOf(0.0, 0.12, 0.25, 0.40, 0.58)
    val result = offsets.mapIndexed { index, value ->
      detector.process(WaveSide.RIGHT, value, index * 100L)
    }.last()

    assertFalse(result.passed)
  }

  @Test
  fun cameraTranslationDoesNotCreateRelativeMovement() {
    val detector = WaveGestureDetector()
    var result = detector.process(WaveSide.LEFT, 0.25, 0L)
    repeat(8) { index -> result = detector.process(WaveSide.LEFT, 0.25, (index + 1) * 100L) }

    assertFalse(result.passed)
    assertTrue(result.sweep < 0.01)
  }

  @Test
  fun switchingHandsResetsProgress() {
    val detector = WaveGestureDetector()
    detector.process(WaveSide.LEFT, 0.0, 0L)
    detector.process(WaveSide.LEFT, 0.5, 200L)
    val switched = detector.process(WaveSide.RIGHT, 0.0, 300L)
    val result = detector.process(WaveSide.RIGHT, -0.3, 500L)

    assertFalse(switched.passed)
    assertFalse(result.passed)
    assertTrue(result.durationMs <= 200L)
  }
}
