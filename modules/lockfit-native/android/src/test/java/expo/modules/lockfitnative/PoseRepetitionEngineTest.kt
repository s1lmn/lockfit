package expo.modules.lockfitnative

import org.junit.Assert.assertEquals
import org.junit.Test

class PoseRepetitionEngineTest {
  private fun engine() = PoseRepetitionEngine(
    RepetitionEngineConfig(
      bottomThreshold = 80.0,
      topThreshold = 155.0,
      topHoldMs = 100L,
      bottomHoldMs = 100L,
      minimumRepetitionMs = 600L,
      maximumRepetitionMs = 5_000L,
      trackingGraceMs = 500L
    )
  )

  @Test
  fun countsStableFullCycle() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)
    engine.process(130.0, 200L)
    engine.process(75.0, 500L)
    engine.process(75.0, 600L)
    engine.process(160.0, 800L)
    val result = engine.process(160.0, 900L)

    assertEquals(1, result.repetitions)
    assertEquals(RepetitionEvent.REPETITION_COUNTED, result.event)
  }

  @Test
  fun doesNotCountPartialMovement() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)
    engine.process(110.0, 300L)
    engine.process(160.0, 700L)
    val result = engine.process(160.0, 800L)

    assertEquals(0, result.repetitions)
    assertEquals(RepetitionPhase.TOP, result.phase)
  }

  @Test
  fun rejectsImplausiblyFastCycle() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)
    engine.process(120.0, 150L)
    engine.process(75.0, 180L)
    engine.process(75.0, 280L)
    engine.process(160.0, 320L)
    val result = engine.process(160.0, 420L)

    assertEquals(0, result.repetitions)
    assertEquals(RepetitionEvent.MOVEMENT_TOO_FAST, result.event)
  }

  @Test
  fun resetsImplausiblySlowCycle() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)
    engine.process(120.0, 200L)
    engine.process(75.0, 1_000L)
    engine.process(75.0, 1_100L)

    val result = engine.process(160.0, 5_300L)

    assertEquals(0, result.repetitions)
    assertEquals(RepetitionPhase.SEEKING_TOP, result.phase)
    assertEquals(RepetitionEvent.MOVEMENT_TOO_SLOW, result.event)
  }

  @Test
  fun toleratesBriefTrackingLoss() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)
    engine.process(120.0, 250L)
    engine.process(75.0, 450L)
    engine.process(75.0, 550L)

    val missing = engine.trackingLost(900L)

    assertEquals(RepetitionPhase.BOTTOM, missing.phase)
  }

  @Test
  fun missingFramesDoNotCompleteStableHold() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.trackingLost(80L)

    val resumed = engine.process(160.0, 120L)
    val locked = engine.process(160.0, 220L)

    assertEquals(RepetitionPhase.SEEKING_TOP, resumed.phase)
    assertEquals(RepetitionEvent.START_LOCKED, locked.event)
  }

  @Test
  fun nonFiniteAngleIsTreatedAsTrackingLoss() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)

    val result = engine.process(Double.NaN, 700L)

    assertEquals(RepetitionPhase.SEEKING_TOP, result.phase)
    assertEquals(RepetitionEvent.TRACKING_RESET, result.event)
  }

  @Test
  fun resetsMovementAfterLongTrackingLoss() {
    val engine = engine()
    engine.process(160.0, 0L)
    engine.process(160.0, 100L)
    engine.process(120.0, 250L)
    engine.process(75.0, 450L)
    engine.process(75.0, 550L)

    val missing = engine.trackingLost(1_100L)

    assertEquals(RepetitionPhase.SEEKING_TOP, missing.phase)
    assertEquals(RepetitionEvent.TRACKING_RESET, missing.event)
  }

  @Test
  fun resetsOnRegressedTimestamp() {
    val engine = engine()
    engine.process(160.0, 1_000L)
    engine.process(160.0, 1_100L)

    val result = engine.process(75.0, 900L)

    assertEquals(RepetitionPhase.SEEKING_TOP, result.phase)
    assertEquals(RepetitionEvent.TRACKING_RESET, result.event)
  }

  @Test
  fun filteredFullCycleCountsOnceAtCommonFrameRates() {
    listOf(15, 30, 60).forEach { fps ->
      val engine = engine()
      val filter = TemporalAngleFilter()
      var result = RepetitionEngineResult(0, RepetitionPhase.SEEKING_TOP, RepetitionEvent.NONE)
      val totalFrames = fps * 4
      for (frame in 0..totalFrames) {
        val timestamp = frame * 4_000L / totalFrames
        result = engine.process(filter.process(replayAngle(timestamp), timestamp), timestamp)
      }
      assertEquals("fps=$fps", 1, result.repetitions)
    }
  }

  private fun replayAngle(timestampMs: Long): Double = when {
    timestampMs <= 600L -> 160.0
    timestampMs <= 1_400L -> 160.0 - 90.0 * ((timestampMs - 600L) / 800.0)
    timestampMs <= 1_900L -> 70.0
    timestampMs <= 2_700L -> 70.0 + 90.0 * ((timestampMs - 1_900L) / 800.0)
    else -> 160.0
  }
}
