package com.inigocode.kuralheart

import com.inigocode.kuralheart.data.Crypto
import com.inigocode.kuralheart.data.Daily
import com.inigocode.kuralheart.data.Pack
import com.inigocode.kuralheart.data.Part
import com.inigocode.kuralheart.data.Streak
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.time.LocalDate

class DataTest {
    private val pack: Pack by lazy { Pack.parse(File("src/main/assets/kural/pack.json").readText()) }

    @Test fun packHasEveryCoupletInOrder() {
        assertEquals(1330, pack.kurals.size)
        assertEquals(133, pack.chapters.size)
        pack.kurals.forEachIndexed { i, k ->
            assertEquals(i + 1, k.n)
            assertEquals((i / 10) + 1, k.chapter)
            assertTrue("kural ${k.n} has two lines", k.a.isNotBlank() && k.b.isNotBlank())
            assertTrue("kural ${k.n} has English", k.en.isNotBlank())
            assertFalse("kural ${k.n} has no stray stop", k.a.endsWith(".") || k.b.endsWith("."))
        }
        assertEquals(Part.Aram, pack.chapter(38).part)
        assertEquals(Part.Porul, pack.chapter(39).part)
        assertEquals(Part.Inbam, pack.chapter(109).part)
    }

    @Test fun poolIsNinetyChaptersWithQuestions() {
        assertEquals(90, pack.poolChapters.size)
        assertEquals(900, pack.pool.size)
        for (c in pack.poolChapters) {
            val q = pack.questionFor(pack.kural((c - 1) * 10 + 1))
            assertTrue(q.en.endsWith("?") && q.ta.isNotBlank())
        }
    }

    @Test fun firstWeekIsTheWelcomeThenShuffledWithoutRepeats() {
        val log = mutableMapOf<String, Int>()
        var day = LocalDate.of(2026, 11, 9)
        repeat(60) {
            val n = Daily.pick(pack, log, seed = 42L, date = day)
            log[day.toString()] = n
            day = day.plusDays(1)
        }
        assertEquals(pack.welcome, log.values.take(7))
        assertEquals("no couplet repeats in 60 days", 60, log.values.toSet().size)
        assertTrue(log.values.drop(7).all { it in pack.pool })
    }

    @Test fun aDayKeepsItsCouplet() {
        val log = mapOf("2026-11-09" to 391)
        assertEquals(391, Daily.pick(pack, log, 7L, LocalDate.of(2026, 11, 9)))
    }

    @Test fun moodNeverOffersTheAvoidedCouplet() {
        repeat(40) { assertNotEquals(621, Daily.forMood(pack, "anxious", 3L, it)) }
    }

    private fun days(vararg d: String) = d.map { LocalDate.parse(it) }.toSet()

    @Test fun twoRestDaysAWeekKeepTheThread() {
        // Mon 2 Nov to Sun 8 Nov: five written, Tue and Thu rested. Today is Mon 9 Nov, not yet written.
        val written = days("2026-11-02", "2026-11-04", "2026-11-06", "2026-11-07", "2026-11-08")
        val s = Streak.compute(written, LocalDate.of(2026, 11, 9))
        assertEquals(5, s.days)
        assertFalse(s.writtenToday)
    }

    @Test fun aThirdMissInOneWeekEndsTheThread() {
        // Written Mon 2 Nov, then Tue, Wed and Thu missed; written Fri to Sun.
        val written = days("2026-11-02", "2026-11-06", "2026-11-07", "2026-11-08")
        val s = Streak.compute(written, LocalDate.of(2026, 11, 9))
        assertEquals(3, s.days)
        assertEquals(3, s.longest)
    }

    @Test fun backupOpensOnlyWithItsPassphrase() {
        val salt = Crypto.newSalt()
        val key = Crypto.deriveKey("river lamp leaf 42".toCharArray(), salt, rounds = 1000)
        val plain = "{\"entries\":[]}".toByteArray()
        val file = Crypto.sealBackup(plain, key, salt, rounds = 1000)
        val h = Crypto.readHeader(file)
        assertEquals(1000, h.rounds)
        assertArrayEquals(salt, h.salt)
        assertArrayEquals(plain, Crypto.openBackup(file, Crypto.deriveKey("river lamp leaf 42".toCharArray(), h.salt, h.rounds)))
        val wrong = runCatching { Crypto.openBackup(file, Crypto.deriveKey("wrong".toCharArray(), h.salt, h.rounds)) }
        assertTrue(wrong.isFailure)
    }
}
