package com.inigocode.kuralheart.ui.valluvar

import android.provider.Settings
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.Matrix
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.ui.theme.KuralFonts

/** The eleven things Valluvar does. Each one is a separate drawing in the owner's model, not a pose of one rig. */
enum class ValluvarState { Reading, Writing, Contemplating, Teaching, Walking, Celebrating, Listening, Presenting, Greeting, Resting, Awarding }

/** Faces: an eye mode plus a mouth, as in the canvas. */
enum class ValluvarFace(internal val eyes: String, internal val mouth: String) {
    Smile("e-n", "m-smile"), Greet("e-n", "m-joy"), Talk("e-n", "m-chant"), Focused("e-n", "m-smile"),
    Thinking("e-u", "m-smile"), Joy("e-happy", "m-joy"), Proud("e-happy", "m-smile"), Calm("e-happy", "m-smile");
}

fun ValluvarState.defaultFace(): ValluvarFace = when (this) {
    ValluvarState.Reading, ValluvarState.Walking, ValluvarState.Listening, ValluvarState.Presenting -> ValluvarFace.Smile
    ValluvarState.Writing -> ValluvarFace.Focused
    ValluvarState.Contemplating -> ValluvarFace.Thinking
    ValluvarState.Teaching -> ValluvarFace.Talk
    ValluvarState.Celebrating, ValluvarState.Awarding -> ValluvarFace.Joy
    ValluvarState.Greeting -> ValluvarFace.Greet
    ValluvarState.Resting -> ValluvarFace.Calm
}

/**
 * Draws Valluvar at [size] wide (the art is 240 by 220).
 *
 * [still] freezes him, as do the system's "remove animations" settings.
 * [once] lets the celebration play twice and settle, as the seal moment needs.
 * [typing] speeds the stylus while the person types. [nod] gives one approving nod.
 */
