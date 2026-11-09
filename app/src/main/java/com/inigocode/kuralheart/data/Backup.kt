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
 * Backups: one encrypted file in a folder the person picks (a Google Drive folder works through the
 * Drive app's document provider). Kural Heart never touches the network; the folder's app syncs it.
 */
class Backup(private val context: Context, private val prefs: Prefs, private val journal: Journal) {
    private val secret = context.getSharedPreferences("backup_secret", Context.MODE_PRIVATE)

    val hasPassphrase: Boolean get() = secret.contains("key")

    /** Derive the backup key once and keep it sealed by the device key, so nightly backups need no typing. */
    suspend fun setPassphrase(pass: CharArray) = withContext(Dispatchers.Default) {
        val salt = Crypto.newSalt()
        val key = Crypto.deriveKey(pass, salt)
        secret.edit {
            putString("key", Base64.encodeToString(Crypto.seal(key), Base64.NO_WRAP))
            putString("salt", Base64.encodeToString(salt, Base64.NO_WRAP))
        }
        key.fill(0)
    }

    fun forget() = secret.edit { clear() }

    private fun storedKey(): Pair<ByteArray, ByteArray> {
        val key = Crypto.open(Base64.decode(secret.getString("key", null), Base64.NO_WRAP))
        val salt = Base64.decode(secret.getString("salt", null), Base64.NO_WRAP)
        return key to salt
    }

    /** Write the backup into the chosen folder. Returns the file's size in bytes. */
    suspend fun backupNow(): Long = withContext(Dispatchers.IO) {
        val tree = Uri.parse(prefs.backupTree.ifEmpty { error("Choose a folder first.") })
        check(hasPassphrase) { "Set a passphrase first." }
        val dir = DocumentFile.fromTreeUri(context, tree) ?: error("That folder can't be opened. Choose it again.")
        val payload = JSONObject()
            .put("format", 1)
            .put("created", Journal.now())
            .put("prefs", prefs.exportJson())
            .put("entries", journal.exportJson())
            .toString().toByteArray()
        val (key, salt) = storedKey()
        val sealed = Crypto.sealBackup(payload, key, salt)
        key.fill(0)
        val file = dir.findFile(FILE_NAME) ?: dir.createFile("application/octet-stream", FILE_NAME) ?: error("The folder refused a new file.")
        context.contentResolver.openOutputStream(file.uri, "wt")!!.use { it.write(sealed) }
        prefs.lastBackup = Journal.now()
        sealed.size.toLong()
    }

    /** Open a backup file with its passphrase and merge it into this phone's journal. */
    suspend fun restore(file: Uri, pass: CharArray): Journal.MergeResult {
        val (entries, prefsJson) = withContext(Dispatchers.Default) {
            val bytes = context.contentResolver.openInputStream(file)!!.use { it.readBytes() }
            val header = Crypto.readHeader(bytes)
            val key = Crypto.deriveKey(pass, header.salt, header.rounds)
            val plain = try {
                Crypto.openBackup(bytes, key)
            } catch (e: Exception) {
                throw IllegalArgumentException("That passphrase doesn't open this backup.")
            } finally {
                key.fill(0)
            }
            val o = JSONObject(plain.decodeToString())
            val arr = o.getJSONArray("entries")
            List(arr.length()) { Entry.fromJson(arr.getJSONObject(it)) } to o.optJSONObject("prefs")
        }
        // Keep this phone's choices, but carry over the history that belongs to the journal.
        prefsJson?.let { p ->
            val keep = JSONObject()
            for (k in listOf("seals", "day_log", "started_on", "seed")) if (p.has(k)) keep.put(k, p.get(k))
            mergeHistory(keep)
        }
        return journal.merge(entries)
    }

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
            val started = incoming.optString("started_on")
            val mineStarted = sp.getString("started_on", "") ?: ""
            if (started.isNotEmpty() && (mineStarted.isEmpty() || started < mineStarted)) putString("started_on", started)
        }
        prefs.importJson(JSONObject())
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
