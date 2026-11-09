package com.inigocode.kuralheart.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.data.Kural
import com.inigocode.kuralheart.data.Pack
import com.inigocode.kuralheart.data.Part
import com.inigocode.kuralheart.ui.leaf.CoupletText
import com.inigocode.kuralheart.ui.leaf.Leaf
import com.inigocode.kuralheart.ui.leaf.LeafNote
import com.inigocode.kuralheart.ui.theme.KuralFonts
import com.inigocode.kuralheart.ui.theme.Olai

/** "அதிகாரம் 40 · கல்வி · குறள் 391" in Tamil, "Chapter 40 · கல்வி · Learning · Kural 391" in English. */
@Composable
fun kuralRef(pack: Pack, k: Kural): String {
    val ch = pack.chapterOf(k)
    return tr("Chapter ${ch.n} · ${ch.ta} · ${ch.en} · Kural ${k.n}", "அதிகாரம் ${ch.n} · ${ch.ta} · குறள் ${k.n}")
}

/** The English chosen in Settings: Aiyar's prose, Pope's verse or Pope's prose. */
fun translationOf(k: Kural, which: String): String = when (which) {
    "pope" -> "${k.popeA}\n${k.popeB}"
    "popeprose" -> k.popeProse
    else -> k.en
}

fun translator(which: String): String = when (which) {
    "pope" -> "G. U. Pope, 1886"
    "popeprose" -> "G. U. Pope, 1886, prose"
    else -> "V. V. S. Aiyar, 1916"
}

private enum class KFilter { All, Aram, Porul, Inbam, Saved, Written, Unread }

