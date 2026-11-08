package com.inigocode.kuralheart.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.R

/**
 * Three bundled families (all SIL OFL, licences in assets/licenses):
 *  - Literata: Latin headings and the Pope translation.
 *  - Noto Serif Tamil: Tamil headings and Valluvar's letters.
 *  - Anek Tamil: all UI text, and the couplets at width 75 so a line of seven words fits a phone.
 * Each weight is a named instance of the variable file, so no extra font files ship.
 */
object KuralFonts {
    private fun anek(weight: Int, width: Float = 100f) = Font(
        R.font.anek_tamil, FontWeight(weight),
        variationSettings = FontVariation.Settings(FontVariation.weight(weight), FontVariation.width(width)),
    )

    private fun literata(weight: Int, italic: Boolean = false) = Font(
        if (italic) R.font.literata_italic else R.font.literata, FontWeight(weight),
        if (italic) FontStyle.Italic else FontStyle.Normal,
        variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
    )

    private fun serifTamil(weight: Int) = Font(
        R.font.noto_serif_tamil, FontWeight(weight),
        variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
    )

    val Sans = FontFamily(anek(400), anek(500), anek(600), anek(700))

    /** The couplet face: Anek Tamil condensed. 560 is the canvas's reading weight. */
    val Couplet = FontFamily(anek(560, 75f), anek(700, 75f))

    val Serif = FontFamily(
        literata(400), literata(500), literata(600),
        literata(400, italic = true), literata(500, italic = true),
    )

    val SerifTamil = FontFamily(serifTamil(400), serifTamil(500), serifTamil(600), serifTamil(800))
}

/** Material type roles at the canvas sizes. Tamil swaps the heading serif and opens the body leading. */
fun olaiTypography(tamil: Boolean): Typography {
    val heading = if (tamil) KuralFonts.SerifTamil else KuralFonts.Serif
    val trim = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)
    val body = TextStyle(fontFamily = KuralFonts.Sans, fontSize = 16.sp, lineHeight = if (tamil) 27.5.sp else 25.6.sp, lineHeightStyle = trim)
    return Typography(
        displaySmall = TextStyle(fontFamily = heading, fontWeight = FontWeight.Medium, fontSize = if (tamil) 27.sp else 32.sp, lineHeight = 1.2.em, letterSpacing = (-0.01).em),
        headlineSmall = TextStyle(fontFamily = heading, fontWeight = FontWeight.Medium, fontSize = if (tamil) 21.sp else 24.sp, lineHeight = 1.3.em),
        titleMedium = TextStyle(fontFamily = KuralFonts.Sans, fontWeight = FontWeight.SemiBold, fontSize = 17.sp, lineHeight = 1.35.em),
        bodyLarge = body,
        bodyMedium = body.copy(fontSize = 14.5.sp, lineHeight = if (tamil) 25.sp else 22.sp),
        labelLarge = TextStyle(fontFamily = KuralFonts.Sans, fontWeight = FontWeight.SemiBold, fontSize = 13.5.sp, lineHeight = 1.3.em),
        labelMedium = TextStyle(fontFamily = KuralFonts.Sans, fontWeight = FontWeight.Medium, fontSize = 12.5.sp, lineHeight = 1.3.em),
    )
}
