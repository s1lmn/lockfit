package expo.modules.lockfitnative

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class StableSideSelectorTest {
  @Test
  fun ignoresShortConfidenceFlicker() {
    val selector = StableSideSelector<String>(switchHoldMs = 180L)
    selector.select(mapOf("left" to 0.9, "right" to 0.5), 0L)
    val flicker = selector.select(mapOf("left" to 0.5, "right" to 0.9), 50L)
    val restored = selector.select(mapOf("left" to 0.9, "right" to 0.5), 100L)

    assertEquals("left", flicker.side)
    assertEquals("left", restored.side)
    assertFalse(restored.changed)
  }

  @Test
  fun switchesAfterElapsedTimeNotFrameCount() {
    listOf(15, 60).forEach { fps ->
      val selector = StableSideSelector<String>(switchHoldMs = 180L)
      selector.select(mapOf("left" to 0.9, "right" to 0.5), 0L)
      var result = SideSelection<String>("left", false)
      for (frame in 1..fps) {
        val timestamp = 100L + frame * 1_000L / fps
        result = selector.select(mapOf("left" to 0.4, "right" to 0.9), timestamp)
        if (result.changed) break
      }
      assertEquals("right", result.side)
      assertTrue(result.changed)
    }
  }

  @Test
  fun waitsBeforeUsingOtherSideWhenCurrentDisappears() {
    val selector = StableSideSelector<String>(switchHoldMs = 180L)
    selector.select(mapOf("left" to 0.9), 0L)

    assertNull(selector.select(mapOf("right" to 0.9), 50L).side)
    assertNull(selector.select(mapOf("right" to 0.9), 150L).side)
    assertEquals("right", selector.select(mapOf("right" to 0.9), 240L).side)
  }
}
