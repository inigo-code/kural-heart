package com.inigocode.kuralheart.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * Olai tokens, one for one with `.o` and `.o.night` in docs/canvas/project/olai.css.
 * Change a colour there and here together.
 */
@Immutable
data class OlaiColors(
    val bg: Color, val surface: Color, val surface2: Color, val surface3: Color,
    val ink: Color, val ink2: Color, val ink3: Color, val line: Color,
    val primary: Color, val onPrimary: Color, val primarySoft: Color, val onSoft: Color,
    val aram: Color, val porul: Color, val inbam: Color,
    val aramSoft: Color, val porulSoft: Color, val inbamSoft: Color,
    val heart: Color = Color(0xFFD63B58), val gold: Color = Color(0xFFC9A45C),
    val leaf1: Color = Color(0xFFF3E7C6), val leaf2: Color = Color(0xFFE7D4A2),
    val leafInk: Color = Color(0xFF2B1E10), val leafNote: Color = Color(0xFF6A4B22),
    val leafRib: Color = Color(0xFF7A5A2E),
    val isNight: Boolean,
)

val Ivory = OlaiColors(
    bg = Color(0xFFF6F2EA), surface = Color(0xFFFFFDF9), surface2 = Color(0xFFEFE8DC), surface3 = Color(0xFFE7DECF),
    ink = Color(0xFF1E1A16), ink2 = Color(0xFF564D44), ink3 = Color(0xFF73695E), line = Color(0xFFE4DACA),
    primary = Color(0xFFB4492A), onPrimary = Color(0xFFFFF8F2), primarySoft = Color(0xFFF6E2D7), onSoft = Color(0xFF7A2E17),
    aram = Color(0xFF2F6B53), porul = Color(0xFF3A4E86), inbam = Color(0xFFA8475C),
    aramSoft = Color(0xFFE1EDE6), porulSoft = Color(0xFFE2E6F2), inbamSoft = Color(0xFFF4E1E5),
    isNight = false,
)

val Midnight = OlaiColors(
    bg = Color(0xFF14110F), surface = Color(0xFF1E1A17), surface2 = Color(0xFF28231F), surface3 = Color(0xFF332D28),
    ink = Color(0xFFF3ECE2), ink2 = Color(0xFFCBC1B4), ink3 = Color(0xFFA0958A), line = Color(0xFF352E28),
    primary = Color(0xFFE58A62), onPrimary = Color(0xFF2A140B), primarySoft = Color(0xFF3A2419), onSoft = Color(0xFFF4C2A8),
    aram = Color(0xFF7FC3A5), porul = Color(0xFF9DB0E6), inbam = Color(0xFFE79AAD),
    aramSoft = Color(0xFF1F2C26), porulSoft = Color(0xFF1F2433), inbamSoft = Color(0xFF33222A),
    isNight = true,
)

val LocalOlai = staticCompositionLocalOf { Ivory }

object Olai {
    val colors: OlaiColors @Composable get() = LocalOlai.current
}

@Composable
fun KuralHeartTheme(night: Boolean = isSystemInDarkTheme(), tamil: Boolean = false, content: @Composable () -> Unit) {
    val c = if (night) Midnight else Ivory
    val scheme = if (night) {
        darkColorScheme(
            primary = c.primary, onPrimary = c.onPrimary, primaryContainer = c.primarySoft, onPrimaryContainer = c.onSoft,
            background = c.bg, onBackground = c.ink, surface = c.surface, onSurface = c.ink,
            surfaceVariant = c.surface2, onSurfaceVariant = c.ink2, outline = c.ink3, outlineVariant = c.line,
            surfaceContainer = c.surface2, surfaceContainerHigh = c.surface3, error = c.heart,
            secondary = c.primary, onSecondary = c.onPrimary, secondaryContainer = c.primarySoft, onSecondaryContainer = c.onSoft,
            tertiary = c.aram, surfaceContainerLow = c.surface, surfaceContainerLowest = c.surface, surfaceContainerHighest = c.surface3,
        )
    } else {
        lightColorScheme(
            primary = c.primary, onPrimary = c.onPrimary, primaryContainer = c.primarySoft, onPrimaryContainer = c.onSoft,
            background = c.bg, onBackground = c.ink, surface = c.surface, onSurface = c.ink,
            surfaceVariant = c.surface2, onSurfaceVariant = c.ink2, outline = c.ink3, outlineVariant = c.line,
            surfaceContainer = c.surface2, surfaceContainerHigh = c.surface3, error = c.heart,
            secondary = c.primary, onSecondary = c.onPrimary, secondaryContainer = c.primarySoft, onSecondaryContainer = c.onSoft,
            tertiary = c.aram, surfaceContainerLow = c.surface, surfaceContainerLowest = c.surface, surfaceContainerHighest = c.surface3,
        )
    }
    CompositionLocalProvider(LocalOlai provides c) {
        MaterialTheme(colorScheme = scheme, typography = olaiTypography(tamil), content = content)
    }
}
