package expo.modules.kuralcrypto

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * PBKDF2-HMAC-SHA256 from Android itself, the same call the Kotlin app made for its backups. In JavaScript the
 * 210,000 rounds take most of a minute; here they take a moment. Runs off the main thread (AsyncFunction).
 */
class KuralCryptoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KuralCrypto")

    AsyncFunction("pbkdf2Sha256") { password: String, salt: ByteArray, rounds: Int, bytes: Int ->
      val spec = PBEKeySpec(password.toCharArray(), salt, rounds, bytes * 8)
      try {
        SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
      } finally {
        spec.clearPassword()
      }
    }
  }
}
