package com.inigocode.kuralheart.ui

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.data.Entry
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Part
import androidx.compose.ui.graphics.asImageBitmap
import com.inigocode.kuralheart.ui.leaf.CoupletText
import com.inigocode.kuralheart.ui.leaf.Leaf
import com.inigocode.kuralheart.ui.leaf.LeafNote
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

fun partColor(p: Part, c: com.inigocode.kuralheart.ui.theme.OlaiColors): Color = when (p) {
    Part.Aram -> c.aram; Part.Porul -> c.porul; Part.Inbam -> c.inbam
}

@Composable
fun JournalScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    var query by rememberSaveable { mutableStateOf("") }
    var calendar by rememberSaveable { mutableStateOf(false) }
    val all = state.journal.entries
    val f = state.entryFilter
    val shown = f.apply(if (query.isBlank()) all.toList() else state.journal.search(query), state.pack)
    var filtersOpen by rememberSaveable { mutableStateOf(false) }
    val today = Journal.today()
    val yearAgo = all.filter { it.date == today.minusYears(1) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
        item {
            Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp), verticalAlignment = Alignment.Bottom) {
                Column(Modifier.weight(1f)) {
                    Text(l.pages(all.size), style = MaterialTheme.typography.labelLarge, color = c.ink3)
                    Text(l.journal, style = MaterialTheme.typography.displaySmall, color = c.ink)
                }
                Box {
                    IconButton(Ico.filter, tr("Filters", "வடிகட்டிகள்"), { filtersOpen = true }, tint = if (f.count > 0) c.primary else c.ink)
                    if (f.count > 0) Box(Modifier.align(Alignment.TopEnd).padding(6.dp).size(18.dp).clip(CircleShape).background(c.primary), contentAlignment = Alignment.Center) {
                        Text("${f.count}", style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp), color = c.onPrimary)
                    }
                }
                IconButton(if (calendar) Ico.list else Ico.calendar, if (calendar) l.list else l.calendar, { calendar = !calendar })
            }
        }
        if (all.isEmpty() && state.journal.loaded) {
            item { EmptyJournal(state) }
            return@LazyColumn
        }
        item {
            Row(
                Modifier.padding(16.dp).fillMaxWidth().clip(RoundedCornerShape(26.dp)).background(c.surface2).heightIn(min = 52.dp).padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(Ico.search, tint = c.ink3, size = 20.dp)
                Box(Modifier.weight(1f)) {
                    if (query.isEmpty()) Text(l.searchPh, style = MaterialTheme.typography.bodyMedium, color = c.ink3, maxLines = 1)
                    BasicTextField(
                        query, { query = it }, singleLine = true, cursorBrush = SolidColor(c.primary),
                        textStyle = MaterialTheme.typography.bodyLarge.copy(color = c.ink),
                        modifier = Modifier.fillMaxWidth().semantics { contentDescription = l.searchPh },
                    )
                }
                if (query.isNotEmpty()) IconButton(Ico.close, l.close, { query = "" }, tint = c.ink3)
            }
        }
        if (f.count > 0) {
            item {
                Row(Modifier.padding(horizontal = 16.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(tr("${shown.size} of ${all.size} pages", "${all.size}-இல் ${shown.size} பக்கங்கள்"), style = MaterialTheme.typography.labelLarge, color = c.ink3, modifier = Modifier.weight(1f))
                    androidx.compose.material3.TextButton({ state.entryFilter = EntryFilter() }) { Text(tr("Clear filters", "வடிகட்டிகளை நீக்கு"), color = c.primary) }
                }
            }
        }
        if (calendar && query.isBlank()) {
            item { CalendarMonth(state) }
            return@LazyColumn
        }
        if (query.isBlank() && yearAgo.isNotEmpty()) {
            item {
              Column {
                val e = yearAgo.first()
                Column(
                    Modifier.padding(horizontal = 16.dp).fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(c.primarySoft)
                        .clickable { state.push(Route.Page(e.id)) }.padding(16.dp),
                ) {
                    Text(l.otd, style = MaterialTheme.typography.labelLarge, color = c.onSoft)
                    Text(e.text, style = MaterialTheme.typography.bodyLarge, color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Spacer(Modifier.height(8.dp))
              }
            }
        }
        if (shown.isEmpty()) {
            item {
                Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    ArchValluvar(ValluvarState.Listening, size = 170.dp)
                    Text(l.noResults, style = MaterialTheme.typography.headlineSmall, color = c.ink, textAlign = TextAlign.Center)
                    Text(l.noResultsSub, style = MaterialTheme.typography.bodyMedium, color = c.ink2, textAlign = TextAlign.Center)
                }
            }
        }
        items(shown, key = { it.id }) { e -> EntryCard(state, e, tamil) }
    }
    if (filtersOpen) FilterSheet(state) { filtersOpen = false }
}

