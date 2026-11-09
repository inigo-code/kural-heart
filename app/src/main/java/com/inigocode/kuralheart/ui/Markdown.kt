package com.inigocode.kuralheart.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.em
import com.inigocode.kuralheart.ui.theme.KuralFonts

/**
 * The page's light formatting, written by the toolbar as Markdown: # heading, - list, - [ ] checklist, > quote,
 * **bold** and _italic_. Rendered here for reading; the raw marks stay in the file so nothing is ever lost.
 */
object Markdown {
    fun render(text: String, quoteColor: Color, accent: Color): AnnotatedString = buildAnnotatedString {
        val lines = text.split('\n')
        lines.forEachIndexed { i, raw ->
            when {
                raw.startsWith("# ") -> withStyle(SpanStyle(fontFamily = KuralFonts.Serif, fontWeight = FontWeight.SemiBold, fontSize = 1.25.em)) { inline(raw.drop(2)) }
                raw.startsWith("- [ ] ") -> { append("☐  "); inline(raw.drop(6)) }
                raw.startsWith("- [x] ") || raw.startsWith("- [X] ") -> { withStyle(SpanStyle(color = accent)) { append("☑  ") }; inline(raw.drop(6)) }
                raw.startsWith("- ") || raw.startsWith("* ") -> { withStyle(SpanStyle(color = accent)) { append("•  ") }; inline(raw.drop(2)) }
                raw.startsWith("> ") -> withStyle(SpanStyle(fontStyle = FontStyle.Italic, color = quoteColor)) { append("“"); inline(raw.drop(2)); append("”") }
                else -> inline(raw)
            }
            if (i < lines.lastIndex) append('\n')
        }
    }

    private val inlineRx = Regex("""\*\*(.+?)\*\*|_(.+?)_""")

    private fun AnnotatedString.Builder.inline(s: String) {
        var at = 0
        for (m in inlineRx.findAll(s)) {
            append(s.substring(at, m.range.first))
            m.groupValues[1].takeIf { it.isNotEmpty() }?.let { withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append(it) } }
            m.groupValues[2].takeIf { it.isNotEmpty() }?.let { withStyle(SpanStyle(fontStyle = FontStyle.Italic)) { append(it) } }
            at = m.range.last + 1
        }
        append(s.substring(at))
    }

    /** Plain text with the marks removed, for previews and search results. */
    fun plain(text: String): String = text.lines().joinToString("\n") { l ->
        l.removePrefix("# ").removePrefix("- [ ] ").removePrefix("- [x] ").removePrefix("- ").removePrefix("> ")
    }.replace(inlineRx) { it.groupValues[1].ifEmpty { it.groupValues[2] } }
}
