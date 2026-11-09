package com.inigocode.kuralheart

import android.content.Context
import com.inigocode.kuralheart.data.Backup
import com.inigocode.kuralheart.data.Daily
import com.inigocode.kuralheart.data.Drive
import com.inigocode.kuralheart.data.Photos
import com.inigocode.kuralheart.data.Speaker
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Pack
import com.inigocode.kuralheart.data.Prefs
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import java.time.LocalDate

/** The app's few long-lived objects, created once per process. */
class Graph private constructor(context: Context) {
    val app: Context = context.applicationContext
    val prefs = Prefs(app)
    val journal = Journal(app)
    val photos = Photos(app)
    val backup = Backup(app, prefs, journal, photos)
    val drive = Drive(app, backup, prefs)
    val speaker = Speaker(app)
    val pack: Pack get() = Pack.get(app)

    /** Today's couplet, chosen and remembered the first time it is asked for on a given day. */
    fun todayKural(date: LocalDate = Journal.today()): Int {
        val log = prefs.dayLog()
        val n = Daily.pick(pack, log, prefs.seed, date, random = prefs.promptMode == "random")
        if (log[date.toString()] == null) prefs.logDay(date, n)
        if (prefs.startedOn.isEmpty()) prefs.startedOn = date.toString()
        return n
    }

    /** Drop photo files no page uses any more (deleted pages, removed photos), keeping the profile photo. */
    fun purgePhotos() = photos.purge(journal.entries.flatMap { it.photos }.toSet() + prefs.avatar)

    /** Make [n] today's couplet (from the library, or "another couplet"). */
    fun setToday(n: Int, date: LocalDate = Journal.today()) {
        prefs.logDay(date, n)
        todayVersion++
    }

    /** Bumped when today's couplet changes, so Today redraws. */
    var todayVersion by androidx.compose.runtime.mutableIntStateOf(0)

    companion object {
        @Volatile private var instance: Graph? = null
        fun get(context: Context): Graph = instance ?: synchronized(this) { instance ?: Graph(context).also { instance = it } }
    }
}