@Composable
fun EntryCard(state: AppState, e: Entry, tamil: Boolean) {
    val c = Olai.colors
    val l = LocalL.current
    val k = state.pack.kural(e.kural)
    val part = state.pack.chapterOf(k).part
    Column(
        Modifier.padding(horizontal = 16.dp, vertical = 6.dp).fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(c.surface)
            .clickable(role = Role.Button) { state.push(Route.Page(e.id)) }.padding(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(dateLine(tamil, e.date), style = MaterialTheme.typography.headlineSmall.copy(fontSize = 17.sp), color = c.ink2, modifier = Modifier.weight(1f))
            Box(Modifier.size(8.dp).clip(CircleShape).background(partColor(part, c)))
            Spacer(Modifier.width(6.dp))
            Text("${l.kural} ${k.n}", style = MaterialTheme.typography.labelLarge, color = c.ink2)
        }
        Spacer(Modifier.height(6.dp))
        Row {
            Text(Markdown.plain(e.text), style = MaterialTheme.typography.bodyLarge, color = c.ink, maxLines = 3, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
            e.photos.firstOrNull()?.let { Spacer(Modifier.width(10.dp)); PhotoThumb(state, it, 64) }
        }
        Spacer(Modifier.height(8.dp))
        val bits = listOfNotNull(
            if (e.starred) "★" else null, moodLabel(e.mood, tamil), e.weather?.let { weatherLabel(it, tamil) }, e.place?.name, timeOf(e),
        ) + e.tags.map { "#$it" }
        Text(bits.joinToString(" · "), style = MaterialTheme.typography.labelMedium, color = c.ink3, maxLines = 2, overflow = TextOverflow.Ellipsis)
    }
}

fun timeOf(e: Entry): String {
    val t = java.time.Instant.ofEpochMilli(e.created).atZone(java.time.ZoneId.systemDefault()).toLocalTime()
    return timeLabel(t.hour * 60 + t.minute)
}

@Composable
private fun EmptyJournal(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        ArchValluvar(ValluvarState.Reading, size = 200.dp)
        Spacer(Modifier.height(12.dp))
        Text(l.empty, style = MaterialTheme.typography.headlineSmall, color = c.ink, textAlign = TextAlign.Center)
        Text(l.emptySub, style = MaterialTheme.typography.bodyMedium, color = c.ink2, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = 300.dp))
        Spacer(Modifier.height(16.dp))
        PrimaryButton(l.firstPage, icon = Ico.pen) { state.push(Route.Write(state.graph.todayKural())) }
    }
}

