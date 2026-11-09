package com.inigocode.kuralheart.ui

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.data.Entry
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Period
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.drop
import androidx.compose.runtime.snapshotFlow
import androidx.compose.foundation.text.input.TextFieldState
import kotlinx.coroutines.launch
import java.time.LocalTime

/** The eight feelings from the canvas, plus "Very heavy", which also offers support lines. */
data class Mood(val id: String, val en: String, val ta: String)

val Moods = listOf(
    Mood("calm", "Calm", "அமைதி"), Mood("grateful", "Grateful", "நன்றி"), Mood("driven", "Driven", "முயற்சி"),
    Mood("unsure", "Seeking clarity", "தெளிவு"), Mood("anxious", "Anxious", "கவலை"), Mood("angry", "Angry", "சினம்"),
    Mood("lonely", "Lonely", "தனிமை"), Mood("missing", "Missing someone", "ஏக்கம்"), Mood("heavy", "Very heavy", "மிகக் கனம்"),
)

fun moodLabel(id: String?, tamil: Boolean) = Moods.firstOrNull { it.id == id }?.let { if (tamil) it.ta else it.en }

@Composable
fun WriteScreen(state: AppState, route: Route.Write) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val pack = state.pack
    val k = pack.kural(route.kural)
    val ch = pack.chapterOf(k)
    val existing = remember(route) { route.entryId?.let { id -> state.journal.entries.firstOrNull { it.id == id } } }
    val now = remember { Journal.now() }
    val base = remember(route) {
        existing ?: Entry(
            date = Journal.today(), created = now, updated = now, kural = k.n, lens = state.prefs.lastLens,
            period = Period.at(LocalTime.now()).name, mood = null, text = "",
        )
    }
    // TextFieldState owns the text, so fast typing and IME edits are never lost to recomposition timing.
    val editor = remember(route) { TextFieldState(base.text) }
    fun text(): String = editor.text.toString()
    var mood by remember(route) { mutableStateOf(base.mood) }
    var lens by remember(route) { mutableStateOf(base.lens) }
    var lastTyped by remember { mutableLongStateOf(0L) }
    var draftShown by remember { mutableStateOf(false) }
    var kbHelp by remember { mutableStateOf(false) }
    var savedOnce by remember { mutableStateOf(existing != null) }
    val focus = remember { FocusRequester() }

    fun current() = base.copy(text = text().trim(), mood = mood, lens = lens, updated = Journal.now())

    // Autosave a draft a moment after typing stops, so nothing is lost if the app is closed mid-sentence.
    LaunchedEffect(editor) {
        snapshotFlow { editor.text.toString() }.drop(1).collectLatest { now ->
            lastTyped = System.currentTimeMillis(); draftShown = false
            delay(1200)
            if (now.isNotBlank()) {
                state.journal.save(current()); savedOnce = true; draftShown = true
            }
        }
    }
    // Leaving with an empty page removes a draft that was saved earlier.
    DisposableEffect(route) {
        onDispose {
            if (text().isBlank() && savedOnce && existing == null) state.activity.lifecycleScopeLaunch { state.journal.delete(base.id) }
        }
    }
    LaunchedEffect(Unit) { if (existing == null) runCatching { focus.requestFocus() } }

    Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.ime)) {
        TopBar(if (existing != null) l.edit else l.write, onBack = { state.pop() }, close = true) {
            IconButton(Ico.keyboard, l.kbTitle, { kbHelp = true }, tint = Olai.colors.ink2)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Row(
                Modifier.clip(RoundedCornerShape(17.dp)).background(c.primarySoft).padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) { Text("${l.kural} ${k.n} · ${if (tamil) ch.ta else ch.en}", style = MaterialTheme.typography.labelLarge, color = c.onSoft) }
            Spacer(Modifier.height(10.dp))
            Text("${k.a}\n${k.b}", style = MaterialTheme.typography.bodyMedium.copy(fontFamily = com.inigocode.kuralheart.ui.theme.KuralFonts.Couplet), color = c.ink2)
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                l.lens.forEachIndexed { i, name ->
                    val on = lens == i
                    Box(
                        Modifier.clip(RoundedCornerShape(16.dp)).background(if (on) c.primarySoft else c.surface2)
                            .clickable(role = Role.Tab) { lens = i }.semantics { selected = on }
                            .heightIn(min = 36.dp).padding(horizontal = 14.dp, vertical = 8.dp),
                    ) { Text(name, style = MaterialTheme.typography.labelLarge, color = if (on) c.onSoft else c.ink2) }
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(questionText(pack, k, lens, tamil), style = MaterialTheme.typography.headlineSmall.copy(fontSize = if (tamil) 18.sp else 20.sp), color = c.ink)
            Spacer(Modifier.height(14.dp))
            Box(Modifier.fillMaxWidth().heightIn(min = 220.dp).clip(RoundedCornerShape(20.dp)).background(c.surface).padding(16.dp)) {
                if (text().isEmpty()) Text(l.writeHere, style = MaterialTheme.typography.bodyLarge, color = c.ink3)
                BasicTextField(
                    state = editor,
                    textStyle = MaterialTheme.typography.bodyLarge.copy(color = c.ink, fontSize = 18.sp, lineHeight = if (tamil) 31.sp else 29.sp),
                    cursorBrush = SolidColor(c.primary),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp).focusRequester(focus).semantics { contentDescription = l.writeHere },
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (m in Moods) Chip(if (tamil) m.ta else m.en, on = mood == m.id) { mood = if (mood == m.id) null else m.id }
            }
            if (mood == "heavy") {
                Spacer(Modifier.height(10.dp))
                Note(l.heavyLink, icon = Ico.heart, iconTint = c.heart, modifier = Modifier.clickable { state.push(Route.Feeling) })
            }
            Spacer(Modifier.height(20.dp))
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(l.wordsN(current().wordCount), style = MaterialTheme.typography.labelMedium, color = c.ink3)
                if (draftShown) Text(l.draftSaved, style = MaterialTheme.typography.labelMedium, color = c.aram)
            }
            Valluvar(ValluvarState.Writing, size = 84.dp, typing = lastTyped > 0 && !draftShown, still = LocalStill.current)
        }
        PrimaryButton(l.save, enabled = text().isNotBlank(), modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 16.dp)) {
            val e = current()
            savedOnce = true
            state.savePage(e) { state.pop() }
        }
    }
    if (kbHelp) {
        val ctx = state.activity
        AlertDialog(
            onDismissRequest = { kbHelp = false },
            title = { Text(l.kbTitle) },
            text = { Text("${l.kbBody}\n\n1. ${l.kb1}\n2. ${l.kb2}\n3. ${l.kb3}") },
            confirmButton = {
                TextButton({ kbHelp = false; ctx.startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) }) { Text(l.kbOpen) }
            },
            dismissButton = { TextButton({ kbHelp = false }) { Text(l.kbLater) } },
        )
    }
}
