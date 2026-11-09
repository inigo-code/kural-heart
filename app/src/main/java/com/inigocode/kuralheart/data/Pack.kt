package com.inigocode.kuralheart.data

import android.content.Context
import org.json.JSONObject

/** The three books of the Kural. */
enum class Part(val ta: String, val en: String) {
    Aram("அறத்துப்பால்", "Virtue"), Porul("பொருட்பால்", "Wealth"), Inbam("காமத்துப்பால்", "Love");
}

data class Chapter(val n: Int, val ta: String, val en: String, val part: Part)

/** One couplet. [check] is how the Tamil was verified: agree, voted or review (see tools/content/report.md). */
data class Kural(
    val n: Int, val chapter: Int, val a: String, val b: String,
    /** Aiyar's prose (1916). */ val en: String,
    /** Pope's verse, two lines, and the prose rendering printed with it (1886). */ val popeA: String, val popeB: String, val popeProse: String,
    val check: String,
)

data class Question(val en: String, val ta: String)

/**
 * The couplet pack, built by tools/content/build_pack.py. Kural text lives only here, never in code.
 * Loaded once, on first use; it is small (under half a megabyte) and read-only.
 */
class Pack private constructor(
    val chapters: List<Chapter>,
    val kurals: List<Kural>,
    val lens: Map<String, Question>,
    private val chapterQuestions: Map<Int, Question>,
    val welcome: List<Int>,
    val moods: Map<String, List<Int>>,
    val avoid: Set<Int>,
) {
    fun kural(n: Int): Kural = kurals[n - 1]
    fun chapter(n: Int): Chapter = chapters[n - 1]
    fun chapterOf(k: Kural): Chapter = chapter(k.chapter)

    /** The chapters that daily couplets come from (68 core and 22 selective, see PLAN.md section 5). */
    val poolChapters: List<Int> get() = chapterQuestions.keys.sorted()

    /** Every couplet in the pool chapters, in order. */
    val pool: List<Int> by lazy { poolChapters.flatMap { c -> ((c - 1) * 10 + 1)..(c * 10) } }

    /** The chapter's question, or the Mind lens for chapters outside the pool. */
    fun questionFor(k: Kural): Question = chapterQuestions[k.chapter] ?: lens.getValue("mind")

    companion object {
        @Volatile private var loaded: Pack? = null

        fun get(context: Context): Pack = loaded ?: synchronized(this) {
            loaded ?: parse(context.assets.open("kural/pack.json").use { it.readBytes().decodeToString() }).also { loaded = it }
        }

        fun parse(text: String): Pack {
            val root = JSONObject(text)
            val ch = root.getJSONArray("chapters")
            val chapters = List(ch.length()) { i ->
                val o = ch.getJSONObject(i)
                Chapter(o.getInt("n"), o.getString("ta"), o.getString("en"), Part.valueOf(o.getString("part").replaceFirstChar { it.uppercase() }))
            }
            val ks = root.getJSONArray("kurals")
            val kurals = List(ks.length()) { i ->
                val o = ks.getJSONObject(i)
                Kural(o.getInt("n"), o.getInt("c"), o.getString("a"), o.getString("b"), o.getString("en"), o.getString("pa"), o.getString("pb"), o.getString("pp"), o.getString("check"))
            }
            val q = root.getJSONObject("questions")
            fun question(o: JSONObject) = Question(o.getString("en"), o.getString("ta"))
            val lensJson = q.getJSONObject("lens")
            val lens = lensJson.keys().asSequence().associateWith { question(lensJson.getJSONObject(it)) }
            val cq = q.getJSONObject("chapter")
            val chapterQuestions = cq.keys().asSequence().associate { it.toInt() to question(cq.getJSONObject(it)) }
            val w = q.getJSONArray("welcome")
            val moodsJson = q.getJSONObject("moods")
            val moods = moodsJson.keys().asSequence().associateWith { m ->
                val a = moodsJson.getJSONArray(m); List(a.length()) { a.getInt(it) }
            }
            val av = q.getJSONArray("avoid")
            check(kurals.size == 1330 && chapters.size == 133) { "The couplet pack is incomplete" }
            return Pack(chapters, kurals, lens, chapterQuestions, List(w.length()) { w.getInt(it) }, moods, List(av.length()) { av.getInt(it) }.toSet())
        }
    }
}
