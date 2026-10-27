package expo.modules.lockfitnative

import org.junit.Assert.assertEquals
import org.junit.Test

class BlockingDecisionEngineTest {
  @Test
  fun allowsUsageBeforeLimit() {
    assertEquals(
      BlockingDecision.ALLOW,
      decideBlocking(29 * 60_000L, 30, 0L, 1_000L)
    )
  }

  @Test
  fun blocksAtExactLimit() {
    assertEquals(
      BlockingDecision.BLOCK_LIMIT_REACHED,
      decideBlocking(30 * 60_000L, 30, 0L, 1_000L)
    )
  }

  @Test
  fun activeExerciseUnlockOverridesReachedLimit() {
    assertEquals(
      BlockingDecision.ALLOW,
      decideBlocking(60 * 60_000L, 30, 10_000L, 9_999L)
    )
  }

  @Test
  fun expiredExerciseUnlockBlocksAgain() {
    assertEquals(
      BlockingDecision.BLOCK_LIMIT_REACHED,
      decideBlocking(60 * 60_000L, 30, 10_000L, 10_000L)
    )
  }

  @Test
  fun invalidRuleFailsOpen() {
    assertEquals(BlockingDecision.ALLOW, decideBlocking(Long.MAX_VALUE, 0, 0L, 1L))
  }

  @Test
  fun schedulesCheckAtBaseLimit() {
    assertEquals(60_000L, nextBlockingCheckDelayMs(29 * 60_000L, 30, 0L, 5_000L))
  }

  @Test
  fun schedulesCheckAtTemporaryUnlockExpiry() {
    assertEquals(5_000L, nextBlockingCheckDelayMs(60 * 60_000L, 30, 15_000L, 10_000L))
  }
}
