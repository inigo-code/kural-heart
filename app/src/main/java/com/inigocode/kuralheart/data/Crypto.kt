package com.inigocode.kuralheart.data

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.nio.ByteBuffer
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * Two kinds of encryption, both AES-256-GCM:
 *  - On the phone, journal text is sealed with a key held in the Android Keystore. The key never leaves
 *    the secure hardware, so the database file is unreadable on its own.
 *  - Backups are sealed with a key derived from the person's passphrase (PBKDF2, 210,000 rounds), so a
 *    backup can be opened on a new phone and by no one else.
 */
object Crypto {
    private const val ALIAS = "kural_heart_journal"
    private const val GCM_BITS = 128

    private fun deviceKey(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getKey(ALIAS, null) as? SecretKey)?.let { return it }
        val gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        gen.init(
            KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return gen.generateKey()
    }

    /** Seal with the device key. Output: 12-byte IV, then ciphertext and tag. */
    fun seal(plain: ByteArray): ByteArray {
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.ENCRYPT_MODE, deviceKey())
        return c.iv + c.doFinal(plain)
    }

    fun open(sealed: ByteArray): ByteArray {
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.DECRYPT_MODE, deviceKey(), GCMParameterSpec(GCM_BITS, sealed, 0, 12))
        return c.doFinal(sealed, 12, sealed.size - 12)
    }

    fun deleteDeviceKey() {
        KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry(ALIAS)
    }

    // --- passphrase backups ---

    private val MAGIC = "KHB1".toByteArray()
    const val ROUNDS = 210_000

    fun deriveKey(passphrase: CharArray, salt: ByteArray, rounds: Int = ROUNDS): ByteArray {
        val spec = PBEKeySpec(passphrase, salt, rounds, 256)
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded.also { spec.clearPassword() }
    }

    fun newSalt(): ByteArray = ByteArray(16).also { SecureRandom().nextBytes(it) }

    /** File layout: "KHB1", rounds (int), 16-byte salt, 12-byte IV, ciphertext and tag. */
    fun sealBackup(plain: ByteArray, key: ByteArray, salt: ByteArray, rounds: Int = ROUNDS): ByteArray {
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"))
        c.updateAAD(MAGIC)
        val body = c.doFinal(plain)
        return ByteBuffer.allocate(4 + 4 + 16 + 12 + body.size).put(MAGIC).putInt(rounds).put(salt).put(c.iv).put(body).array()
    }

    class BackupHeader(val rounds: Int, val salt: ByteArray)

    fun readHeader(file: ByteArray): BackupHeader {
        require(file.size > 36 && file.copyOfRange(0, 4).contentEquals(MAGIC)) { "This isn't a Kural Heart backup." }
        val b = ByteBuffer.wrap(file, 4, 20)
        val rounds = b.int
        return BackupHeader(rounds, file.copyOfRange(8, 24))
    }

    /** Throws if the passphrase is wrong or the file was changed. */
    fun openBackup(file: ByteArray, key: ByteArray): ByteArray {
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(GCM_BITS, file, 24, 12))
        c.updateAAD(MAGIC)
        return c.doFinal(file, 36, file.size - 36)
    }
}
