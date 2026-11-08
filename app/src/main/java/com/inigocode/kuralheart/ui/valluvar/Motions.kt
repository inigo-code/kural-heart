package com.inigocode.kuralheart.ui.valluvar

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.ui.geometry.Offset

/** One keyframe. Values are the CSS transform parts, in art units and degrees. */
internal data class Key(
    val at: Float,
    val rot: Float = 0f, val tx: Float = 0f, val ty: Float = 0f,
    val sx: Float = 1f, val sy: Float = 1f, val skew: Float = 0f, val alpha: Float = 1f,
)

/** The pose at one moment. [order] is the CSS function order, for example "RT" for rotate() then translateY(). */
internal class Pose(val k: Key, private val order: String) {
    val alpha get() = k.alpha
    fun matrix(origin: Offset): Affine {
        var m = Affine.translate(origin.x, origin.y)
        for (op in order) m = m * when (op) {
            'T' -> Affine.translate(k.tx, k.ty)
            'R' -> Affine.rotate(k.rot)
            'S' -> Affine.scale(k.sx, k.sy)
            'K' -> Affine.skewX(k.skew)
            else -> Affine.IDENTITY
        }
        return m * Affine.translate(-origin.x, -origin.y)
    }
}

internal data class Motion(
    val keys: List<Key>,
    val durationMs: Int,
    val order: String,
    /** Null means the group's own centre (CSS transform-box: fill-box). */
    val origin: Offset?,
    val easing: Easing = EaseInOut,
    val phaseMs: Int = 0,
    val alternate: Boolean = false,
    val iterations: Int = 0,
) {
    /** [settle] stops the motion after two plays, at its first frame. */
    fun poseAt(t: Long, settle: Boolean): Pose {
        val plays = if (settle) 2 else iterations
        val local = t + phaseMs
        if (plays > 0 && local >= plays.toLong() * durationMs) return Pose(keys.first(), order)
        val cycle = if (alternate) durationMs * 2L else durationMs.toLong()
        var p = (local % cycle).toFloat() / durationMs
        if (alternate && p > 1f) p = 2f - p
        return Pose(sample(p), order)
    }

    fun sample(p: Float): Key {
        val i = keys.indexOfLast { it.at <= p }.coerceIn(0, keys.size - 2)
        val a = keys[i]
        val b = keys[i + 1]
        val span = (b.at - a.at).takeIf { it > 0f } ?: return b
        val e = easing.transform(((p - a.at) / span).coerceIn(0f, 1f))
        fun l(x: Float, y: Float) = x + (y - x) * e
        return Key(p, l(a.rot, b.rot), l(a.tx, b.tx), l(a.ty, b.ty), l(a.sx, b.sx), l(a.sy, b.sy), l(a.skew, b.skew), l(a.alpha, b.alpha))
    }
}

internal val EaseInOut: Easing = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)
private val Ease: Easing = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1f)
private val EaseOut: Easing = CubicBezierEasing(0f, 0f, 0.58f, 1f)
private val Burst: Easing = CubicBezierEasing(0.2f, 0.6f, 0.3f, 1f)

/** A there-and-back loop: rest at 0 and 1, [mid] at the half. */
private fun loop(mid: Key, rest: Key = Key(0f)) = listOf(rest.copy(at = 0f), mid.copy(at = 0.5f), rest.copy(at = 1f))

/** Valluvar's motions, mirrored from the `.tv` rules in docs/canvas/project/olai.css. Keep the two in step. */
internal object Motions {
    val ONCE = setOf("tv-bounce", "tv-confetti", "tv-armsL", "tv-armsR")

    private val head = Offset(120f, 76f)
    private val legLeft = listOf(Key(0f, rot = -14f), Key(0.5f, rot = 14f), Key(1f, rot = -14f))
    private val legRight = listOf(Key(0f, rot = 14f), Key(0.5f, rot = -14f), Key(1f, rot = 14f))
    private val twinkle = loop(Key(0f, sx = 1.2f, sy = 1.2f, rot = 18f), Key(0f, sx = 0.85f, sy = 0.85f, alpha = 0.65f))
    private val leafFloat = loop(Key(0f, ty = -3.5f, rot = -2f), Key(0f, rot = -5f))