@Composable
private fun CalendarMonth(state: AppState) = Column {
    val c = Olai.colors
    val tamil = state.prefs.tamil
    var month by rememberSaveable { mutableStateOf(YearMonth.now().toString()) }
    val ym = YearMonth.parse(month)
    var picked by rememberSaveable { mutableStateOf(Journal.today().toString()) }
    val byDay = state.journal.entries.groupBy { it.date }
    val locale = if (tamil) Locale.forLanguageTag("ta") else Locale.ENGLISH
    Column(Modifier.padding(horizontal = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(Ico.back, "Previous month", { month = ym.minusMonths(1).toString() })
            Text(
                ym.format(DateTimeFormatter.ofPattern("MMMM yyyy", locale)), style = MaterialTheme.typography.headlineSmall,
                color = c.ink, modifier = Modifier.weight(1f), textAlign = TextAlign.Center,
            )
            IconButton(Ico.chevron, "Next month", { month = ym.plusMonths(1).toString() })
        }
        Row(Modifier.fillMaxWidth()) {
            for (d in java.time.DayOfWeek.entries) {
                Text(d.getDisplayName(TextStyle.NARROW, locale), Modifier.weight(1f), textAlign = TextAlign.Center, style = MaterialTheme.typography.labelMedium, color = c.ink3)
            }
        }
        val lead = ym.atDay(1).dayOfWeek.value - 1
        val cells = lead + ym.lengthOfMonth()
        for (row in 0 until (cells + 6) / 7) {
            Row(Modifier.fillMaxWidth()) {
                for (col in 0..6) {
                    val i = row * 7 + col - lead + 1
                    Box(Modifier.weight(1f).aspectRatio(1f).padding(3.dp), contentAlignment = Alignment.Center) {
                        if (i in 1..ym.lengthOfMonth()) {
                            val day = ym.atDay(i)
                            val has = byDay[day] != null
                            val on = day.toString() == picked
                            val isToday = day == Journal.today()
                            Box(
                                Modifier.fillMaxSize().clip(CircleShape)
                                    .background(if (on) c.primary else if (has) c.primarySoft else Color.Transparent)
                                    .then(if (isToday && !on) Modifier.border(1.5.dp, c.primary, CircleShape) else Modifier)
                                    .clickable(role = Role.Button) { picked = day.toString() },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text("$i", style = MaterialTheme.typography.labelLarge, color = if (on) c.onPrimary else if (has) c.onSoft else c.ink2)
                            }
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        val dayEntries = byDay[LocalDate.parse(picked)].orEmpty()
        if (dayEntries.isEmpty()) {
            Text(dateLine(tamil, LocalDate.parse(picked)), style = MaterialTheme.typography.labelLarge, color = c.ink3, modifier = Modifier.padding(4.dp))
        }
    }
    Column { for (e in byDay[LocalDate.parse(picked)].orEmpty()) EntryCard(state, e, tamil) }
}

@Composable
fun PageScreen(state: AppState, id: String) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val e = state.journal.entries.firstOrNull { it.id == id }
    if (e == null) { state.pop(); return }
    val k = state.pack.kural(e.kural)
    val ch = state.pack.chapterOf(k)
    Column(Modifier.fillMaxSize()) {
        TopBar(dateLine(tamil, e.date), onBack = { state.pop() }) {
            IconButton(Ico.star, tr("Star", "நட்சத்திரம்"), {
                state.activity.lifecycleScopeLaunch { state.journal.save(e.copy(starred = !e.starred, updated = Journal.now())) }
            }, tint = if (e.starred) c.gold else c.ink2)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Leaf(mini = true, modifier = Modifier.clickable { state.push(Route.KuralView(k.n)) }) {
                CoupletText(k.a, k.b, maxSize = 19.sp, minSize = 13.sp)
                LeafNote(tr("Chapter ${ch.n} · ${ch.ta} · Kural ${k.n}", "அதிகாரம் ${ch.n} · ${ch.ta} · குறள் ${k.n}"))
            }
            Spacer(Modifier.height(18.dp))
            Text(questionText(state.pack, k, e.lens, tamil), style = MaterialTheme.typography.labelLarge, color = c.ink3)
            Spacer(Modifier.height(8.dp))
            Text(Markdown.render(e.text, c.ink2, c.primary), style = MaterialTheme.typography.bodyLarge.copy(fontSize = 19.sp, lineHeight = if (tamil) 33.sp else 30.sp), color = c.ink)
            for (id in e.photos) {
                Spacer(Modifier.height(12.dp))
                PhotoFull(state, id)
            }
            Spacer(Modifier.height(14.dp))
            DetailLine(Ico.clock, "${dateLine(tamil, e.date)} · ${timeOf(e)}")
            e.weather?.let { DetailLine(if (it.kind in setOf("sun", "wind")) Ico.sun else Ico.cloud, weatherLabel(it, tamil)) }
            e.place?.let { DetailLine(Ico.pin, it.name) }
            moodLabel(e.mood, tamil)?.let { DetailLine(Ico.heart, it) }
            if (e.tags.isNotEmpty()) DetailLine(Ico.tag, e.tags.joinToString(" ") { "#$it" })
            Text(l.wordsN(e.wordCount), style = MaterialTheme.typography.labelMedium, color = c.ink3, modifier = Modifier.padding(top = 6.dp))
            Spacer(Modifier.height(24.dp))
        }
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Chip(l.edit, Ico.pen) { state.replaceTop(Route.Write(e.kural, e.id)) }
            Chip(l.share, Ico.share) {
                val text = "${e.text}\n\n— ${l.kural} ${k.n}: ${k.a} / ${k.b}"
                state.activity.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), null))
            }
            Spacer(Modifier.weight(1f))
            Chip(l.delete, Ico.trash) { state.pop(); state.deletePage(e.id) }
        }
    }
}

@Composable
private fun DetailLine(icon: String, text: String) {
    val c = Olai.colors
    Row(Modifier.padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, size = 18.dp, tint = c.ink3)
        Spacer(Modifier.width(10.dp))
        Text(text, style = MaterialTheme.typography.labelLarge, color = c.ink2)
    }
}

@Composable
private fun PhotoFull(state: AppState, id: String) {
    val bmp by androidx.compose.runtime.produceState<android.graphics.Bitmap?>(null, id) { value = state.graph.photos.load(id, 1600) }
    bmp?.let {
        androidx.compose.foundation.Image(
            it.asImageBitmap(), null,
            Modifier.fillMaxWidth().aspectRatio(it.width.toFloat() / it.height).clip(RoundedCornerShape(18.dp)),
            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
        )
    }
}

