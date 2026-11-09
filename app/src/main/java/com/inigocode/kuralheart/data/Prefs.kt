package com.inigocode.kuralheart.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.edit
import org.json.JSONObject
import java.time.LocalDate
import kotlin.random.Random

enum class ThemeMode { Auto, Ivory, Midnight }

/**
 * Settings and small state, in SharedPreferences, mirrored into Compose state so screens update.
 * Nothing here is journal text; that lives encrypted in [Journal].
 */
class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("kural_heart", Context.MODE_PRIVATE)
    // Declared before the delegates below, which register themselves here as they are created.
    private val reloaders = mutableListOf<() -> Unit>()

    var onboarded by pref("onboarded", false)
    var tamil by pref("tamil", false)
    var theme by enumPref("theme", ThemeMode.Auto)
    var reduceMotion by pref("reduce_motion", false)
    var reminderOn by pref("reminder_on", true)
    var reminderMinutes by pref("reminder_minutes", 7 * 60)
    var lockOn by pref("lock_on", false)
    var backupTree by pref("backup_tree", "")
    var backupNightly by pref("backup_nightly", false)
    var lastBackup by pref("last_backup", 0L)
    var startedOn by pref("started_on", "")
    var lastLens by pref("last_lens", 0)

    /** A per-install number that shuffles the daily couplets, so two phones don't read in step. */
    val seed: Long
        get() = sp.getLong("seed", 0L).takeIf { it != 0L } ?: Random.nextLong().also { sp.edit { putLong("seed", it) } }

    /** Which couplet each day got, as ISO date to kural number. Days the app wasn't opened have none. */
    fun dayLog(): Map<String, Int> {
        val o = JSONObject(sp.getString("day_log", "{}")!!)
        return o.keys().asSequence().associateWith { o.getInt(it) }
    }

    fun logDay(date: LocalDate, kural: Int) {
        val o = JSONObject(sp.getString("day_log", "{}")!!)
        o.put(date.toString(), kural)
        sp.edit { putString("day_log", o.toString()) }
    }

    /** Seals earned, by id, with the date earned. */
    fun seals(): Map<String, String> {
        val o = JSONObject(sp.getString("seals", "{}")!!)
        return o.keys().asSequence().associateWith { o.getString(it) }
    }

    fun earnSeal(id: String, date: LocalDate) {
        val o = JSONObject(sp.getString("seals", "{}")!!)
        if (!o.has(id)) o.put(id, date.toString())
        sp.edit { putString("seals", o.toString()) }
        sealsVersion++
    }

    /** Bumped whenever seals change, so screens that read seals recompose. */
    var sealsVersion by mutableStateOf(0)
        private set

    fun exportJson(): JSONObject = JSONObject().apply {
        for ((k, v) in sp.all) if (k != "backup_tree" && k != "backup_key") put(k, v)
    }

    fun importJson(o: JSONObject) = sp.edit {
        for (k in o.keys()) when (val v = o.get(k)) {
            is Boolean -> putBoolean(k, v)
            is Int -> putInt(k, v)
            is Long -> putLong(k, v)
            is String -> putString(k, v)
            is Number -> putLong(k, v.toLong())
        }
    }.also { reload() }

    fun wipe() {
        sp.edit { clear() }
        reload()
    }

    // --- property delegates that keep Compose state and SharedPreferences in step ---

    private fun reload() { reloaders.forEach { it() }; sealsVersion++ }

    private fun <T> pref(key: String, default: T): Delegate<T> = Delegate(key, default).also { d -> reloaders += { d.load() } }
    private fun <E : Enum<E>> enumPref(key: String, default: E): EnumDelegate<E> = EnumDelegate(key, default).also { d -> reloaders += { d.load() } }

    inner class Delegate<T>(private val key: String, private val default: T) {
        private val state = mutableStateOf(read())

        @Suppress("UNCHECKED_CAST")
        private fun read(): T = when (default) {
            is Boolean -> sp.getBoolean(key, default) as T
            is Int -> sp.getInt(key, default) as T
            is Long -> sp.getLong(key, default) as T
            is String -> sp.getString(key, default) as T
            else -> error("unsupported preference type")
        }

        fun load() { state.value = read() }
        operator fun getValue(thisRef: Any?, property: Any?): T = state.value
        operator fun setValue(thisRef: Any?, property: Any?, value: T) {
            state.value = value
            sp.edit {
                when (value) {
                    is Boolean -> putBoolean(key, value)
                    is Int -> putInt(key, value)
                    is Long -> putLong(key, value)
                    is String -> putString(key, value)
                }
            }
        }
    }

    inner class EnumDelegate<E : Enum<E>>(private val key: String, private val default: E) {
        private val state = mutableStateOf(read())
        private fun read(): E = default.declaringJavaClass.enumConstants!!.firstOrNull { it.name == sp.getString(key, null) } ?: default
        fun load() { state.value = read() }
        operator fun getValue(thisRef: Any?, property: Any?): E = state.value
        operator fun setValue(thisRef: Any?, property: Any?, value: E) {
            state.value = value
            sp.edit { putString(key, value.name) }
        }
    }
}