    private val heads = mapOf(
        "h-scan" to Motion(loop(Key(0f, rot = 3.2f, ty = 2f), Key(0f, rot = -2.5f)), 3600, "RT", head),
        "h-write" to Motion(loop(Key(0f, rot = 9.5f, ty = 3f), Key(0f, rot = 6f, ty = 1f)), 1400, "RT", head),
        "h-cont" to Motion(loop(Key(0f, rot = 2f, ty = -3.5f), Key(0f, rot = -3f, ty = -1f)), 3200, "RT", head),
        "h-listen" to Motion(
            listOf(Key(0f, rot = -6f), Key(0.4f, rot = -2f, ty = 3f), Key(0.75f, rot = -5f, ty = 1f), Key(1f, rot = -6f)), 2200, "RT", head,
        ),
        "h-rest" to Motion(loop(Key(0f, rot = 1f, ty = 2.5f), Key(0f, rot = -1.5f, ty = 1f)), 5600, "RT", head),
    )
    private val nod = Motion(listOf(Key(0f), Key(0.45f, rot = 10f, ty = 5f), Key(1f)), 550, "RT", head, iterations = 2)

    private val table = mapOf(
        "tv-breath" to Motion(loop(Key(0f, sy = 1.028f, ty = -2f)), 3600, "ST", Offset(120f, 148f)),
        "tv-bun" to Motion(loop(Key(0f, ty = -2.5f, rot = -3f)), 1800, "TR", Offset(120f, 30f)),
        "tv-brow" to Motion(loop(Key(0f, ty = -1.8f)), 3200, "T", Offset(120f, 50f)),
        "tv-blink" to Motion(
            listOf(0f, 0.44f, 0.46f, 0.48f, 0.92f, 0.94f, 0.96f, 1f).mapIndexed { i, at -> Key(at, sy = if (i == 2 || i == 5) 0.08f else 1f) },
            4000, "S", Offset(120f, 58f), easing = Ease,
        ),
        "tv-chant" to Motion(loop(Key(0f, sy = 1.15f), Key(0f, sy = 0.35f)), 650, "S", head),
        "tv-cloth" to Motion(loop(Key(0f, skew = -2.2f)), 3000, "K", Offset(132f, 92f)),
        "tv-float" to Motion(leafFloat, 3600, "TR", Offset(120f, 128f)),
        "tv-float30" to Motion(leafFloat, 3000, "TR", Offset(120f, 122f)),
        "tv-twinkle" to Motion(twinkle, 3200, "SR", null),
        "tv-twinkle2" to Motion(twinkle, 2600, "SR", null),
        "tv-cloud" to Motion(loop(Key(0f, sx = 1.07f, sy = 1.07f, ty = -3f)), 2800, "ST", null),
        "tv-stylus" to Motion(
            listOf(Key(0f), Key(0.25f, tx = 9f, ty = -3f, rot = -6f), Key(0.5f, tx = 18f, ty = 1f, rot = 3f), Key(0.75f, tx = 26f, ty = -2f, rot = -4f), Key(1f)),
            1400, "TR", Offset(84f, 96f),
        ),
        "tv-spark" to Motion(
            loop(Key(0f, sx = 1.25f, sy = 1.25f, ty = -6f), Key(0f, sx = 0.6f, sy = 0.6f, alpha = 0.2f)), 700, "ST", Offset(125f, 154f),
        ),
        "tv-beard" to Motion(loop(Key(0f, ty = 4f, rot = -4f)), 2400, "TR", Offset(82f, 98f)),
        "tv-tamil" to Motion(loop(Key(0f, ty = -9f, tx = 3f), Key(0f, alpha = 0.75f)), 2400, "T", Offset.Zero),
        "tv-teach" to Motion(loop(Key(0f, rot = -14f, ty = -4f)), 1800, "RT", Offset(158f, 98f)),
        "tv-walk" to Motion(
            listOf(Key(0f), Key(0.25f, ty = -4f), Key(0.5f), Key(0.75f, ty = -4f), Key(1f)), 1600, "T", Offset.Zero, easing = LinearEasing,
        ),
        "tv-legL" to Motion(legLeft, 1600, "R", Offset(104f, 154f)),
        "tv-legR" to Motion(legRight, 1600, "R", Offset(132f, 154f)),
        "tv-billow" to Motion(loop(Key(0f, rot = -5f, skew = -6f)), 1600, "RK", Offset(120f, 132f)),
        "tv-staff" to Motion(legLeft, 1600, "R", Offset(142f, 84f)),
        "tv-carry" to Motion(legRight, 1600, "R", Offset(90f, 86f)),
        "tv-bounce" to Motion(loop(Key(0f, ty = -6f, sy = 1.03f)), 1200, "TS", Offset(120f, 180f)),
        "tv-confetti" to Motion(twinkle, 1200, "SR", null),
        "tv-armsL" to Motion(loop(Key(0f, rot = -12f, ty = -4f)), 1200, "RT", Offset(80f, 100f)),
        "tv-armsR" to Motion(loop(Key(0f, rot = -12f, ty = -4f)), 1200, "RT", Offset(160f, 100f)),
        // The canvas animates the ring's radius from 36 to 86 on a 42 ring; here that is a scale about its centre.
        "tv-sonar" to Motion(
            listOf(Key(0f, sx = 36f / 42f, sy = 36f / 42f, alpha = 0.75f), Key(1f, sx = 86f / 42f, sy = 86f / 42f, alpha = 0f)),
            2000, "S", Offset(120f, 68f), easing = EaseOut,
        ),
        "tv-shimmer" to Motion(
            listOf(Key(0f, tx = -45f, alpha = 0f), Key(0.5f, alpha = 0.9f), Key(1f, tx = 45f, alpha = 0f)), 2400, "T", Offset.Zero,
        ),
        "tv-wave" to Motion(listOf(Key(0f, rot = -8f), Key(1f, rot = 10f)), 900, "R", Offset(160f, 100f), alternate = true),
        "tv-burst" to Motion(
            listOf(Key(0f, sx = 0.6f, sy = 0.6f, alpha = 0.9f), Key(1f, sx = 2.3f, sy = 2.3f, alpha = 0f)), 1600, "S", Offset(120f, 126f), easing = Burst,
        ),
    )

