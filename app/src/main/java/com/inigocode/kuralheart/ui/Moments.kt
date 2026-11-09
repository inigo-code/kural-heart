package com.inigocode.kuralheart.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.inigocode.kuralheart.data.Daily
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Part
import com.inigocode.kuralheart.data.Seal
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun JourneyScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val pack = state.pack
    val entries = state.journal.entries
    val thread = state.thread()
    val today = Journal.today()
    val written = entries.map { it.date }.toSet()
    @Suppress("UNUSED_VARIABLE") val v = state.prefs.sealsVersion
    val earned = state.prefs.seals()
    val chaptersWritten = entries.map { pack.kural(it.kural).chapter }.toSet()
    val since = state.prefs.startedOn.takeIf { it.isNotEmpty() }?.let {
        LocalDate.parse(it).format(DateTimeFormatter.ofPattern("d MMMM", if (tamil) Locale.forLanguageTag("ta") else Locale.ENGLISH))
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
        Spacer(Modifier.height(12.dp))
        Text(l.journey, style = MaterialTheme.typography.displaySmall, color = c.ink, modifier = Modifier.padding(start = 4.dp))
        since?.let { Text(l.since(it), style = MaterialTheme.typography.labelLarge, color = c.ink3, modifier = Modifier.padding(start = 4.dp)) }
        // The thread
        Row(
            Modifier.padding(top = 16.dp).fillMaxWidth().clip(RoundedCornerShape(28.dp)).background(c.surface).padding(18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text("${thread.days}", style = MaterialTheme.typography.displaySmall.copy(fontSize = MaterialTheme.typography.displaySmall.fontSize * 1.4f), color = c.ink)
                // The sentence repeats the number so it reads whole to TalkBack and stays correct in both languages.
                Text(l.threadDays(thread.days), style = MaterialTheme.typography.bodyMedium, color = c.ink2)
                Text(l.longest(thread.longest), style = MaterialTheme.typography.labelMedium, color = c.ink3)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.semantics { contentDescription = l.week(thread.lastSeven) }) {
                    for (i in 6 downTo 0) {
                        val d = today.minusDays(i.toLong())
                        Box(Modifier.size(14.dp).clip(CircleShape).background(if (d in written) c.heart else c.surface3))
                    }
                }
            }
            Valluvar(ValluvarState.Walking, size = 120.dp, still = LocalStill.current)
        }
        Text(l.restNote, style = MaterialTheme.typography.labelMedium, color = c.ink3, modifier = Modifier.padding(4.dp, 8.dp))
        // Chapters: 133 beads, coloured by book, filled where a page was written.
        SectionLabel("${l.chapters} · ${chaptersWritten.size} ${l.of133}")
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(c.surface).padding(16.dp)) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                for (ch in pack.chapters) {
                    val col = partColor(ch.part, c)
                    Box(Modifier.size(14.dp).clip(CircleShape).background(if (ch.n in chaptersWritten) col else col.copy(alpha = 0.14f)))
                }
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                for (p in Part.entries) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(10.dp).clip(CircleShape).background(partColor(p, c)))
                        Spacer(Modifier.width(6.dp))
                        Text(if (tamil) p.ta else p.en, style = MaterialTheme.typography.labelMedium, color = c.ink2)
                    }
                }
            }
        }
        // Seals
        SectionLabel(l.seals)
        FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly, verticalArrangement = Arrangement.spacedBy(14.dp), maxItemsInEachRow = 3) {
            for (s in Seal.entries) {
                val has = s.name in earned
                val (done, of) = s.progress(entries, pack, thread)
                Column(Modifier.width(104.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    SealMedal(s, has, 76.dp)
                    Text(if (tamil) s.ta else s.en, style = MaterialTheme.typography.labelLarge, color = c.ink, textAlign = TextAlign.Center)
                    Text(
                        if (has) l.sealEarned else "${if (tamil) s.ct else s.ce} · $done/$of",
                        style = MaterialTheme.typography.labelMedium, color = c.ink3, textAlign = TextAlign.Center,
                    )
                }
            }
        }
        Spacer(Modifier.height(28.dp))
    }
}

