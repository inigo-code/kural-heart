package com.inigocode.kuralheart.data

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
import java.net.URLEncoder
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Google Drive sync. The app asks only for Drive's app-data scope: a hidden folder that belongs to Kural Heart,
 * invisible in the Drive app and closed to other apps. The one file there is the passphrase-sealed backup.
 *
 * Sync: download the Drive copy (if any), merge it into this phone, then upload the merged journal. Two phones
 * that sync take turns this way and end up with every page; a page edited on both is kept twice.
 *
 * Setup the owner does once in Google Cloud Console (docs/GOOGLE_DRIVE_SETUP.md): enable the Drive API, set up the
 * consent screen, and add an Android OAuth client for package com.inigocode.kuralheart with each signing key's SHA-1.
 */
class Drive(private val context: Context, private val backup: Backup, private val prefs: Prefs) {
    private val scope = Scope("https://www.googleapis.com/auth/drive.appdata")
    private val request = AuthorizationRequest.builder().setRequestedScopes(listOf(scope)).build()

    /** Either a token, or an intent the person must see to grant access. */
    sealed interface Auth {
        data class Token(val token: String) : Auth
        data class NeedsConsent(val intent: PendingIntent) : Auth
    }

    suspend fun authorize(): Auth = suspendCancellableCoroutine { c ->
        Identity.getAuthorizationClient(context).authorize(request)
            .addOnSuccessListener { r -> c.resume(toAuth(r)) }
            .addOnFailureListener { c.resumeWithException(it) }
    }

    fun tokenFromConsent(data: Intent?): String? =
        runCatching { Identity.getAuthorizationClient(context).getAuthorizationResultFromIntent(data).accessToken }.getOrNull()

    private fun toAuth(r: AuthorizationResult): Auth =
        if (r.hasResolution()) Auth.NeedsConsent(r.pendingIntent!!) else Auth.Token(r.accessToken!!)

    /** Sync with a token the person has already granted. Returns what came in from Drive. */
    suspend fun sync(token: String): Journal.MergeResult {
        val auth = mapOf("Authorization" to "Bearer $token")
        val q = URLEncoder.encode("name = '$NAME'", "UTF-8")
        val list = JSONObject(Net.text("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=$q&fields=files(id,modifiedTime)", auth))
        val files = list.getJSONArray("files")
        val id = if (files.length() > 0) files.getJSONObject(0).getString("id") else null
        var result = Journal.MergeResult(0, 0)
        if (id != null) {
            val remote = Net.request("https://www.googleapis.com/drive/v3/files/$id?alt=media", headers = auth)
            result = backup.importBytes(remote)
        }
        val sealed = backup.exportBytes()
        if (id == null) {
            val boundary = "kuralheart${System.nanoTime()}"
            val meta = JSONObject().put("name", NAME).put("parents", listOf("appDataFolder").let { org.json.JSONArray(it) }).toString()
            val body = ("--$boundary\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n$meta\r\n" +
                "--$boundary\r\nContent-Type: application/octet-stream\r\n\r\n").toByteArray() + sealed + "\r\n--$boundary--\r\n".toByteArray()
            Net.request(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", "POST", auth, body,
                "multipart/related; boundary=$boundary",
            )
        } else {
            Net.request("https://www.googleapis.com/upload/drive/v3/files/$id?uploadType=media", "PATCH", auth, sealed, "application/octet-stream")
        }
        prefs.lastDriveSync = Journal.now()
        return result
    }

    /** For the nightly alarm: sync only if access was granted before and needs no screen. */
    suspend fun syncQuietly(): Boolean {
        if (!prefs.driveOn || !backup.hasPassphrase) return false
        val a = runCatching { authorize() }.getOrNull() as? Auth.Token ?: return false
        return runCatching { sync(a.token) }.isSuccess
    }

    companion object {
        const val NAME = "kural-heart.khb"
    }
}
