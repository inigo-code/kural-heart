package com.inigocode.kuralheart

import android.content.Context
import com.inigocode.kuralheart.data.Backup
import com.inigocode.kuralheart.data.Daily
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Pack
import com.inigocode.kuralheart.data.Prefs
import java.time.LocalDate

/** The app's few long-lived objects, created once per process. */
class Graph private constructor(context: Context) {
    val app: Context = context.applicationContext
    val prefs = Prefs(app)
    val journal = Journal(app)
    val backup = Backup(app, prefs, journal)
    val pack: Pack get() = Pack.get(app)

    /** Today's couplet, chosen and remembered the first time it is asked for on a given day. */
    fun todayKural(date: LocalDate = Journal.today()): Int {
        val log = prefs.dayLog()
        val n = Daily.pick(pack, log, prefs.seed, date)
        if (log[date.toString()] == null) prefs.logDay(date, n)
        if (prefs.startedOn.isEmpty()) prefs.startedOn = date.toString()
        return n
    }

    companion object {
        @Volatile private var instance: Graph? = null
        fun get(context: Context): Graph = instance ?: synchronized(this) { instance ?: Graph(context).also { instance = it } }
    }
}