/** A new seal: Valluvar holds it up, with a burst behind him. */
@Composable
fun AwardScreen(state: AppState, seals: List<Seal>) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val s = seals.first()
    Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(Modifier.weight(1f))
        Text(l.newSeal, style = MaterialTheme.typography.labelLarge, color = c.primary)
        Spacer(Modifier.height(36.dp)) // room for his jump
        Box(contentAlignment = Alignment.TopCenter) {
            Valluvar(ValluvarState.Awarding, size = 280.dp, once = true, still = LocalStill.current)
            // The seal sits over the medallion in his hands: art centre (120, 126) of 240 by 220, which at 280dp is
            // 147dp down; the medal's disc centre is 58/120 of its width from its top, 40.6dp at 84dp.
            SealMedal(s, true, 84.dp, Modifier.offset(y = 106.dp))
        }
        Spacer(Modifier.height(12.dp))
        Text(if (tamil) s.ta else s.en, style = MaterialTheme.typography.displaySmall, color = c.ink, textAlign = TextAlign.Center)
        Text(if (tamil) s.ct else s.ce, style = MaterialTheme.typography.bodyLarge, color = c.ink2, textAlign = TextAlign.Center)
        if (seals.size > 1) {
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { for (o in seals.drop(1)) SealMedal(o, true, 48.dp) }
        }
        Spacer(Modifier.weight(1f))
        PrimaryButton(l.continueLabel) { state.pop() }
    }
}

/** How is your heart? Pick a feeling and Valluvar finds a couplet for it. "Very heavy" also offers support. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FeelingScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val pack = state.pack
    var mood by rememberSaveable { mutableStateOf<String?>(null) }
    var attempt by remember { mutableIntStateOf(0) }
    Column(Modifier.fillMaxSize()) {
        TopBar(l.feel, onBack = { state.pop() }, close = true)
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(l.feelSub, style = MaterialTheme.typography.bodyLarge, color = c.ink2, modifier = Modifier.weight(1f))
                Valluvar(ValluvarState.Contemplating, size = 104.dp, still = LocalStill.current)
            }
            Spacer(Modifier.height(10.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for (m in Moods) Chip(if (tamil) m.ta else m.en, on = mood == m.id) { mood = m.id; attempt = 0 }
            }
            mood?.let { m ->
                if (m == "heavy") {
                    Spacer(Modifier.height(16.dp))
                    HeavyDays(onNotNow = { mood = "calm" })
                }
                val n = Daily.forMood(pack, m, state.prefs.seed, attempt)
                val k = pack.kural(n)
                Spacer(Modifier.height(18.dp))
                Text(l.forNow, style = MaterialTheme.typography.labelLarge, color = c.ink3)
                Spacer(Modifier.height(10.dp))
                KuralLeaf(pack, k, false)
                Spacer(Modifier.height(10.dp))
                Text(k.en, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Chip(l.another, Ico.turn) { attempt++ }
                }
                PrimaryButton(l.write, icon = Ico.pen, modifier = Modifier.padding(top = 14.dp)) { state.replaceTop(Route.Write(k.n)) }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

/** Support lines. No number is ever shown until it comes from a checked list for the reader's country. */
@Composable
fun HeavyDays(onNotNow: () -> Unit) {
    val l = LocalL.current
    val c = Olai.colors
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(c.surface).padding(16.dp)) {
        Text(l.heavyTitle, style = MaterialTheme.typography.headlineSmall, color = c.ink)
        Spacer(Modifier.height(6.dp))
        Text(l.heavyBody, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
        for ((t, s) in listOf(l.heavyLineName to l.heavyLineNote, l.heavyPerson to l.heavyPersonNote)) {
            Spacer(Modifier.height(10.dp))
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.surface2).padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(t, style = MaterialTheme.typography.labelLarge, color = c.ink)
                    Text(s, style = MaterialTheme.typography.labelMedium, color = c.ink3)
                }
                Icon(Ico.phone, tint = c.ink3)
            }
        }
        androidx.compose.material3.TextButton(onClick = onNotNow) { Text(l.heavyNotNow, color = c.primary) }
    }
}