@Composable
fun Valluvar(
    state: ValluvarState,
    modifier: Modifier = Modifier,
    size: Dp = 240.dp,
    face: ValluvarFace = state.defaultFace(),
    still: Boolean = false,
    once: Boolean = false,
    typing: Boolean = false,
    nod: Boolean = false,
    description: String? = null,
) {
    val context = LocalContext.current
    val reduced = remember {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
    val frozen = still || reduced
    val clock = remember { mutableLongStateOf(0L) }
    val startedAt = remember(state, nod, once) { longArrayOf(-1L) }
    LaunchedEffect(frozen, state, nod, once) {
        if (frozen) return@LaunchedEffect
        while (true) withFrameMillis { now ->
            if (startedAt[0] < 0) startedAt[0] = now
            clock.longValue = now - startedAt[0]
        }
    }
    val measurer = rememberTextMeasurer()
    val letterStyle = remember { TextStyle(fontFamily = KuralFonts.SerifTamil) }
    val opts = DrawOptions(state, face, typing, once, nod)
    Canvas(
        modifier
            .size(size, size * (ValluvarArt.VIEW_HEIGHT / ValluvarArt.VIEW_WIDTH))
            .semantics { contentDescription = description ?: "" }
    ) {
        val t = if (frozen) -1L else clock.longValue
        val k = this.size.width / ValluvarArt.VIEW_WIDTH
        withTransform({ scale(k, k, Offset.Zero) }) {
            for (node in ValluvarModel.root) drawNode(node, opts, t, 1f) { letter, alpha ->
                val style = letterStyle.copy(
                    color = letter.color.copy(alpha = letter.color.alpha * alpha),
                    // Art units, not sp: the canvas is already scaled, and the letters are drawing, not reading text.
                    fontSize = (letter.size / (density * fontScale)).sp,
                    fontWeight = FontWeight(letter.weight),
                )
                val layout = measurer.measure(letter.text, style)
                drawText(layout, topLeft = Offset(letter.x, letter.y - layout.firstBaseline))
            }
        }
    }
}

internal class DrawOptions(val state: ValluvarState, val face: ValluvarFace, val typing: Boolean, val once: Boolean, val nod: Boolean) {
    val stateClass = "s-" + state.name.lowercase()
}

private fun DrawScope.drawNode(node: VNode, o: DrawOptions, t: Long, alpha: Float, letter: DrawScope.(VLetter, Float) -> Unit) {
    when (node) {
        is VShape -> drawShape(node, alpha)
        is VLetter -> letter(node, alpha)
        is VGroup -> {
            if (!node.visible(o)) return
            val motion = if (t >= 0) Motions.pick(node, o) else null
            val pose = motion?.poseAt(t, o.once && node.classes.any { it in Motions.ONCE })
            val m = node.matrix?.let { Affine(it) } ?: Affine.IDENTITY
            val full = if (motion != null && pose != null) m * pose.matrix(motion.origin ?: node.boundsCenter) else m
            val a = alpha * node.opacity * (pose?.alpha ?: 1f)
            if (a <= 0.001f) return
            if (full === Affine.IDENTITY) {
                for (c in node.children) drawNode(c, o, t, a, letter)
            } else {
                withTransform({ transform(full.toCompose()) }) {
                    for (c in node.children) drawNode(c, o, t, a, letter)
                }
            }
        }
    }
}

private fun VGroup.visible(o: DrawOptions): Boolean {
    if ("s" in classes && o.stateClass !in classes) return false
    if ("e" in classes && o.face.eyes !in classes) return false
    if ("m" in classes && o.face.mouth !in classes) return false
    return true
}

private fun DrawScope.drawShape(s: VShape, alpha: Float) {
    val a = alpha * s.opacity
    s.fill?.let { drawPath(s.path, it.copy(alpha = it.alpha * a), style = Fill) }
    s.stroke?.let {
        drawPath(
            s.path, it.copy(alpha = it.alpha * a),
            style = Stroke(width = s.strokeWidth, cap = s.cap, join = s.join, pathEffect = s.dash?.let { d -> PathEffect.dashPathEffect(d) }),
        )
    }
}

/** A 2D affine matrix in SVG order: x' = a x + c y + e, y' = b x + d y + f. */
internal class Affine(val a: Float, val b: Float, val c: Float, val d: Float, val e: Float, val f: Float) {
    constructor(v: FloatArray) : this(v[0], v[1], v[2], v[3], v[4], v[5])

    operator fun times(n: Affine) = Affine(
        a * n.a + c * n.b, b * n.a + d * n.b,
        a * n.c + c * n.d, b * n.c + d * n.d,
        a * n.e + c * n.f + e, b * n.e + d * n.f + f,
    )

    fun toCompose(): Matrix = Matrix().also {
        it.values[Matrix.ScaleX] = a; it.values[Matrix.SkewY] = b
        it.values[Matrix.SkewX] = c; it.values[Matrix.ScaleY] = d
        it.values[Matrix.TranslateX] = e; it.values[Matrix.TranslateY] = f
    }

    companion object {
        val IDENTITY = Affine(1f, 0f, 0f, 1f, 0f, 0f)
        fun translate(x: Float, y: Float) = Affine(1f, 0f, 0f, 1f, x, y)
        fun scale(x: Float, y: Float) = Affine(x, 0f, 0f, y, 0f, 0f)
        fun rotate(deg: Float): Affine {
            val r = Math.toRadians(deg.toDouble())
            val cs = kotlin.math.cos(r).toFloat()
            val sn = kotlin.math.sin(r).toFloat()
            return Affine(cs, sn, -sn, cs, 0f, 0f)
        }
        fun skewX(deg: Float) = Affine(1f, 0f, kotlin.math.tan(Math.toRadians(deg.toDouble())).toFloat(), 1f, 0f, 0f)
    }
}

internal fun parseColor(hex: String): Color {
    val v = hex.removePrefix("#")
    val full = if (v.length == 3) v.map { "$it$it" }.joinToString("") else v
    return Color(0xFF000000 or full.toLong(16))
}

internal fun StrokeCapOf(s: String) = when (s) { "round" -> StrokeCap.Round; "square" -> StrokeCap.Square; else -> StrokeCap.Butt }
internal fun StrokeJoinOf(s: String) = when (s) { "round" -> StrokeJoin.Round; "bevel" -> StrokeJoin.Bevel; else -> StrokeJoin.Miter }

/** Valluvar drawn still into a bitmap, for share images. Letters (the Teaching state's) are left out. */
fun valluvarBitmap(state: ValluvarState, widthPx: Int): android.graphics.Bitmap {
    val h = (widthPx * ValluvarArt.VIEW_HEIGHT / ValluvarArt.VIEW_WIDTH).toInt()
    val img = androidx.compose.ui.graphics.ImageBitmap(widthPx, h)
    val canvas = androidx.compose.ui.graphics.Canvas(img)
    androidx.compose.ui.graphics.drawscope.CanvasDrawScope().draw(
        androidx.compose.ui.unit.Density(1f), androidx.compose.ui.unit.LayoutDirection.Ltr, canvas,
        androidx.compose.ui.geometry.Size(widthPx.toFloat(), h.toFloat()),
    ) {
        val k = size.width / ValluvarArt.VIEW_WIDTH
        withTransform({ scale(k, k, Offset.Zero) }) {
            val o = DrawOptions(state, state.defaultFace(), typing = false, once = false, nod = false)
            for (node in ValluvarModel.root) drawNode(node, o, -1L, 1f) { _, _ -> }
        }
    }
    return img.asAndroidBitmap()
}
