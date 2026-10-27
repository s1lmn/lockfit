package expo.modules.lockfitnative

import org.junit.Assert.assertEquals
import org.junit.Test

class UsageAggregationTest {
  @Test
  fun aggregatesMultipleForegroundSessions() {
    val result = aggregateForegroundMillis(
      packageNames = setOf("com.example.social"),
      events = listOf(
        AppLifecycleEvent("com.example.social", 100L, true),
        AppLifecycleEvent("com.example.social", 500L, false),
        AppLifecycleEvent("com.example.social", 800L, true),
        AppLifecycleEvent("com.example.social", 1_000L, false)
      ),
      intervalStartMs = 0L,
      intervalEndMs = 2_000L
    )

    assertEquals(600L, result["com.example.social"])
  }

  @Test
  fun closesCurrentlyForegroundSessionAtNow() {
    val result = aggregateForegroundMillis(
      packageNames = setOf("com.example.social"),
      events = listOf(AppLifecycleEvent("com.example.social", 250L, true)),
      intervalStartMs = 0L,
      intervalEndMs = 1_000L
    )

    assertEquals(750L, result["com.example.social"])
  }

  @Test
  fun ignoresUnknownPackagesAndOrphanPauses() {
    val result = aggregateForegroundMillis(
      packageNames = setOf("com.example.social"),
      events = listOf(
        AppLifecycleEvent("com.other.app", 100L, true),
        AppLifecycleEvent("com.example.social", 500L, false)
      ),
      intervalStartMs = 0L,
      intervalEndMs = 1_000L
    )

    assertEquals(0L, result["com.example.social"])
  }

  @Test
  fun duplicateResumeDoesNotDoubleCount() {
    val result = aggregateForegroundMillis(
      packageNames = setOf("com.example.social"),
      events = listOf(
        AppLifecycleEvent("com.example.social", 100L, true),
        AppLifecycleEvent("com.example.social", 200L, true),
        AppLifecycleEvent("com.example.social", 500L, false)
      ),
      intervalStartMs = 0L,
      intervalEndMs = 1_000L
    )

    assertEquals(400L, result["com.example.social"])
  }

  @Test
  fun sortsOutOfOrderEventsAndKeepsPackagesIndependent() {
    val result = aggregateForegroundMillis(
      packageNames = setOf("com.example.one", "com.example.two"),
      events = listOf(
        AppLifecycleEvent("com.example.one", 500L, false),
        AppLifecycleEvent("com.example.two", 700L, false),
        AppLifecycleEvent("com.example.one", 100L, true),
        AppLifecycleEvent("com.example.two", 300L, true)
      ),
      intervalStartMs = 0L,
      intervalEndMs = 1_000L
    )

    assertEquals(400L, result["com.example.one"])
    assertEquals(400L, result["com.example.two"])
  }

  @Test
  fun ignoresEventsOutsideRequestedDay() {
    val result = aggregateForegroundMillis(
      packageNames = setOf("com.example.social"),
      events = listOf(
        AppLifecycleEvent("com.example.social", 99L, true),
        AppLifecycleEvent("com.example.social", 150L, true),
        AppLifecycleEvent("com.example.social", 250L, false),
        AppLifecycleEvent("com.example.social", 301L, true)
      ),
      intervalStartMs = 100L,
      intervalEndMs = 300L
    )

    assertEquals(100L, result["com.example.social"])
  }
}
