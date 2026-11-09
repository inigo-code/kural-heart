package com.inigocode.kuralheart.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Kural
import com.inigocode.kuralheart.data.Pack
import com.inigocode.kuralheart.data.Period
import com.inigocode.kuralheart.ui.leaf.CoupletText
import com.inigocode.kuralheart.ui.leaf.Leaf
import com.inigocode.kuralheart.ui.leaf.LeafNote
import com.inigocode.kuralheart.ui.theme.KuralFonts
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import java.time.format.DateTimeFormatter
import java.util.Locale

/** The question for a lens: Mind uses the chapter's own question, Speech and Action the shared lens prompts. */
fun questionText(pack: Pack, k: Kural, lens: Int, tamil: Boolean): String {
    val q = when (lens) {
        1 -> pack.lens.getValue("speech")
        2 -> pack.lens.getValue("action")
        else -> pack.questionFor(k)
    }
    return if (tamil) q.ta else q.en
}

fun dateLine(tamil: Boolean, date: java.time.LocalDate = Journal.today()): String =
    date.format(DateTimeFormatter.ofPattern("EEEE, d MMMM", if (tamil) Locale.forLanguageTag("ta") else Locale.ENGLISH))

/** The couplet on its leaf. Tapping "Turn the leaf" shows Aiyar's English on the back. */
@Composable
fun KuralLeaf(pack: Pack, k: Kural, turned: Boolean, modifier: Modifier = Modifier) {
    val ch = pack.chapterOf(k)
    val tamil = LocalL.current === Tamil
    AnimatedContent(turned, transitionSpec = { fadeIn(tween(260)) togetherWith fadeOut(tween(160)) }, label = "leaf", modifier = modifier) { back ->
        Leaf {
            if (!back) {
                CoupletText(k.a, k.b)
                LeafNote("${ch.ta} · ${if (tamil) "${LocalL.current.kural} ${k.n}" else "${ch.en} · ${k.n}"}")
            } else {
                Text(
                    k.en, textAlign = TextAlign.Center, color = Olai.colors.leafInk,
                    style = MaterialTheme.typography.bodyMedium.copy(fontFamily = KuralFonts.Serif, fontStyle = FontStyle.Italic, fontSize = 15.sp),
                    modifier = Modifier.padding(horizontal = 8.dp),
                )
                LeafNote("${LocalL.current.verseBy} · ${ch.en} · ${k.n}")
            }
        }
    }
}

@Composable
fun TodayScreen(state: AppState, period: Period) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val pack = state.pack
    val today = Journal.today()
    val k = remember(today) { pack.kural(state.graph.todayKural(today)) }
    val written = state.journal.entries.any { it.date == today }
    val thread = state.thread()
    var turned by rememberSaveable { mutableStateOf(false) }
    var lens by rememberSaveable { mutableStateOf(state.prefs.lastLens) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        // Greeting and Valluvar reading in his arch.
        Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 12.dp, top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(dateLine(tamil), style = MaterialTheme.typography.labelLarge, color = c.ink3)
                Text(if (tamil) period.greetTa else period.greetEn, style = MaterialTheme.typography.displaySmall, color = c.ink)
                Text(
                    "${if (tamil) period.ta else "${period.ta} · ${period.en.lowercase()}"}",
                    style = MaterialTheme.typography.labelLarge, color = c.primary,
                )
            }
            Box(Modifier.size(118.dp), contentAlignment = Alignment.BottomCenter) {
                Box(
                    Modifier.padding(start = 10.dp, end = 10.dp, top = 10.dp).fillMaxSize()
                        .clip(RoundedCornerShape(topStart = 60.dp, topEnd = 60.dp, bottomStart = 14.dp, bottomEnd = 14.dp)).background(c.surface2)
                )
                Valluvar(if (written) ValluvarState.Resting else ValluvarState.Reading, size = 118.dp, still = LocalStill.current)
            }
        }
        KuralLeaf(pack, k, turned, Modifier.padding(horizontal = 20.dp, vertical = 16.dp))
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Chip(l.turn, Ico.turn, turned) { turned = !turned }
            Chip(l.share, Ico.share) { state.push(Route.Share(k.n)) }
            Chip(l.feel, Ico.heart) { state.push(Route.Feeling) }
        }
        // The question card, with its three lenses.
        Column(
            Modifier.padding(20.dp).fillMaxWidth().clip(RoundedCornerShape(28.dp)).background(c.surface).padding(18.dp),
        ) {
            Text(l.todayQ, style = MaterialTheme.typography.labelLarge, color = c.ink3)
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                l.lens.forEachIndexed { i, name ->
                    val on = lens == i
                    Box(
                        Modifier.clip(RoundedCornerShape(16.dp)).background(if (on) c.primarySoft else c.surface2)
                            .clickable(role = Role.Tab) { lens = i; state.prefs.lastLens = i }.semantics { selected = on }
                            .heightIn(min = 36.dp).padding(horizontal = 14.dp, vertical = 8.dp),
                    ) { Text(name, style = MaterialTheme.typography.labelLarge, color = if (on) c.onSoft else c.ink2) }
                }
            }
            Spacer(Modifier.height(14.dp))
            Text(questionText(pack, k, lens, tamil), style = MaterialTheme.typography.headlineSmall.copy(fontSize = if (tamil) 19.sp else 21.sp), color = c.ink)
            Spacer(Modifier.height(6.dp))
            PrimaryButton(if (written) l.keep else l.write, icon = Ico.pen, modifier = Modifier.padding(top = 10.dp)) {
                val mine = state.journal.entries.firstOrNull { it.date == today && it.kural == k.n }
                state.push(Route.Write(k.n, mine?.id))
            }
        }
        if (thread.days > 0) {
            Row(
                Modifier.padding(horizontal = 20.dp).clip(RoundedCornerShape(20.dp)).background(c.inbamSoft)
                    .clickable { state.tab = Tab.Journey }.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Ico.heart, tint = c.heart, size = 20.dp)
                Text(l.threadDays(thread.days), style = MaterialTheme.typography.labelLarge, color = c.ink)
            }
        }
        Spacer(Modifier.height(28.dp))
    }
}

@Composable
fun Chip(label: String, icon: String? = null, on: Boolean = false, onClick: () -> Unit) {
    val c = Olai.colors
    Row(
        Modifier.clip(RoundedCornerShape(18.dp)).background(if (on) c.primarySoft else c.surface2).clickable(role = Role.Button, onClick = onClick)
            .heightIn(min = 40.dp).padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        icon?.let { Icon(it, size = 18.dp, tint = if (on) c.onSoft else c.ink2) }
        Text(label, style = MaterialTheme.typography.labelLarge, color = if (on) c.onSoft else c.ink)
    }
}
