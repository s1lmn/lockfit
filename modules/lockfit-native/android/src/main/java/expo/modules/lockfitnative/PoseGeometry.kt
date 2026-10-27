package expo.modules.lockfitnative

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot

internal data class PosePoint(val x: Double, val y: Double)

internal object PoseGeometry {
  fun jointAngle(first: PosePoint, joint: PosePoint, last: PosePoint): Double? {
    val firstLength = hypot(first.x - joint.x, first.y - joint.y)
    val lastLength = hypot(last.x - joint.x, last.y - joint.y)
    if (firstLength < MIN_SEGMENT_LENGTH || lastLength < MIN_SEGMENT_LENGTH) {
      return null
    }

    val radians = atan2(last.y - joint.y, last.x - joint.x) -
      atan2(first.y - joint.y, first.x - joint.x)
    val degrees = abs(Math.toDegrees(radians))
    return if (degrees > 180.0) 360.0 - degrees else degrees
  }

  private const val MIN_SEGMENT_LENGTH = 1e-6
}
