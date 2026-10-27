package expo.modules.lockfitnative

import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

internal object PasswordHasher {
  private const val HMAC_ALGORITHM = "HmacSHA256"
  private const val FORMAT_NAME = "pbkdf2_sha256"
  private const val ITERATIONS = 210_000
  private const val KEY_LENGTH_BITS = 256
  private const val SALT_BYTES = 16

  fun hash(password: String): String {
    require(password.length in 1..128) { "Password length is invalid" }
    val salt = ByteArray(SALT_BYTES).also(SecureRandom()::nextBytes)
    val derived = derive(password, salt, ITERATIONS)
    return listOf(
      FORMAT_NAME,
      ITERATIONS.toString(),
      encode(salt),
      encode(derived)
    ).joinToString("$")
  }

  fun verify(password: String, encoded: String): Boolean {
    val parts = encoded.split('$')
    if (parts.size != 4 || parts[0] != FORMAT_NAME) return false
    val iterations = parts[1].toIntOrNull()?.takeIf { it in 100_000..600_000 } ?: return false
    val salt = decode(parts[2])?.takeIf { it.size in 16..64 } ?: return false
    val expected = decode(parts[3])?.takeIf { it.size in 16..64 } ?: return false
    val actual = runCatching { derive(password, salt, iterations) }.getOrNull() ?: return false
    return MessageDigest.isEqual(expected, actual)
  }

  fun isEncoded(value: String): Boolean = value.startsWith("$FORMAT_NAME$")

  private fun derive(password: String, salt: ByteArray, iterations: Int): ByteArray {
    val passwordBytes = password.toByteArray(Charsets.UTF_8)
    return try {
      val mac = Mac.getInstance(HMAC_ALGORITHM).apply {
        init(SecretKeySpec(passwordBytes, HMAC_ALGORITHM))
      }
      val blockIndex = byteArrayOf(0, 0, 0, 1)
      var previous = mac.doFinal(salt + blockIndex)
      val derived = previous.copyOf()
      repeat(iterations - 1) {
        previous = mac.doFinal(previous)
        for (index in derived.indices) {
          derived[index] = (derived[index].toInt() xor previous[index].toInt()).toByte()
        }
      }
      derived.copyOf(KEY_LENGTH_BITS / 8)
    } finally {
      passwordBytes.fill(0)
    }
  }

  private fun encode(value: ByteArray): String = value.joinToString("") { byte ->
    "%02x".format(byte.toInt() and 0xff)
  }

  private fun decode(value: String): ByteArray? {
    if (value.length % 2 != 0 || !value.matches(Regex("^[0-9a-fA-F]+$"))) return null
    return runCatching {
      value.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
    }.getOrNull()
  }
}
