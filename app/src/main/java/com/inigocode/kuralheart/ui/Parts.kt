package com.inigocode.kuralheart.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.data.Seal
import com.inigocode.kuralheart.ui.theme.KuralFonts
import com.inigocode.kuralheart.ui.theme.Olai

/** True when motion should stop: the app's Reduce motion setting. (The system setting is read by Valluvar.) */
val LocalStill = compositionLocalOf { false }

/** The canvas's line icons, 24 by 24, drawn with a 1.8 stroke. */
object Ico {
    const val today = "M3.5 12a4 4 0 0 1 4-4h9a4 4 0 0 1 0 8h-9a4 4 0 0 1-4-4ZM10.5 10.8h6M10.5 13.3h3.5M7.3 12h.01"
    const val journal = "M6 5h11.5a2.5 2.5 0 0 1 0 5H6a2.5 2.5 0 0 1 0-5ZM6 14h11.5a2.5 2.5 0 0 1 0 5H6a2.5 2.5 0 0 1 0-5ZM7.5 2.5v19"
    const val journey = "M4 18c3-1 4-4 7-4s4 3 7 2 2-6 2-6M4 18h.01M20 10h.01M12 3l1.2 2.5L16 6l-2 2 .5 2.8L12 9.5 9.5 10.8 10 8 8 6l2.8-.5Z"
    const val settings = "M17.2 3.8a2.3 2.3 0 0 1 3.2 3.2L9 18.4 4.5 19.5 5.6 15ZM15 6l3 3M5.6 15l3.4 3.4"
    const val back = "M15 5l-7 7 7 7"
    const val close = "M6 6l12 12M18 6L6 18"
    const val chevron = "M9 5l7 7-7 7"
    const val search = "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.8-4.8"
    const val calendar = "M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM4 10h16M8 3.5v4M16 3.5v4"
    const val list = "M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"
    const val share = "M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"
    const val pen = "M15.5 4.5l4 4L9 19l-5 1 1-5ZM13.5 6.5l4 4"
    const val plus = "M12 5v14M5 12h14"
    const val heart = "M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20Z"
    const val lock = "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
    const val shield = "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z M9 12l2 2 4-4"
    const val trash = "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"
    const val phone = "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
    const val keyboard = "M4 7h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8"
    const val bulb = "M12 3.5a6 6 0 0 0-3.5 10.9V17h7v-2.6A6 6 0 0 0 12 3.5ZM9.5 20h5"
    const val turn = "M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"
    const val words = "M4 6h16M4 12h10M4 18h7M17 15l3 3-3 3"
}

