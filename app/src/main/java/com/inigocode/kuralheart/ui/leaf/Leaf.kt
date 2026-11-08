package com.inigocode.kuralheart.ui.leaf

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.ui.theme.KuralFonts
import com.inigocode.kuralheart.ui.theme.Olai

/**
 * The palm-leaf card: a dried olai with its string hole, three faint ribs and darker edges.
 * Drawn in code, no bitmap, so it stays crisp at any size and costs nothing to ship.
 * Mirrors `.leaf` in docs/canvas/project/olai.css. On Midnight it is dimmed to 90%, as there.
 */
@Composable
fun Leaf(modifier: Modifier = Modifier, mini: Boolean = false, content: @Composable ColumnScope.() -> Unit) {
    val c = Olai.colors
    val shape = RoundedCornerShape(topStart = 14.dp, topEnd = 14.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
    val rib = c.leafRib
    val dim = if (c.isNight) 0.9f else 1f
    Box(
        modifier
            .shadow(14.dp, shape, ambientColor = Color(0x553C280A), spotColor = Color(0x553C280A))
            .clip(shape)
            .drawBehind {
                drawRect(Brush.verticalGradient(listOf(c.leaf1.dim(dim), c.leaf2.dim(dim))))
                // the ribs at a third, three fifths and five sixths of the height
                for ((at, a) in listOf(0.334f to 0.09f, 0.614f to 0.08f, 0.854f to 0.07f)) {
                    drawRect(rib.copy(alpha = a), topLeft = Offset(0f, size.height * at), size = Size(size.width, 1.dp.toPx()))
                }
                // darker edges where the leaf curls
                drawRect(
                    Brush.horizontalGradient(
                        0f to rib.copy(alpha = 0.09f), 0.06f to Color.Transparent,
                        0.94f to Color.Transparent, 1f to rib.copy(alpha = 0.09f),
                    )
                )
                // a shadow pooling at the foot of the leaf
                drawRect(
                    Brush.verticalGradient(0.8f to Color.Transparent, 1f to rib.copy(alpha = 0.18f)),
                )
                // the string hole
                val r = (if (mini) 3.dp else 4.dp).toPx()
                val hole = Offset(size.width / 2, (if (mini) 10.dp else 13.dp).toPx())
                drawCircle(c.surface, r, hole)
                drawCircle(rib.copy(alpha = 0.28f), r + 0.75.dp.toPx(), hole, style = Stroke(1.5.dp.toPx()))
            }
            .drawWithContent {
                drawContent()
                drawRoundRect(
                    rib.copy(alpha = 0.22f), style = Stroke(1.dp.toPx()),
                    cornerRadius = CornerRadius(14.dp.toPx()),
                )
            }
            .heightIn(min = if (mini) 0.dp else 138.dp)
            .padding(
                start = 12.dp, end = 12.dp,
                top = if (mini) 20.dp else 26.dp, bottom = if (mini) 12.dp else 16.dp,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, content = content)
    }
}

private fun Color.dim(k: Float) = if (k == 1f) this else Color(red * k, green * k, blue * k, alpha)

/**
 * A couplet's two lines, each kept on one line and never wrapped mid-word.
 * The size comes down together for both lines until the longer one fits, as a scribe would write smaller,
 * and stops at [minSize]. If a line still cannot fit there (very large system font), it wraps between words.
 */
@Composable
fun CoupletText(
    first: String,
    second: String,
    modifier: Modifier = Modifier,
    maxSize: TextUnit = 21.sp,
    minSize: TextUnit = 14.sp,
    color: Color = Olai.colors.leafInk,
) {
    val measurer = rememberTextMeasurer()
    val density = LocalDensity.current
    BoxWithConstraints(modifier.fillMaxWidth().semantics { contentDescription = "$first $second" }) {
        val widthPx = constraints.maxWidth.toFloat()
        val base = TextStyle(fontFamily = KuralFonts.Couplet, fontWeight = FontWeight(560), textAlign = TextAlign.Center)
        val (size, fits) = remember(first, second, widthPx, density) {
            val widest = { sp: Float ->
                val style = base.copy(fontSize = sp.sp)
                maxOf(
                    measurer.measure(first, style, softWrap = false, maxLines = 1).size.width,
                    measurer.measure(second, style, softWrap = false, maxLines = 1).size.width,
                ).toFloat()
            }
            val s = CoupletFit.fit(widthPx, maxSize.value, minSize.value, widest)
            s to (widest(s) <= widthPx)
        }
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            for (line in listOf(first, second)) {
                Text(
                    line, style = base.copy(fontSize = size.sp, lineHeight = (size * 1.5f).sp, color = color),
                    softWrap = !fits, maxLines = if (fits) 1 else 3,
                )
            }
        }
    }
}

/** Pure sizing logic, kept apart so it can be unit tested without a device. */
object CoupletFit {
    /**
     * The largest size in [min]..[max] (in 0.25 steps) at which [widest] fits in [available],
     * or [min] when nothing does. [widest] must grow with size.
     */
    fun fit(available: Float, max: Float, min: Float, widest: (Float) -> Float): Float {
        if (widest(max) <= available) return max
        if (widest(min) > available) return min
        var lo = min
        var hi = max
        while (hi - lo > 0.25f) {
            val mid = (lo + hi) / 2
            if (widest(mid) <= available) lo = mid else hi = mid
        }
        return (kotlin.math.floor(lo * 4) / 4)
    }
}

/** A small label in the leaf's note colour, for the chapter and number under a couplet. */
@Composable
fun LeafNote(text: String, modifier: Modifier = Modifier) {
    Text(
        text, modifier.padding(top = 6.dp),
        style = TextStyle(fontFamily = KuralFonts.Sans, fontSize = 11.5.sp, color = Olai.colors.leafNote),
    )
}
