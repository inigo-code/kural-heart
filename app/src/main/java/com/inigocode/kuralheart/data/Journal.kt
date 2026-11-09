package com.inigocode.kuralheart.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

/** One journal page. The text and mood are stored sealed (see [Crypto]); the rest is bookkeeping. */
data class Entry(
    val id: String = UUID.randomUUID().toString(),
    val date: LocalDate,
    val created: Long,
    val updated: Long,
    val kural: Int,
    val lens: Int,
    val period: String,
    val mood: String?,
    val text: String,
) {
    val isTamil: Boolean get() = text.any { it in '஀'..'௿' }
    val wordCount: Int get() = text.split(Regex("\\s+")).count { it.isNotBlank() }

    fun toJson(): JSONObject = JSONObject()
        .put("id", id).put("date", date.toString()).put("created", created).put("updated", updated)
        .put("kural", kural).put("lens", lens).put("period", period).put("mood", mood ?: JSONObject.NULL).put("text", text)

    companion object {
        fun fromJson(o: JSONObject) = Entry(
            o.getString("id"), LocalDate.parse(o.getString("date")), o.getLong("created"), o.getLong("updated"),
            o.getInt("kural"), o.optInt("lens"), o.optString("period"), if (o.isNull("mood")) null else o.optString("mood"),
            o.getString("text"),
        )
    }
}

private class JournalDb(context: Context) : SQLiteOpenHelper(context, "journal.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE entries (id TEXT PRIMARY KEY, date TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, " +
                "kural INTEGER NOT NULL, lens INTEGER NOT NULL, period TEXT NOT NULL, body BLOB NOT NULL)"
        )
        db.execSQL("CREATE INDEX entries_date ON entries(date)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit
}

/**
 * The journal: every page on this phone, decrypted into memory once at start (a journal is small),
 * newest first. Writes go to SQLite straight away, so a page survives the app being killed.
 */
class Journal(context: Context) {
    private val db = JournalDb(context.applicationContext)
    val entries = mutableStateListOf<Entry>()
    var loaded by mutableStateOf(false)
        private set

    suspend fun load() = withContext(Dispatchers.IO) {
        val out = mutableListOf<Entry>()
        db.readableDatabase.rawQuery("SELECT id, date, created, updated, kural, lens, period, body FROM entries", null).use { c ->
            while (c.moveToNext()) {
                val body = runCatching { JSONObject(Crypto.open(c.getBlob(7)).decodeToString()) }.getOrNull() ?: continue
                out += Entry(
                    c.getString(0), LocalDate.parse(c.getString(1)), c.getLong(2), c.getLong(3), c.getInt(4), c.getInt(5),
                    c.getString(6), if (body.isNull("mood")) null else body.optString("mood"), body.getString("text"),
                )
            }
        }
        withContext(Dispatchers.Main) {
            entries.clear()
            entries.addAll(out.sortedWith(compareByDescending<Entry> { it.date }.thenByDescending { it.created }))
            loaded = true
        }
    }

    suspend fun save(e: Entry) {
        withContext(Dispatchers.IO) { write(e) }
        val i = entries.indexOfFirst { it.id == e.id }
        if (i >= 0) entries[i] = e else entries.add(0, e)
        entries.sortWith(compareByDescending<Entry> { it.date }.thenByDescending { it.created })
    }

    private fun write(e: Entry) {
        val body = JSONObject().put("text", e.text).put("mood", e.mood ?: JSONObject.NULL).toString().toByteArray()
        val v = ContentValues().apply {
            put("id", e.id); put("date", e.date.toString()); put("created", e.created); put("updated", e.updated)
            put("kural", e.kural); put("lens", e.lens); put("period", e.period); put("body", Crypto.seal(body))
        }
        db.writableDatabase.insertWithOnConflict("entries", null, v, SQLiteDatabase.CONFLICT_REPLACE)
    }

    suspend fun delete(id: String): Entry? {
        val e = entries.firstOrNull { it.id == id } ?: return null
        withContext(Dispatchers.IO) { db.writableDatabase.delete("entries", "id = ?", arrayOf(id)) }
        entries.remove(e)
        return e
    }

    suspend fun deleteAll() {
        withContext(Dispatchers.IO) { db.writableDatabase.delete("entries", null, null) }
        entries.clear()
    }

    /** Merge pages from a backup. Same id: the newer edit wins, unless both changed, then both are kept. */
    suspend fun merge(incoming: List<Entry>): MergeResult {
        var added = 0
        var kept = 0
        withContext(Dispatchers.IO) {
            for (e in incoming) {
                val mine = entries.firstOrNull { it.id == e.id }
                when {
                    mine == null -> { write(e); added++ }
                    mine.updated == e.updated -> Unit
                    mine.text == e.text -> Unit
                    else -> { write(e.copy(id = UUID.randomUUID().toString())); kept++ }
                }
            }
        }
        load()
        return MergeResult(added, kept)
    }

    fun exportJson(): JSONArray = JSONArray().apply { entries.forEach { put(it.toJson()) } }

    fun forDay(date: LocalDate): List<Entry> = entries.filter { it.date == date }

    fun search(q: String): List<Entry> {
        val s = q.trim()
        if (s.isEmpty()) return entries
        return entries.filter { it.text.contains(s, ignoreCase = true) || it.kural.toString() == s }
    }

    data class MergeResult(val added: Int, val keptBoth: Int)

    companion object {
        fun now(): Long = Instant.now().toEpochMilli()
        fun today(): LocalDate = LocalDate.now(ZoneId.systemDefault())
    }
}