@Composable
fun Icon(path: String, modifier: Modifier = Modifier, size: Dp = 24.dp, tint: Color = Olai.colors.ink, stroke: Float = 1.8f) {
    val p = remember(path) { PathParser().parsePathString(path).toPath() }
    Canvas(modifier.size(size)) {
        scale(this.size.width / 24f, this.size.height / 24f, Offset.Zero) {
            drawPath(p, tint, style = Stroke(stroke, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
    }
}

/** A 48dp round icon button. */
@Composable
fun IconButton(path: String, label: String, onClick: () -> Unit, tint: Color = Olai.colors.ink) {
    Box(
        Modifier.size(48.dp).clip(CircleShape).clickable(onClickLabel = label, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) { Icon(path, tint = tint) }
}

/** The top bar of a pushed page: back or close, and a serif title. */
@Composable
fun TopBar(title: String, onBack: () -> Unit, close: Boolean = false, actions: @Composable RowScope.() -> Unit = {}) {
    val l = LocalL.current
    Row(Modifier.fillMaxWidth().height(64.dp).padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        IconButton(if (close) Ico.close else Ico.back, if (close) l.close else l.back, onBack)
        Spacer(Modifier.width(4.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall, color = Olai.colors.ink, modifier = Modifier.weight(1f), maxLines = 1)
        actions()
    }
}

/** A white rounded group of rows, as in Settings. */
@Composable
fun Group(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val c = Olai.colors
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(c.surface)
            .then(Modifier),
        content = content,
    )
}

@Composable
fun GroupRow(
    title: String,
    sub: String? = null,
    onClick: (() -> Unit)? = null,
    titleColor: Color = Olai.colors.ink,
    divider: Boolean = true,
    trailing: @Composable (() -> Unit)? = null,
) {
    val c = Olai.colors
    Column {
        if (divider) HorizontalDivider(color = c.line, thickness = 1.dp)
        Row(
            Modifier.fillMaxWidth().heightIn(min = 60.dp)
                .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyLarge, color = titleColor)
                sub?.let { Text(it, style = MaterialTheme.typography.labelMedium, color = c.ink3) }
            }
            trailing?.invoke() ?: if (onClick != null) Icon(Ico.chevron, tint = c.ink3, size = 20.dp) else Unit
        }
    }
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text, modifier.padding(start = 4.dp, top = 24.dp, bottom = 8.dp),
        style = MaterialTheme.typography.labelLarge, color = Olai.colors.ink3,
    )
}

/** A soft note with an icon, used for promises and tips. */
@Composable
fun Note(text: String, icon: String = Ico.shield, iconTint: Color = Olai.colors.aram, modifier: Modifier = Modifier) {
    val c = Olai.colors
    Row(
        modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(c.surface2).padding(14.dp, 14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, tint = iconTint, size = 22.dp)
        Text(text, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
    }
}

/** The seal medallion: brass rim, enamel face in its tone, ribbon tails, and the Tamil numeral over the digit. */
@Composable
fun SealMedal(seal: Seal, earned: Boolean, size: Dp, modifier: Modifier = Modifier) {
    val (c1, c2, c3) = when (seal.tone) {
        "rose" -> Triple(Color(0xFFD65473), Color(0xFF8A2238), Color(0xFF6C1A2C))
        "indigo" -> Triple(Color(0xFF5C72B8), Color(0xFF26366A), Color(0xFF1B2852))
        "green" -> Triple(Color(0xFF4E9A79), Color(0xFF1D4B3B), Color(0xFF143A2D))
        else -> Triple(Color(0xFFD2714A), Color(0xFF8E3418), Color(0xFF6E2810))
    }
    val tailL = remember { PathParser().parsePathString("M40 88L30 128 42 121 50 132 60 96Z").toPath() }
    val tailR = remember { PathParser().parsePathString("M80 88L90 128 78 121 70 132 60 96Z").toPath() }
    val gleam = remember { PathParser().parsePathString("M27 46C33 28 49 19 66 20 52 25 38 34 31 52Z").toPath() }
    val h = size * (136f / 120f)
    val k = size.value / 120f
    val glyphSize = when {
        seal.glyph.length > 3 -> 15f
        seal.glyph.length > 1 -> 26f
        seal.num != null -> 36f
        else -> 44f
    } * k
    Box(modifier.size(size, h).semantics { contentDescription = seal.en }) {
        Canvas(Modifier.size(size, h)) {
            scale(this.size.width / 120f, this.size.width / 120f, Offset.Zero) {
                val centre = Offset(60f, 58f)
                if (earned) {
                    drawPath(tailL, c2); drawPath(tailR, c3)
                    drawCircle(Color.Black.copy(alpha = 0.18f), 56f, Offset(60f, 61f))
                    drawCircle(Brush.linearGradient(listOf(Color(0xFFF6DC9C), Color(0xFFD3AE62), Color(0xFF9A7432)), Offset(4f, 2f), Offset(116f, 114f)), 56f, centre)
                    drawCircle(Color(0xFF7E5C22).copy(alpha = 0.7f), 51.5f, centre, style = Stroke(2.4f, cap = StrokeCap.Round, pathEffect = PathEffect.dashPathEffect(floatArrayOf(0.01f, 6.74f))))
                    drawCircle(Color(0xFF7E5C22).copy(alpha = 0.55f), 47f, centre)
                    drawCircle(Brush.radialGradient(listOf(c1, c2), Offset(60f - 45f + 0.38f * 90f, 58f - 45f + 0.32f * 90f), 72f), 45f, centre)
                    drawCircle(Color(0xFFFFF4DF).copy(alpha = 0.35f), 40.5f, centre, style = Stroke(0.9f))
                    drawPath(gleam, Color.White.copy(alpha = 0.16f))
                } else {
                    drawCircle(c1.copy(alpha = 0.55f), 54f, centre, style = Stroke(1.6f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f, 5f))))
                    drawCircle(c1.copy(alpha = 0.09f), 44f, centre)
                }
            }
        }
        Column(
            Modifier.size(size, size * (116f / 120f)).padding(top = 0.dp),
            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
        ) {
            val face = if (earned) Color(0xFFFFF4DF) else c1.copy(alpha = 0.6f)
            Text(seal.glyph, style = TextStyle(fontFamily = KuralFonts.SerifTamil, fontSize = (glyphSize / fontScaleFix()).sp, color = face, lineHeight = (glyphSize * 1.1f / fontScaleFix()).sp))
            seal.num?.let {
                Text(it, style = TextStyle(fontFamily = KuralFonts.Serif, fontWeight = FontWeight.SemiBold, fontSize = (14f * k / fontScaleFix()).sp, color = face.copy(alpha = if (earned) 0.82f else 0.6f), textAlign = TextAlign.Center))
            }
        }
    }
}

/** Seal faces are drawing, not reading text, so they ignore the system font scale. */
@Composable
private fun fontScaleFix(): Float = androidx.compose.ui.platform.LocalDensity.current.fontScale