/** What the Journal is filtered by. Lives in [AppState] so it survives switching tabs. */
data class EntryFilter(
    val starred: Boolean = false,
    val photos: Boolean = false,
    val moods: Set<String> = emptySet(),
    val tags: Set<String> = emptySet(),
    val parts: Set<Part> = emptySet(),
    val within: Int = 0,
    val oldestFirst: Boolean = false,
) {
    val count: Int get() = listOf(starred, photos, moods.isNotEmpty(), tags.isNotEmpty(), parts.isNotEmpty(), within > 0, oldestFirst).count { it }

    fun apply(list: List<Entry>, pack: com.inigocode.kuralheart.data.Pack): List<Entry> {
        val since = if (within > 0) Journal.today().minusDays(within.toLong() - 1) else null
        val out = list.filter { e ->
            (!starred || e.starred) && (!photos || e.photos.isNotEmpty()) &&
                (moods.isEmpty() || e.mood in moods) && (tags.isEmpty() || e.tags.any { it in tags }) &&
                (parts.isEmpty() || pack.chapterOf(pack.kural(e.kural)).part in parts) && (since == null || !e.date.isBefore(since))
        }
        return if (oldestFirst) out.sortedWith(compareBy<Entry> { it.date }.thenBy { it.created }) else out
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun FilterSheet(state: AppState, dismiss: () -> Unit) {
    val c = Olai.colors
    val tamil = state.prefs.tamil
    var f by androidx.compose.runtime.remember { mutableStateOf(state.entryFilter) }
    androidx.compose.material3.ModalBottomSheet(onDismissRequest = { state.entryFilter = f; dismiss() }, containerColor = c.surface) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 24.dp).verticalScroll(rememberScrollState())) {
            Text(tr("Filter your pages", "பக்கங்களை வடிகட்டு"), style = MaterialTheme.typography.headlineSmall, color = c.ink)
            SectionLabel(tr("Show", "காட்டு"))
            androidx.compose.foundation.layout.FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Chip(tr("Starred", "நட்சத்திரமிட்டவை"), Ico.star, f.starred) { f = f.copy(starred = !f.starred) }
                Chip(tr("With photos", "படங்களுடன்"), Ico.gallery, f.photos) { f = f.copy(photos = !f.photos) }
                Chip(tr("Oldest first", "பழையவை முதலில்"), on = f.oldestFirst) { f = f.copy(oldestFirst = !f.oldestFirst) }
            }
            SectionLabel(tr("When", "எப்போது"))
            androidx.compose.foundation.layout.FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for ((d, en, ta) in listOf(Triple(0, "Any time", "எப்போதும்"), Triple(7, "Last 7 days", "கடந்த 7 நாள்கள்"), Triple(30, "Last 30 days", "கடந்த 30 நாள்கள்"), Triple(365, "Last year", "கடந்த ஆண்டு"))) {
                    Chip(if (tamil) ta else en, on = f.within == d) { f = f.copy(within = d) }
                }
            }
            SectionLabel(tr("Feeling", "உணர்வு"))
            androidx.compose.foundation.layout.FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for (m in Moods) Chip(if (tamil) m.ta else m.en, on = m.id in f.moods) { f = f.copy(moods = if (m.id in f.moods) f.moods - m.id else f.moods + m.id) }
            }
            SectionLabel(tr("Book of the Kural", "குறளின் பால்"))
            androidx.compose.foundation.layout.FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for (p in Part.entries) Chip(if (tamil) p.ta else p.en, on = p in f.parts) { f = f.copy(parts = if (p in f.parts) f.parts - p else f.parts + p) }
            }
            val tags = state.journal.allTags
            if (tags.isNotEmpty()) {
                SectionLabel(tr("Tags", "குறிச்சொற்கள்"))
                androidx.compose.foundation.layout.FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (t in tags) Chip("#$t", on = t in f.tags) { f = f.copy(tags = if (t in f.tags) f.tags - t else f.tags + t) }
                }
            }
            Spacer(Modifier.height(18.dp))
            PrimaryButton(tr("Show pages", "பக்கங்களைக் காட்டு")) { state.entryFilter = f; dismiss() }
            androidx.compose.material3.TextButton({ f = EntryFilter() }, Modifier.fillMaxWidth()) { Text(tr("Clear all", "அனைத்தையும் நீக்கு"), color = c.primary) }
        }
    }
}
