package com.inigocode.kuralheart.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * The app's only network code. Kural Heart goes online for three things the person turns on: Google Drive sync,
 * weather for a page, and checking for a new version. Nothing else, and never the journal in readable form.
 */
object Net {
    class HttpError(val code: Int, message: String) : Exception(message)

    suspend fun request(
        url: String,
        method: String = "GET",
        headers: Map<String, String> = emptyMap(),
        body: ByteArray? = null,
        contentType: String? = null,
    ): ByteArray = withContext(Dispatchers.IO) {
        val c = URL(url).openConnection() as HttpURLConnection
        try {
            c.requestMethod = if (method == "PATCH") "POST" else method
            if (method == "PATCH") c.setRequestProperty("X-HTTP-Method-Override", "PATCH")
            c.connectTimeout = 15_000
            c.readTimeout = 30_000
            c.setRequestProperty("User-Agent", "KuralHeart-Android")
            headers.forEach { (k, v) -> c.setRequestProperty(k, v) }
            if (body != null) {
                c.doOutput = true
                contentType?.let { c.setRequestProperty("Content-Type", it) }
                c.outputStream.use { it.write(body) }
            }
            val code = c.responseCode
            val stream = if (code in 200..299) c.inputStream else c.errorStream
            val bytes = stream?.use { s -> ByteArrayOutputStream().also { s.copyTo(it) }.toByteArray() } ?: ByteArray(0)
            if (code !in 200..299) throw HttpError(code, "HTTP $code: ${bytes.decodeToString().take(200)}")
            bytes
        } finally {
            c.disconnect()
        }
    }

    suspend fun text(url: String, headers: Map<String, String> = emptyMap()) = request(url, headers = headers).decodeToString()
}
