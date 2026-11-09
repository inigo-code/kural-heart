package com.inigocode.kuralheart.data

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

/**
 * The thread (the app's streak, called Streak in code to keep clear of java.lang.Thread) and the seals.
 *
 * Thread rules (PLAN.md): each calendar week, Monday to Sunday, keeps two rest days for you, so a busy day
 * never breaks the thread. A third missed day in a week ends it. Today never counts against you before
 * it is over. The number shown is the count of days written in the current thread.
 */
object Streak {
    data class State(val days: Int, val longest: Int, val writtenToday: Boolean, val restDaysUsedThisWeek: Int, val lastSeven: Int)

    fun compute(written: Set<LocalDate>, today: LocalDate): State {
        val writtenToday = today in written
        val current = runFrom(written, today)
        // Longest: walk each written day as a possible end point (journals are small, so this is cheap).
        var longest = current
        for (d in written) if (d < today) longest = maxOf(longest, runFrom(written, d, ended = true))
        val weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        var missed = 0
        var d = weekStart
        while (d < today) { if (d !in written) missed++; d = d.plusDays(1) }
        val lastSeven = (0L..6L).count { today.minusDays(it) in written }
        return State(current, longest, writtenToday, minOf(missed, 2), lastSeven)
    }

    /** Written days in the thread that reaches [end]. If [ended] is false, [end] itself may still be blank. */
    private fun runFrom(written: Set<LocalDate>, end: LocalDate, ended: Boolean = false): Int {
        if (written.isEmpty()) return 0
        var days = 0
        var d = if (!ended && end !in written) end.minusDays(1) else end
        val missesInWeek = HashMap<LocalDate, Int>()
        val first = written.min()
        while (d >= first) {
            if (d in written) {
                days++
            } else {
                val wk = d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                val m = (missesInWeek[wk] ?: 0) + 1
                if (m > 2) break
                missesInWeek[wk] = m
            }
            d = d.minusDays(1)
        }
        return days
    }
}

/** The nine seals. Each is earned once, on the day its condition is first met, and is never taken back. */
enum class Seal(val glyph: String, val num: String?, val tone: String, val ta: String, val en: String, val ce: String, val ct: String) {
    FirstLeaf("௧", "1", "clay", "முதல் ஏடு", "First leaf", "Your first saved page", "சேமித்த முதல் பக்கம்"),
    InTamil("அ", null, "indigo", "தமிழில்", "In Tamil", "A page written in Tamil", "தமிழில் எழுதிய பக்கம்"),
    Seven("௭", "7", "rose", "ஏழு நாள் நூல்", "Seven-day thread", "7 days on your thread", "நூலில் 7 நாள்கள்"),
    Chapter("௰", "10", "clay", "அதிகாரம்", "A chapter", "10 pages", "10 பக்கங்கள்"),
    SixTimes("௬", "6", "green", "ஆறு பொழுது", "All six times", "A page in each part of the day", "ஒவ்வொரு பொழுதிலும் ஒரு பக்கம்"),
    ThreeParts("௩", "3", "green", "முப்பால்", "All three parts", "A page on Aram, Porul and Inbam", "அறம், பொருள், இன்பம் மூன்றிலும் ஒரு பக்கம்"),
    Thirty("௩௰", "30", "rose", "முப்பது நாள் நூல்", "Thirty-day thread", "30 days on your thread", "நூலில் 30 நாள்கள்"),
    Hundred("௱", "100", "clay", "நூறு ஏடுகள்", "A hundred leaves", "100 pages", "100 பக்கங்கள்"),
    Year("௩௱௬௰௫", "365", "clay", "ஓர் ஆண்டு", "A year with Valluvar", "365 pages", "365 பக்கங்கள்");

    /** How far along an unearned seal is, as (done, of). */
    fun progress(entries: List<Entry>, pack: Pack, thread: Streak.State): Pair<Int, Int> = when (this) {
        FirstLeaf -> minOf(entries.size, 1) to 1
        InTamil -> (if (entries.any { it.isTamil }) 1 else 0) to 1
        Seven -> minOf(thread.longest, 7) to 7
        Chapter -> minOf(entries.size, 10) to 10
        SixTimes -> entries.map { it.period }.toSet().size.coerceAtMost(6) to 6
        ThreeParts -> entries.map { pack.chapterOf(pack.kural(it.kural)).part }.toSet().size to 3
        Thirty -> minOf(thread.longest, 30) to 30
        Hundred -> minOf(entries.size, 100) to 100
        Year -> minOf(entries.size, 365) to 365
    }

    companion object {
        /** Seals newly met by this journal, in order. The caller records them. */
        fun newlyEarned(pages: List<Entry>, pack: Pack, thread: Streak.State, have: Set<String>): List<Seal> =
            Seal.entries.filter { it.name !in have }.filter { s -> s.progress(pages, pack, thread).let { it.first >= it.second } }
    }
}