    /** Duration classes from the canvas (d36 = 3.6 s on a head, b24 = 2.4 s on a breath). */
    private fun durationClass(classes: Set<String>, prefix: Char): Int? =
        classes.firstOrNull { it.length == 3 && it[0] == prefix && it[1].isDigit() && it[2].isDigit() }?.substring(1)?.toInt()?.times(100)

    fun pick(g: VGroup, o: DrawOptions): Motion? {
        val c = g.classes
        if ("tv-head" in c) {
            if (o.nod) return nod
            val base = heads.entries.firstOrNull { it.key in c }?.value ?: return null
            return durationClass(c, 'd')?.let { base.copy(durationMs = it) } ?: base
        }
        val name = c.firstOrNull { it in table } ?: return null
        val base = table.getValue(name)
        return when (name) {
            "tv-breath" -> durationClass(c, 'b')?.let { base.copy(durationMs = it) } ?: base
            "tv-brow" -> if (o.face == ValluvarFace.Focused) {
                base.copy(keys = loop(Key(0f, ty = -1f), Key(0f, ty = 1f)), durationMs = 1400)
            } else base
            "tv-stylus" -> if (o.typing) base.copy(durationMs = 800) else base
            "tv-burst" -> if ("b2" in c) base.copy(phaseMs = 1600 - 550) else base
            "tv-sonar" -> if ("s2" in c) base.copy(phaseMs = 2000 - 900) else base
            "tv-confetti" -> if ("c2" in c) base.copy(durationMs = 1600) else base
            else -> base
        }
    }
}
