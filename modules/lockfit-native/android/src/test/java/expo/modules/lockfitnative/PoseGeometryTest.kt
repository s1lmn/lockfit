package expo.modules.lockfitnative

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PoseGeometryTest {
  @Test
  fun calculatesKnownAngles() {
    assertEquals(
      90.0,
      PoseGeometry.jointAngle(PosePoint(1.0, 0.0), PosePoint(0.0, 0.0), PosePoint(0.0, 1.0))!!,
      0.001
    )
    assertEquals(
      180.0,
      PoseGeometry.jointAngle(PosePoint(-1.0, 0.0), PosePoint(0.0, 0.0), PosePoint(1.0, 0.0))!!,
      0.001
    )
  }

  @Test
  fun angleIsInvariantToTranslationScaleAndMirror() {
    val original = PoseGeometry.jointAngle(
      PosePoint(1.0, 0.0), PosePoint(0.0, 0.0), PosePoint(0.5, 1.0)
    )!!
    val transformed = PoseGeometry.jointAngle(
      PosePoint(8.0, 5.0), PosePoint(10.0, 5.0), PosePoint(9.0, 7.0)
    )!!

    assertEquals(original, transformed, 0.001)
  }

  @Test
  fun rejectsDegenerateSegments() {
    assertNull(
      PoseGeometry.jointAngle(PosePoint(0.0, 0.0), PosePoint(0.0, 0.0), PosePoint(1.0, 0.0))
    )
  }
}
