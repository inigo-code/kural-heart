package com.inigocode.kuralheart.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.inigocode.kuralheart.BuildConfig
import org.json.JSONObject
import java.io.File

/**
 * Over-the-air updates for copies installed from the website or GitHub (not from Google Play, which updates its own
 * copies and doesn't allow apps to install updates themselves; there [enabled] is false).
 *
 * The app reads the latest GitHub release of [BuildConfig.UPDATE_REPO]. A release carries the APK under the fixed
 * name kuralheart.apk (the Heart Apps rule) and its notes become the "What's new" text.
 */
object Updates {
    val enabled: Boolean get() = BuildConfig.SELF_UPDATE

    data class Release(val version: String, val notes: String, val apkUrl: String)

    suspend fun latest(): Release? {
        if (!enabled) return null
        val o = JSONObject(Net.text("https://api.github.com/repos/${BuildConfig.UPDATE_REPO}/releases/latest", mapOf("Accept" to "application/vnd.github+json")))
        val version = o.getString("tag_name").removePrefix("v")
        val assets = o.getJSONArray("assets")
        val apk = (0 until assets.length()).map { assets.getJSONObject(it) }.firstOrNull { it.getString("name") == "kuralheart.apk" } ?: return null
        return Release(version, o.optString("body"), apk.getString("browser_download_url"))
    }

    fun isNewer(version: String, than: String = BuildConfig.VERSION_NAME): Boolean {
        fun parts(v: String) = v.split('.', '-').mapNotNull { it.toIntOrNull() }
        val a = parts(version)
        val b = parts(than)
        for (i in 0 until maxOf(a.size, b.size)) {
            val x = a.getOrElse(i) { 0 }
            val y = b.getOrElse(i) { 0 }
            if (x != y) return x > y
        }
        return false
    }

    suspend fun download(context: Context, r: Release): File {
        val bytes = Net.request(r.apkUrl)
        val dir = File(context.cacheDir, "updates").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
        return File(dir, "kuralheart-${r.version}.apk").apply { writeBytes(bytes) }
    }

    /** Hand the APK to Android's installer. The person confirms; nothing installs silently. */
    fun install(context: Context, apk: File) {
        if (Build.VERSION.SDK_INT >= 26 && !context.packageManager.canRequestPackageInstalls()) {
            context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")))
            return
        }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.share", apk)
        context.startActivity(
            Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}

/** "What's new" after every update (Heart Apps rule): a new id and plain lines for each version. */
object WhatsNew {
    const val ID = 10
    val en = listOf(
        "Bigger, clearer type, with a text size setting.",
        "A Kural library: browse all 133 chapters, search, filter, save couplets, and listen to them read aloud.",
        "Pope's 1886 verse and prose alongside Aiyar's English.",
        "Pages can hold photos, the weather, the place, tags and formatting, and their date and time can be changed.",
        "Filters for your journal, a profile, colours to choose from, and Google Drive sync.",
    )
    val ta = listOf(
        "பெரிய, தெளிவான எழுத்துகள்; எழுத்து அளவை மாற்றலாம்.",
        "குறள் நூலகம்: 133 அதிகாரங்களையும் பார்க்கலாம், தேடலாம், வடிகட்டலாம், சேமிக்கலாம், ஒலியாகக் கேட்கலாம்.",
        "ஐயருடன் போப்பின் 1886 செய்யுளும் உரைநடையும்.",
        "பக்கங்களில் படங்கள், வானிலை, இடம், குறிச்சொற்கள், எழுத்து வடிவம்; நாளும் நேரமும் மாற்றலாம்.",
        "நாட்குறிப்பு வடிகட்டிகள், சுயவிவரம், வண்ணத் தேர்வு, Google Drive ஒத்திசைவு.",
    )
}
