package com.inigocode.kuralheart.data

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.core.content.edit
import androidx.documentfile.provider.DocumentFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.time.format.DateTimeFormatter

/**
 * Backups: one file, sealed with the person's passphrase, written to a folder they pick or synced to their Google
 * Drive. Either way the file can only be opened with the passphrase; Google and the folder's app see a locked file.
 */
class Backup(private val context: Context, private val prefs: Prefs, private val journal: Journal, private val photos: Photos) {
    private val secret = context.getSharedPreferences("backup_secret", Context.MODE_PRIVATE)

    val hasPassphrase: Boolean get() = secret.contains("pass")

    /**
     * Keep the passphrase sealed by the device key. It is kept (not just a derived key) because each phone's backup
     * has its own salt, and syncing must open a file made on another phone.
     */
    suspend fun setPassphrase(pass: CharArray) = withContext(Dispatchers.Default) {
        val bytes = String(pass).toByteArray()
        secret.edit { putString("pass", Base64.encodeToString(Crypto.seal(bytes), Base64.NO_WRAP)) }
        bytes.fill(0)
    }

    fun forget() = secret.edit { clear() }

    private fun storedPass(): CharArray =
        String(Crypto.open(Base64.decode(secret.getString("pass", null) ?: error("Set a passphrase first."), Base64.NO_WRAP))).toCharArray()

    /** The whole journal, photos included, sealed with the passphrase. */
    suspend fun exportBytes(): ByteArray = withContext(Dispatchers.Default) {
        val shots = JSONObject()
        for (e in journal.entries) for (id in e.photos) photos.jpeg(id)?.let { shots.put(id, Base64.encodeToString(it, Base64.NO_WRAP)) }
        val payload = JSONObject()
            .put("format", 2)
            .put("created", Journal.now())
            .put("prefs", prefs.exportJson())
            .put("entries", journal.exportJson())
            .put("photos", shots)
            .toString().toByteArray()
        val salt = Crypto.newSalt()
        val pass = storedPass()
        val key = Crypto.deriveKey(pass, salt)
        pass.fill(' ')
        Crypto.sealBackup(payload, key, salt).also { key.fill(0) }
    }

    /** Open a sealed backup and merge it in. Uses [pass] if given, otherwise the stored passphrase. */
    suspend fun importBytes(bytes: ByteArray, pass: CharArray? = null): Journal.MergeResult {
        val (entries, prefsJson) = withContext(Dispatchers.Default) {
            val header = Crypto.readHeader(bytes)
            val p = pass ?: storedPass()
            val key = Crypto.deriveKey(p, header.salt, header.rounds)
            if (pass == null) p.fill(' ')
            val plain = try {
                Crypto.openBackup(bytes, key)
            } catch (e: Exception) {
                throw IllegalArgumentException("That passphrase doesn't open this backup.")
            } finally {
                key.fill(0)
            }
            val o = JSONObject(plain.decodeToString())
            o.optJSONObject("photos")?.let { shots -> for (id in shots.keys()) photos.putJpeg(id, Base64.decode(shots.getString(id), Base64.NO_WRAP)) }
            val arr = o.getJSONArray("entries")
            List(arr.length()) { Entry.fromJson(arr.getJSONObject(it)) } to o.optJSONObject("prefs")
        }
        prefsJson?.let { mergeHistory(it) }
        return journal.merge(entries)
    }

    /** Write the backup into the chosen folder. Returns the file's size in bytes. */
    suspend fun backupNow(): Long {
        val tree = Uri.parse(prefs.backupTree.ifEmpty { error("Choose a folder first.") })
        val sealed = exportBytes()
        withContext(Dispatchers.IO) {
            val dir = DocumentFile.fromTreeUri(context, tree) ?: error("That folder can't be opened. Choose it again.")
            val file = dir.findFile(FILE_NAME) ?: dir.createFile("application/octet-stream", FILE_NAME) ?: error("The folder refused a new file.")
            context.contentResolver.openOutputStream(file.uri, "wt")!!.use { it.write(sealed) }
        }
        prefs.lastBackup = Journal.now()
        return sealed.size.toLong()
    }

    suspend fun restore(file: Uri, pass: CharArray): Journal.MergeResult {
        val bytes = withContext(Dispatchers.IO) { context.contentResolver.openInputStream(file)!!.use { it.readBytes() } }
        return importBytes(bytes, pass)
    }

    /** Carry over the history that belongs to the journal (seals, the day log, the start date); keep this phone's choices. */
    private fun mergeHistory(incoming: JSONObject) {
        val sp = context.getSharedPreferences("kural_heart", Context.MODE_PRIVATE)
        sp.edit {
            for (k in listOf("seals", "day_log")) {
                if (!incoming.has(k)) continue
                val mine = JSONObject(sp.getString(k, "{}")!!)
                val theirs = JSONObject(incoming.getString(k))
                for (key in theirs.keys()) if (!mine.has(key)) mine.put(key, theirs.get(key))
                putString(k, mine.toString())
            }
            for (k in listOf("saved_kurals", "read_kurals")) {
                if (!incoming.has(k)) continue
                val merged = (sp.getString(k, "")!!.split(',') + incoming.getString(k).split(',')).filter { it.isNotBlank() }.toSet()
                putString(k, merged.joinToString(","))
            }
            val started = incoming.optString("started_on")
            val mineStarted = sp.getString("started_on", "") ?: ""
            if (started.isNotEmpty() && (mineStarted.isEmpty() || started < mineStarted)) putString("started_on", started)
        }
        prefs.reloadAll()
    }

    /** Every page as plain text, newest first, into a file the person chose. Not encrypted: it says so in the UI. */
    suspend fun exportText(target: Uri, pack: Pack) = withContext(Dispatchers.IO) {
        val fmt = DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy")
        val text = buildString {
            appendLine("Kural Heart · ${journal.entries.size} pages")
            appendLine()
            for (e in journal.entries) {
                val k = pack.kural(e.kural)
                appendLine(e.date.format(fmt))
                appendLine("Kural ${k.n}: ${k.a} / ${k.b}")
                listOfNotNull(e.place?.name, e.weather?.let { w -> w.tempC?.let { "${w.kind}, ${it.toInt()}°C" } ?: w.kind }, e.tags.takeIf { it.isNotEmpty() }?.joinToString(" ") { "#$it" })
                    .takeIf { it.isNotEmpty() }?.let { appendLine(it.joinToString(" · ")) }
                appendLine()
                appendLine(e.text)
                appendLine()
                appendLine("———")
                appendLine()
            }
        }
        context.contentResolver.openOutputStream(target, "wt")!!.use { it.write(text.toByteArray()) }
    }

    companion object {
        const val FILE_NAME = "Kural Heart backup.khb"
    }
}