@Composable
fun LibraryScreen(state: AppState) {
    val c = Olai.colors
    val pack = state.pack
    val prefs = state.prefs
    var query by rememberSaveable { mutableStateOf("") }
    var filter by rememberSaveable { mutableStateOf(KFilter.All) }
    val written = remember(state.journal.entries.size) { state.journal.entries.map { it.kural }.toSet() }
    val q = query.trim()
    val kuralMode = q.isNotEmpty() || filter in setOf(KFilter.Saved, KFilter.Written, KFilter.Unread)
    val partOf = mapOf(KFilter.Aram to Part.Aram, KFilter.Porul to Part.Porul, KFilter.Inbam to Part.Inbam)
    val results: List<Kural> = if (!kuralMode) emptyList() else pack.kurals.filter { k ->
        val ch = pack.chapterOf(k)
        val matches = q.isEmpty() || k.n.toString() == q || "${k.a} ${k.b}".contains(q) || ch.ta.contains(q) ||
            ch.en.contains(q, true) || k.en.contains(q, true) || k.popeA.contains(q, true) || k.popeB.contains(q, true) ||
            (q.toIntOrNull()?.let { it in 1..133 && ch.n == it } ?: false)
        val passes = when (filter) {
            KFilter.Saved -> k.n in prefs.saved
            KFilter.Written -> k.n in written
            KFilter.Unread -> k.n !in prefs.read
            KFilter.All -> true
            else -> ch.part == partOf[filter]
        }
        matches && passes
    }.let { list -> q.toIntOrNull()?.let { n -> list.sortedBy { if (it.n == n) 0 else 1 } } ?: list }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
        item {
            Column(Modifier.padding(start = 20.dp, end = 20.dp, top = 12.dp)) {
                Text(tr("1,330 couplets · 133 chapters", "1,330 குறள்கள் · 133 அதிகாரங்கள்"), style = MaterialTheme.typography.labelLarge, color = c.ink3)
                Text(tr("Thirukkural", "திருக்குறள்"), style = MaterialTheme.typography.displaySmall, color = c.ink)
            }
        }
        item {
            Row(
                Modifier.padding(16.dp).fillMaxWidth().clip(RoundedCornerShape(26.dp)).background(c.surface2).heightIn(min = 54.dp).padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(Ico.search, tint = c.ink3, size = 20.dp)
                val ph = tr("A number, a word in Tamil or English", "எண், தமிழ் அல்லது ஆங்கிலச் சொல்")
                Box(Modifier.weight(1f)) {
                    if (query.isEmpty()) Text(ph, style = MaterialTheme.typography.bodyMedium, color = c.ink3, maxLines = 1)
                    BasicTextField(
                        query, { query = it }, singleLine = true, cursorBrush = SolidColor(c.primary),
                        textStyle = MaterialTheme.typography.bodyLarge.copy(color = c.ink), modifier = Modifier.fillMaxWidth().semantics { contentDescription = ph },
                    )
                }
                if (query.isNotEmpty()) IconButton(Ico.close, LocalL.current.close, { query = "" }, tint = c.ink3)
            }
        }
        item {
            Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val labels = listOf(
                    KFilter.All to tr("All", "அனைத்தும்"),
                    KFilter.Aram to tr("Virtue · அறம்", "அறம்"),
                    KFilter.Porul to tr("Wealth · பொருள்", "பொருள்"),
                    KFilter.Inbam to tr("Love · இன்பம்", "இன்பம்"),
                    KFilter.Saved to tr("Saved (${prefs.saved.size})", "சேமித்தவை (${prefs.saved.size})"),
                    KFilter.Written to tr("Written about", "எழுதியவை"),
                    KFilter.Unread to tr("Not read yet", "இன்னும் படிக்காதவை"),
                )
                for ((f, label) in labels) Chip(label, on = filter == f) { filter = f }
            }
            Spacer(Modifier.height(8.dp))
        }
        if (kuralMode) {
            item {
                Text(
                    tr("${results.size} couplets", "${results.size} குறள்கள்"), style = MaterialTheme.typography.labelLarge, color = c.ink3,
                    modifier = Modifier.padding(start = 20.dp, top = 4.dp, bottom = 4.dp),
                )
            }
            items(results.take(300), key = { it.n }) { k -> KuralRow(state, k) }
        } else {
            val parts = when (filter) {
                KFilter.Aram -> listOf(Part.Aram); KFilter.Porul -> listOf(Part.Porul); KFilter.Inbam -> listOf(Part.Inbam)
                else -> Part.entries
            }
            for (p in parts) {
                item(key = "part-${p.name}") {
                    Column(Modifier.padding(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 8.dp)) {
                        Text(p.ta, style = MaterialTheme.typography.headlineSmall.copy(fontFamily = KuralFonts.SerifTamil), color = partColor(p, c))
                        val range = when (p) { Part.Aram -> "1–38"; Part.Porul -> "39–108"; Part.Inbam -> "109–133" }
                        Text(tr("${p.en} · chapters $range", "அதிகாரங்கள் $range"), style = MaterialTheme.typography.labelLarge, color = c.ink3)
                    }
                }
                items(pack.chapters.filter { it.part == p }, key = { "ch-${it.n}" }) { ch ->
                    val readCount = ((ch.n - 1) * 10 + 1..ch.n * 10).count { it in prefs.read }
                    Row(
                        Modifier.fillMaxWidth().clickable(role = Role.Button) { state.push(Route.Chapter(ch.n)) }
                            .padding(horizontal = 20.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(Modifier.size(40.dp).clip(CircleShape).background(partColor(p, c).copy(alpha = 0.12f)), contentAlignment = Alignment.Center) {
                            Text("${ch.n}", style = MaterialTheme.typography.labelLarge, color = partColor(p, c))
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(ch.ta, style = MaterialTheme.typography.titleMedium.copy(fontFamily = KuralFonts.SerifTamil, fontSize = 18.sp), color = c.ink)
                            Text(ch.en, style = MaterialTheme.typography.labelMedium, color = c.ink3, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        if (readCount > 0) Text("$readCount/10", style = MaterialTheme.typography.labelMedium, color = c.ink3)
                    }
                }
            }
        }
    }
}

/** One couplet in a list: its number, the two lines flush left, and its chapter. */
@Composable
fun KuralRow(state: AppState, k: Kural) {
    val c = Olai.colors
    val pack = state.pack
    val saved = k.n in state.prefs.saved
    Row(
        Modifier.padding(horizontal = 16.dp, vertical = 5.dp).fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(c.surface)
            .clickable(role = Role.Button) { state.push(Route.KuralView(k.n)) }.padding(14.dp),
    ) {
        Column(Modifier.weight(1f)) {
            Text(
                "${k.a}\n${k.b}", style = MaterialTheme.typography.bodyLarge.copy(fontFamily = KuralFonts.Couplet, fontSize = 19.sp, lineHeight = 29.sp),
                color = c.ink,
            )
            Spacer(Modifier.height(4.dp))
            Text(kuralRef(pack, k), style = MaterialTheme.typography.labelMedium, color = c.ink3, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        IconButton(Ico.star, tr(if (saved) "Remove from saved" else "Save", if (saved) "சேமிப்பிலிருந்து நீக்கு" else "சேமி"), {
            state.prefs.saved = if (saved) state.prefs.saved - k.n else state.prefs.saved + k.n
        }, tint = if (saved) c.gold else c.ink3)
    }
}

@Composable
fun ChapterScreen(state: AppState, n: Int) {
    val c = Olai.colors
    val pack = state.pack
    val ch = pack.chapter(n)
    Column(Modifier.fillMaxSize()) {
        TopBar(tr("Chapter $n", "அதிகாரம் $n"), onBack = { state.pop() })
        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(bottom = 16.dp)) {
            item {
                Column(Modifier.padding(horizontal = 20.dp)) {
                    Text(ch.ta, style = MaterialTheme.typography.displaySmall.copy(fontFamily = KuralFonts.SerifTamil, fontSize = 30.sp), color = c.ink)
                    Text("${ch.en} · ${if (LocalL.current === Tamil) ch.part.ta else ch.part.en}", style = MaterialTheme.typography.labelLarge, color = partColor(ch.part, c))
                    Spacer(Modifier.height(12.dp))
                }
            }
            items((1..10).map { pack.kural((n - 1) * 10 + it) }, key = { it.n }) { k -> KuralRow(state, k) }
        }
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            if (n > 1) TextButton({ state.replaceTop(Route.Chapter(n - 1)) }) { Text(tr("‹ Chapter ${n - 1}", "‹ அதிகாரம் ${n - 1}"), color = c.primary) } else Spacer(Modifier.width(1.dp))
            if (n < 133) TextButton({ state.replaceTop(Route.Chapter(n + 1)) }) { Text(tr("Chapter ${n + 1} ›", "அதிகாரம் ${n + 1} ›"), color = c.primary) }
        }
    }
}

/** One couplet's page: the leaf, all three English renderings, the question, audio, save, share and write. */
@Composable
fun KuralScreen(state: AppState, n: Int) {
    val c = Olai.colors
    val pack = state.pack
    val prefs = state.prefs
    val k = pack.kural(n)
    val speaker = state.graph.speaker
    val saved = n in prefs.saved
    LaunchedEffect(n) { if (n !in prefs.read) prefs.read = prefs.read + n }
    DisposableEffect(Unit) { onDispose { speaker.stop() } }
    val pages = state.journal.entries.filter { it.kural == n }
    Column(Modifier.fillMaxSize()) {
        TopBar(tr("Kural $n", "குறள் $n"), onBack = { state.pop() }) {
            IconButton(Ico.star, tr(if (saved) "Remove from saved" else "Save", "சேமி"), {
                prefs.saved = if (saved) prefs.saved - n else prefs.saved + n
            }, tint = if (saved) c.gold else c.ink2)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Text(kuralRef(pack, k), style = MaterialTheme.typography.labelLarge, color = partColor(pack.chapterOf(k).part, c))
            Spacer(Modifier.height(12.dp))
            Leaf { CoupletText(k.a, k.b, maxSize = 26.sp); LeafNote(pack.chapterOf(k).ta) }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val playing = speaker.speaking == n
                Chip(if (playing) tr("Stop", "நிறுத்து") else tr("Listen", "கேள்"), if (playing) Ico.stop else Ico.play, playing) {
                    speaker.read(k, translationOf(k, prefs.translation))
                }
                Chip(tr("Share", "பகிர்"), Ico.share) { state.push(Route.Share(n)) }
                Chip(tr("Make today's couplet", "இன்றைய குறளாக்கு"), Ico.today) {
                    state.graph.setToday(n); state.stack.clear(); state.tab = Tab.Today
                }
            }
            if (speaker.missingTamil) {
                Spacer(Modifier.height(8.dp))
                Note(tr("This phone has no Tamil voice yet, so only the English was read. Add one in voice settings.", "இந்த அலைபேசியில் தமிழ்க் குரல் இல்லை; ஆங்கிலம் மட்டும் படிக்கப்பட்டது. குரல் அமைப்புகளில் சேர்க்கலாம்."), icon = Ico.play)
                TextButton({ speaker.voiceSettings(state.activity) }) { Text(tr("Open voice settings", "குரல் அமைப்புகளைத் திற"), color = c.primary) }
            }
            Rendering("V. V. S. Aiyar, 1916", k.en, italic = false)
            Rendering("G. U. Pope, 1886", "${k.popeA}\n${k.popeB}", italic = true)
            Rendering(tr("Pope's edition, prose", "போப் பதிப்பு, உரைநடை"), k.popeProse, italic = false)
            SectionLabel(tr("A question to write about", "எழுதுவதற்கு ஒரு கேள்வி"))
            Text(questionText(pack, k, 0, prefs.tamil), style = MaterialTheme.typography.headlineSmall.copy(fontSize = 21.sp), color = c.ink)
            PrimaryButton(LocalL.current.write, icon = Ico.pen, modifier = Modifier.padding(top = 12.dp)) { state.push(Route.Write(n)) }
            if (pages.isNotEmpty()) {
                SectionLabel(tr("Your pages on this couplet", "இந்தக் குறள் பற்றிய உங்கள் பக்கங்கள்"))
                for (e in pages) EntryCard(state, e, prefs.tamil)
            }
            Spacer(Modifier.height(16.dp))
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            if (n > 1) TextButton({ state.replaceTop(Route.KuralView(n - 1)) }) { Text(tr("‹ Kural ${n - 1}", "‹ குறள் ${n - 1}"), color = c.primary) } else Spacer(Modifier.width(1.dp))
            if (n < 1330) TextButton({ state.replaceTop(Route.KuralView(n + 1)) }) { Text(tr("Kural ${n + 1} ›", "குறள் ${n + 1} ›"), color = c.primary) }
        }
    }
}

@Composable
private fun Rendering(by: String, text: String, italic: Boolean) {
    val c = Olai.colors
    Column(Modifier.padding(top = 18.dp)) {
        Text(by, style = MaterialTheme.typography.labelLarge, color = c.ink3)
        Spacer(Modifier.height(4.dp))
        Text(
            text, color = c.ink,
            style = MaterialTheme.typography.bodyLarge.copy(
                fontFamily = if (italic) KuralFonts.Serif else KuralFonts.Sans, fontStyle = if (italic) FontStyle.Italic else FontStyle.Normal,
            ),
        )
    }
}
