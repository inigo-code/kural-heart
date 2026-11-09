package com.inigocode.kuralheart.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.UUID

/**
 * Photos attached to pages. Each is shrunk to at most 2048 pixels on its long side, saved as JPEG, and sealed with
 * the device key like the journal text, so a photo can't be opened from the app's files on its own.
 */
class Photos(context: Context) {
    private val app = context.applicationContext
    private val dir = File(app.filesDir, "photos").apply { mkdirs() }
    private val cache = HashMap<String, Bitmap>()

    suspend fun add(uri: Uri): String = withContext(Dispatchers.IO) {
        val bmp = decode(uri)
        store(bmp)
    }

    suspend fun store(bmp: Bitmap): String = withContext(Dispatchers.IO) {
        val scaled = shrink(bmp, 2048)
        val jpeg = ByteArrayOutputStream().also { scaled.compress(Bitmap.CompressFormat.JPEG, 85, it) }.toByteArray()
        val id = UUID.randomUUID().toString()
        File(dir, "$id.bin").writeBytes(Crypto.seal(jpeg))
        id
    }

    suspend fun load(id: String, maxSide: Int = 1600): Bitmap? = withContext(Dispatchers.IO) {
        cache["$id@$maxSide"]?.let { return@withContext it }
        val f = File(dir, "$id.bin")
        if (!f.exists()) return@withContext null
        val bytes = runCatching { Crypto.open(f.readBytes()) }.getOrNull() ?: return@withContext null
        val full = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return@withContext null
        shrink(full, maxSide).also { synchronized(cache) { if (cache.size > 40) cache.clear(); cache["$id@$maxSide"] = it } }
    }

    /** The sealed bytes' plain JPEG, for backups (which are sealed again with the passphrase). */
    fun jpeg(id: String): ByteArray? = File(dir, "$id.bin").takeIf { it.exists() }?.let { runCatching { Crypto.open(it.readBytes()) }.getOrNull() }

    fun putJpeg(id: String, jpeg: ByteArray) {
        val f = File(dir, "$id.bin")
        if (!f.exists()) f.writeBytes(Crypto.seal(jpeg))
    }

    /** Remove photos no page uses any more (after deletes, and after undo windows have passed). */
    fun purge(keep: Set<String>) {
        dir.listFiles()?.forEach { if (it.nameWithoutExtension !in keep) it.delete() }
    }

    fun deleteAll() {
        dir.listFiles()?.forEach { it.delete() }
        cache.clear()
    }

    private fun decode(uri: Uri): Bitmap =
        if (Build.VERSION.SDK_INT >= 28) {
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(app.contentResolver, uri)) { d, info, _ ->
                val side = maxOf(info.size.width, info.size.height)
                if (side > 2048) d.setTargetSampleSize(side / 2048)
                d.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            }
        } else {
            app.contentResolver.openInputStream(uri)!!.use { BitmapFactory.decodeStream(it) }
        }

    private fun shrink(b: Bitmap, maxSide: Int): Bitmap {
        val side = maxOf(b.width, b.height)
        if (side <= maxSide) return b
        val k = maxSide.toFloat() / side
        return Bitmap.createScaledBitmap(b, (b.width * k).toInt(), (b.height * k).toInt(), true)
    }
}
