package com.inigocode.kuralheart.data

import java.time.LocalDate
import java.time.LocalTime
import kotlin.random.Random

/** The six parts of the Tamil day (சிறுபொழுது), which set the greeting and, on Auto, the theme. */
enum class Period(val ta: String, val en: String, val greetTa: String, val greetEn: String, val night: Boolean) {
    Vaigarai("வைகறை", "Before dawn", "வைகறை வணக்கம்", "Good early morning", true),
    Kaalai("காலை", "Morning", "காலை வணக்கம்", "Good morning", false),
    Nanpagal("நண்பகல்", "Midday", "வணக்கம்", "Good afternoon", false),
    Erpadu("எற்பாடு", "Late afternoon", "மாலை வணக்கம்", "Good afternoon", false),
    Maalai("மாலை", "Evening", "மாலை வணக்கம்", "Good evening", true),
    Yaamam("யாமம்", "Deep night", "இரவு வணக்கம்", "Good night", true);

    companion object {
        fun at(time: LocalTime): Period = when (time.hour) {
            in 2..5 -> Vaigarai
            in 6..9 -> Kaalai
            in 10..13 -> Nanpagal
            in 14..17 -> Erpadu
            in 18..21 -> Maalai
            else -> Yaamam
        }
    }
}

/**
 * Picks the day's couplet. The first seven days follow a hand-picked welcome; after that the pool is
 * shuffled by the install's seed. A couplet is used only on days the app is opened, so nobody skips
 * couplets by being away, and a day keeps its couplet once chosen.
 */
object Daily {
    fun pick(pack: Pack, log: Map<String, Int>, seed: Long, date: LocalDate, random: Boolean = false): Int {
        log[date.toString()]?.let { return it }
        val used = log.values.toSet()
        val i = log.size
        if (random) return pack.pool.filter { it !in used }.ifEmpty { pack.pool }.random(Random(seed + date.toEpochDay()))
        if (i < pack.welcome.size) return pack.welcome[i]
        val order = pack.pool.shuffled(Random(seed))
        return order.firstOrNull { it !in used } ?: order[i % order.size]
    }

    /** A couplet for a feeling, never the same as [not], never one on the avoid list. */
    fun forMood(pack: Pack, mood: String, seed: Long, attempt: Int, not: Int? = null): Int {
        val chapters = pack.moods[mood] ?: pack.moods.getValue("calm")
        val candidates = chapters.flatMap { c -> ((c - 1) * 10 + 1)..(c * 10) }.filter { it !in pack.avoid && it != not }
        return candidates.shuffled(Random(seed + mood.hashCode())).let { it[attempt.mod(it.size)] }
    }
}
