package com.inigocode.kuralheart.ui.valluvar

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.PathParser

internal sealed interface VNode

internal class VShape(
    val path: Path,
    val fill: Color?,
    val stroke: Color?,
    val strokeWidth: Float,
    val cap: StrokeCap,
    val join: StrokeJoin,
    val opacity: Float,
    val dash: FloatArray?,
) : VNode

internal class VLetter(val x: Float, val y: Float, val size: Float, val weight: Int, val color: Color, val text: String) : VNode

internal class VGroup(val classes: Set<String>, val matrix: FloatArray?, val opacity: Float, val children: List<VNode>) : VNode {
    /** Centre of the group's own drawing, for motions that turn about their own middle (stars, confetti, the thought cloud). */
    val boundsCenter: Offset by lazy { bounds()?.center ?: Offset.Zero }

    private fun bounds(): Rect? {
        var r: Rect? = null
        for (c in children) {
            val b = when (c) {
                is VShape -> c.path.getBounds()
                is VLetter -> Rect(c.x, c.y - c.size, c.x + c.size, c.y)
                is VGroup -> c.bounds()
            } ?: continue
            r = r?.let { Rect(minOf(it.left, b.left), minOf(it.top, b.top), maxOf(it.right, b.right), maxOf(it.bottom, b.bottom)) } ?: b
        }
        return r
    }
}

/** Parses the generated art once, the first time Valluvar is drawn. */
internal object ValluvarModel {
    val root: List<VNode> by lazy { parse(ValluvarArt.chunks.joinToString("\n")) }

    fun parse(text: String): List<VNode> {
        val stack = ArrayDeque<Triple<Set<String>, Pair<FloatArray?, Float>, MutableList<VNode>>>()
        val top = mutableListOf<VNode>()
        fun current() = stack.lastOrNull()?.third ?: top
        for (raw in text.lineSequence()) {
            val line = raw.trim()
            if (line.isEmpty()) continue
            val f = line.split('|')
            when (f[0]) {
                "G" -> stack.addLast(
                    Triple(
                        f[1].split(' ').filter { it.isNotEmpty() }.toSet(),
                        (if (f[2] == "-") null else f[2].split(',').map { it.toFloat() }.toFloatArray()) to f[3].toFloat(),
                        mutableListOf(),
                    )
                )
                "E" -> {
                    val (cls, mo, kids) = stack.removeLast()
                    current().add(VGroup(cls, mo.first, mo.second, kids))
                }
                "P" -> current().add(
                    VShape(
                        path = PathParser().parsePathString(f[1]).toPath(),
                        fill = f[2].takeIf { it != "-" }?.let(::parseColor),
                        stroke = f[3].takeIf { it != "-" }?.let(::parseColor),
                        strokeWidth = f[4].toFloat(),
                        cap = StrokeCapOf(f[5]),
                        join = StrokeJoinOf(f[6]),
                        opacity = f[7].toFloat(),
                        dash = f[8].takeIf { it != "-" }?.split(' ', ',')?.filter { it.isNotEmpty() }?.map { it.toFloat() }?.toFloatArray(),
                    )
                )
                "T" -> current().add(VLetter(f[1].toFloat(), f[2].toFloat(), f[3].toFloat(), f[4].toInt(), parseColor(f[5]), f[6]))
                else -> error("Unknown Valluvar art line: $line")
            }
        }
        check(stack.isEmpty()) { "Valluvar art has an unclosed group" }
        return top
    }
}
