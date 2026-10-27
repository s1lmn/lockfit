package expo.modules.lockfitnative

import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PasswordHasherTest {
  @Test
  fun verifiesCorrectPasswordAndRejectsWrongOne() {
    val encoded = PasswordHasher.hash("correct horse battery staple")

    assertTrue(PasswordHasher.verify("correct horse battery staple", encoded))
    assertFalse(PasswordHasher.verify("wrong password", encoded))
  }

  @Test
  fun uniqueSaltCreatesDifferentHashes() {
    val first = PasswordHasher.hash("same password")
    val second = PasswordHasher.hash("same password")

    assertNotEquals(first, second)
    assertTrue(PasswordHasher.verify("same password", first))
    assertTrue(PasswordHasher.verify("same password", second))
  }

  @Test
  fun malformedHashesFailClosed() {
    assertFalse(PasswordHasher.verify("password", "plain text"))
    assertFalse(PasswordHasher.verify("password", "pbkdf2_sha256\$999999999\$bad\$bad"))
    assertFalse(PasswordHasher.verify("password", "pbkdf2_sha256\$210000\$bad"))
  }

  @Test
  fun supportsUnicodePasswords() {
    val encoded = PasswordHasher.hash("Надёжный пароль 2026")

    assertTrue(PasswordHasher.verify("Надёжный пароль 2026", encoded))
    assertFalse(PasswordHasher.verify("Надежный пароль 2026", encoded))
  }
}
