package com.inigocode.kuralheart.ui

import android.Manifest
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.input.TextFieldState
import androidx.compose.foundation.text.input.delete
import androidx.compose.foundation.text.input.insert
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
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.inigocode.kuralheart.data.Entry
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Period
import com.inigocode.kuralheart.data.Place
import com.inigocode.kuralheart.data.Places
import com.inigocode.kuralheart.data.Weather
import com.inigocode.kuralheart.ui.theme.KuralFonts
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.launch
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

/** The eight feelings from the canvas, plus "Very heavy", which also offers support lines. */
data class Mood(val id: String, val en: String, val ta: String)

val Moods = listOf(
    Mood("calm", "Calm", "அமைதி"), Mood("grateful", "Grateful", "நன்றி"), Mood("driven", "Driven", "முயற்சி"),
    Mood("unsure", "Seeking clarity", "தெளிவு"), Mood("anxious", "Anxious", "கவலை"), Mood("angry", "Angry", "சினம்"),
    Mood("lonely", "Lonely", "தனிமை"), Mood("missing", "Missing someone", "ஏக்கம்"), Mood("heavy", "Very heavy", "மிகக் கனம்"),
)

fun moodLabel(id: String?, tamil: Boolean) = Moods.firstOrNull { it.id == id }?.let { if (tamil) it.ta else it.en }

/** The eight weather kinds, with their names. */
val WeatherKinds = listOf(
    Triple("sun", "Sunny", "வெயில்"), Triple("partly", "Partly cloudy", "சிறிது மேகம்"), Triple("cloud", "Cloudy", "மேகமூட்டம்"),
    Triple("rain", "Rain", "மழை"), Triple("storm", "Storm", "இடிமழை"), Triple("fog", "Mist", "பனிமூட்டம்"),
    Triple("wind", "Windy", "காற்று"), Triple("snow", "Cold", "குளிர்"),
)

fun weatherLabel(w: Weather, tamil: Boolean): String {
    val name = WeatherKinds.firstOrNull { it.first == w.kind }?.let { if (tamil) it.third else it.second } ?: w.kind
    return w.tempC?.let { "$name · ${it.toInt()}°" } ?: name
}

// --- formatting on the editor's text, stored as light Markdown (see Markdown.kt) ---

private fun TextFieldState.wrapSelection(marker: String) = edit {
    val sel = selection
    if (sel.collapsed) {
        insert(sel.start, marker + marker)
        selection = TextRange(sel.start + marker.length)
    } else {
        insert(sel.end, marker)
        insert(sel.start, marker)
        selection = TextRange(sel.start + marker.length, sel.end + marker.length)
    }
}

private fun TextFieldState.toggleLinePrefix(prefix: String) = edit {
    val sel = selection
    val text = toString()
    val lineStart = if (sel.start == 0) 0 else text.lastIndexOf('\n', sel.start - 1) + 1
    if (text.startsWith(prefix, lineStart)) {
        delete(lineStart, lineStart + prefix.length)
        selection = TextRange((sel.start - prefix.length).coerceAtLeast(lineStart))
    } else {
        insert(lineStart, prefix)
        selection = TextRange(sel.start + prefix.length, sel.end + prefix.length)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WriteScreen(state: AppState, route: Route.Write) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    val pack = state.pack
    val ctx = state.activity
    val scope = rememberCoroutineScope()
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
    var date by remember(route) { mutableStateOf(base.date) }
    var created by remember(route) { mutableLongStateOf(base.created) }
    var starred by remember(route) { mutableStateOf(base.starred) }
    var place by remember(route) { mutableStateOf(base.place) }
    var weather by remember(route) { mutableStateOf(base.weather) }
    val tags = remember(route) { mutableStateListOf<String>().apply { addAll(base.tags) } }
    val photos = remember(route) { mutableStateListOf<String>().apply { addAll(base.photos) } }
    var lastTyped by remember { mutableLongStateOf(0L) }
    var draftShown by remember { mutableStateOf(false) }
    var savedOnce by remember { mutableStateOf(existing != null) }
    var dialog by remember { mutableStateOf<String?>(null) }
    var fetching by remember { mutableStateOf(false) }
    val focus = remember { FocusRequester() }

    fun current() = base.copy(
        text = text().trim(), mood = mood, lens = lens, updated = Journal.now(), date = date, created = created,
        period = Period.at(Instant.ofEpochMilli(created).atZone(ZoneId.systemDefault()).toLocalTime()).name,
        starred = starred, place = place, weather = weather, tags = tags.toList(), photos = photos.toList(),
    )

    fun autosave() {
        if (text().isNotBlank() || photos.isNotEmpty()) scope.launch { state.journal.save(current()); savedOnce = true; draftShown = true }
    }

    // Place and weather: ask for location once, then look up the place name and the weather.
    fun fetchDetails() {
        fetching = true
        scope.launch {
            val loc = Places.here(ctx)
            if (loc != null) {
                val name = Places.name(ctx, loc.latitude, loc.longitude, tamil)
                place = Place(name ?: "%.3f, %.3f".format(loc.latitude, loc.longitude), loc.latitude, loc.longitude)
                Places.weather(loc.latitude, loc.longitude)?.let { weather = it }
                autosave()
            } else {
                state.snackbar.showSnackbar(tr2(tamil, "Location is off or not allowed.", "இருப்பிடம் முடக்கப்பட்டுள்ளது அல்லது அனுமதிக்கப்படவில்லை."))
            }
            fetching = false
        }
    }
    val askLocation = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { ok -> if (ok) fetchDetails() }
    fun details() = if (Places.hasPermission(ctx)) fetchDetails() else askLocation.launch(Manifest.permission.ACCESS_COARSE_LOCATION)

    val pickPhotos = rememberLauncherForActivityResult(ActivityResultContracts.PickMultipleVisualMedia(6)) { uris ->
        ctx.pickingFile = false
        scope.launch { for (u in uris) runCatching { photos += state.graph.photos.add(u) }; autosave() }
    }
    var cameraUri by remember { mutableStateOf<Uri?>(null) }
    val takePhoto = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        ctx.pickingFile = false
        val u = cameraUri
        if (ok && u != null) scope.launch { runCatching { photos += state.graph.photos.add(u) }; autosave() }
    }
    fun camera() {
        val f = File(File(ctx.cacheDir, "camera").apply { mkdirs() }, "shot-${System.currentTimeMillis()}.jpg")
        val u = FileProvider.getUriForFile(ctx, "${ctx.packageName}.share", f)
        cameraUri = u
        ctx.pickingFile = true
        takePhoto.launch(u)
    }

    LaunchedEffect(editor) {
        snapshotFlow { editor.text.toString() }.drop(1).collectLatest {
            lastTyped = System.currentTimeMillis(); draftShown = false
            delay(1200)
            autosave()
        }
    }
    // A new page can fill in its place and weather on its own, if the person turned that on.
    LaunchedEffect(Unit) {
        if (existing == null) runCatching { focus.requestFocus() }
        if (existing == null && state.prefs.autoDetails && Places.hasPermission(ctx)) fetchDetails()
    }
    DisposableEffect(route) {
        onDispose {
            if (text().isBlank() && photos.isEmpty() && savedOnce && existing == null) state.activity.lifecycleScopeLaunch { state.journal.delete(base.id) }
        }
    }

    Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.ime)) {
        TopBar(if (existing != null) l.edit else l.write, onBack = { state.pop() }, close = true) {
            IconButton(Ico.star, tr("Star this page", "இந்தப் பக்கத்தை நட்சத்திரமிடு"), { starred = !starred; autosave() }, tint = if (starred) c.gold else c.ink2)
            IconButton(Ico.keyboard, l.kbTitle, { dialog = "kb" }, tint = c.ink2)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Row(
                Modifier.clip(RoundedCornerShape(17.dp)).background(c.primarySoft).clickable { state.push(Route.KuralView(k.n)) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) { Text(tr("Kural ${k.n} · Chapter ${ch.n} · ${ch.en}", "குறள் ${k.n} · அதிகாரம் ${ch.n} · ${ch.ta}"), style = MaterialTheme.typography.labelLarge, color = c.onSoft) }
            Spacer(Modifier.height(10.dp))
            Text("${k.a}\n${k.b}", style = MaterialTheme.typography.bodyLarge.copy(fontFamily = KuralFonts.Couplet, fontSize = 18.sp, lineHeight = 28.sp), color = c.ink2)
            Spacer(Modifier.height(12.dp))
            // Details: date, time, weather, place, tags. Each opens its own small editor.
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Chip(dateLine(tamil, date), Ico.calendar) { dialog = "date" }
                Chip(timeOf(current()), Ico.clock) { dialog = "time" }
                Chip(weather?.let { weatherLabel(it, tamil) } ?: tr("Weather", "வானிலை"), if (weather?.kind in setOf("sun", "wind")) Ico.sun else Ico.cloud, weather != null) { dialog = "weather" }
                Chip(place?.name ?: tr("Place", "இடம்"), Ico.pin, place != null) { dialog = "place" }
                Chip(if (tags.isEmpty()) tr("Tags", "குறிச்சொற்கள்") else tags.joinToString(" ") { "#$it" }, Ico.tag, tags.isNotEmpty()) { dialog = "tags" }
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                l.lens.forEachIndexed { i, name ->
                    val on = lens == i
                    Box(
                        Modifier.clip(RoundedCornerShape(16.dp)).background(if (on) c.primarySoft else c.surface2)
                            .clickable(role = Role.Tab) { lens = i }.semantics { selected = on }
                            .heightIn(min = 40.dp).padding(horizontal = 14.dp, vertical = 9.dp),
                    ) { Text(name, style = MaterialTheme.typography.labelLarge, color = if (on) c.onSoft else c.ink2) }
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(questionText(pack, k, lens, tamil), style = MaterialTheme.typography.headlineSmall.copy(fontSize = if (tamil) 20.sp else 22.sp), color = c.ink)
            Spacer(Modifier.height(14.dp))
            Box(Modifier.fillMaxWidth().heightIn(min = 240.dp).clip(RoundedCornerShape(20.dp)).background(c.surface).padding(16.dp)) {
                if (editor.text.isEmpty()) Text(l.writeHere, style = MaterialTheme.typography.bodyLarge, color = c.ink3)
                BasicTextField(
                    state = editor,
                    textStyle = MaterialTheme.typography.bodyLarge.copy(color = c.ink, fontSize = 19.sp, lineHeight = if (tamil) 33.sp else 30.sp),
                    cursorBrush = SolidColor(c.primary),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 220.dp).focusRequester(focus).semantics { contentDescription = l.writeHere },
                )
            }
            Spacer(Modifier.height(12.dp))
            // Photos
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                for (id in photos.toList()) {
                    Box {
                        PhotoThumb(state, id, 96)
                        Box(
                            Modifier.align(Alignment.TopEnd).padding(4.dp).size(28.dp).clip(CircleShape).background(c.ink.copy(alpha = 0.6f))
                                .clickable { photos.remove(id); autosave() }.semantics { contentDescription = tr2(tamil, "Remove photo", "படத்தை நீக்கு") },
                            contentAlignment = Alignment.Center,
                        ) { Icon(Ico.close, size = 16.dp, tint = c.bg) }
                    }
                }
                Chip(tr("Photos", "படங்கள்"), Ico.gallery) { ctx.pickingFile = true; pickPhotos.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }
                Chip(tr("Camera", "கேமரா"), Ico.photo) { camera() }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (m in Moods) Chip(if (tamil) m.ta else m.en, on = mood == m.id) { mood = if (mood == m.id) null else m.id; autosave() }
            }
            if (mood == "heavy") {
                Spacer(Modifier.height(10.dp))
                Note(l.heavyLink, icon = Ico.heart, iconTint = c.heart, modifier = Modifier.clickable { state.push(Route.Feeling) })
            }
            Spacer(Modifier.height(20.dp))
        }
        // The formatting bar sits just above the keyboard.
        Row(Modifier.fillMaxWidth().background(c.surface2).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(Ico.bold, tr("Bold", "தடித்த எழுத்து"), { editor.wrapSelection("**") }, tint = c.ink2)
            IconButton(Ico.italic, tr("Italic", "சாய்வு எழுத்து"), { editor.wrapSelection("_") }, tint = c.ink2)
            IconButton(Ico.heading, tr("Heading", "தலைப்பு"), { editor.toggleLinePrefix("# ") }, tint = c.ink2)
            IconButton(Ico.bullets, tr("List", "பட்டியல்"), { editor.toggleLinePrefix("- ") }, tint = c.ink2)
            IconButton(Ico.check, tr("Checklist", "சரிபார்ப்புப் பட்டியல்"), { editor.toggleLinePrefix("- [ ] ") }, tint = c.ink2)
            IconButton(Ico.quote, tr("Quote", "மேற்கோள்"), { editor.toggleLinePrefix("> ") }, tint = c.ink2)
            Spacer(Modifier.weight(1f))
            Valluvar(ValluvarState.Writing, size = 56.dp, typing = lastTyped > 0 && !draftShown, still = LocalStill.current)
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(l.wordsN(current().wordCount), style = MaterialTheme.typography.labelMedium, color = c.ink3)
            Spacer(Modifier.weight(1f))
            if (draftShown) Text(l.draftSaved, style = MaterialTheme.typography.labelMedium, color = c.aram)
        }
        PrimaryButton(l.save, enabled = text().isNotBlank() || photos.isNotEmpty(), modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 12.dp)) {
            savedOnce = true
            state.savePage(current()) { state.pop() }
        }
    }

    when (dialog) {
        "kb" -> AlertDialog(
            onDismissRequest = { dialog = null },
            title = { Text(l.kbTitle) },
            text = { Text("${l.kbBody}\n\n1. ${l.kb1}\n2. ${l.kb2}\n3. ${l.kb3}") },
            confirmButton = { TextButton({ dialog = null; ctx.startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) }) { Text(l.kbOpen) } },
            dismissButton = { TextButton({ dialog = null }) { Text(l.kbLater) } },
        )
        "date" -> LaunchedEffect(Unit) {
            DatePickerDialog(ctx, { _, y, m, d -> date = LocalDate.of(y, m + 1, d); autosave() }, date.year, date.monthValue - 1, date.dayOfMonth)
                .apply { datePicker.maxDate = System.currentTimeMillis(); setOnDismissListener { dialog = null } }.show()
        }
        "time" -> LaunchedEffect(Unit) {
            val t = Instant.ofEpochMilli(created).atZone(ZoneId.systemDefault()).toLocalTime()
            TimePickerDialog(ctx, { _, h, m ->
                created = LocalDateTime.of(date, LocalTime.of(h, m)).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(); autosave()
            }, t.hour, t.minute, false).apply { setOnDismissListener { dialog = null } }.show()
        }
        "weather" -> AlertDialog(
            onDismissRequest = { dialog = null },
            title = { Text(tr("Weather", "வானிலை")) },
            text = {
                Column {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        for ((kind, en, ta) in WeatherKinds) Chip(if (tamil) ta else en, on = weather?.kind == kind) {
                            weather = Weather(kind, weather?.tempC); autosave()
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    TextButton({ dialog = null; details() }) { Text(if (fetching) "…" else tr("Fill in from where I am", "நான் இருக்கும் இடத்திலிருந்து நிரப்பு"), color = c.primary) }
                }
            },
            confirmButton = { TextButton({ dialog = null }) { Text(l.close) } },
            dismissButton = { if (weather != null) TextButton({ weather = null; dialog = null; autosave() }) { Text(tr("Remove", "நீக்கு")) } },
        )
        "place" -> {
            var name by remember { mutableStateOf(place?.name ?: "") }
            AlertDialog(
                onDismissRequest = { dialog = null },
                title = { Text(tr("Place", "இடம்")) },
                text = {
                    Column {
                        Field(name, { name = it }, tr("Where were you?", "எங்கே இருந்தீர்கள்?"))
                        TextButton({ dialog = null; details() }) { Text(tr("Use where I am", "நான் இருக்கும் இடம்"), color = c.primary) }
                        Text(
                            tr("The name is looked up by Google Play services from your rough position.", "பெயர் உங்கள் தோராயமான இருப்பிடத்திலிருந்து Google Play சேவைகளால் கண்டறியப்படும்."),
                            style = MaterialTheme.typography.labelMedium, color = c.ink3,
                        )
                    }
                },
                confirmButton = { TextButton({ place = name.trim().takeIf { it.isNotEmpty() }?.let { Place(it, place?.lat, place?.lon) }; dialog = null; autosave() }) { Text(l.save) } },
                dismissButton = { TextButton({ place = null; dialog = null; autosave() }) { Text(tr("Remove", "நீக்கு")) } },
            )
        }
        "tags" -> {
            var input by remember { mutableStateOf("") }
            AlertDialog(
                onDismissRequest = { dialog = null },
                title = { Text(tr("Tags", "குறிச்சொற்கள்")) },
                text = {
                    Column {
                        Field(input, { input = it }, tr("Add a tag, like family", "ஒரு குறிச்சொல், எ.கா. குடும்பம்"))
                        Spacer(Modifier.height(10.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            for (t in (tags + state.journal.allTags).distinct().take(24)) Chip("#$t", on = t in tags) { if (t in tags) tags.remove(t) else tags.add(t) }
                        }
                    }
                },
                confirmButton = {
                    TextButton({
                        input.split(',', ' ').map { it.trim().removePrefix("#") }.filter { it.isNotEmpty() }.forEach { if (it !in tags) tags.add(it) }
                        dialog = null; autosave()
                    }) { Text(l.save) }
                },
                dismissButton = { TextButton({ dialog = null }) { Text(l.cancel) } },
            )
        }
    }
}

/** A string in the lead language outside composition (for snackbars). */
fun tr2(tamil: Boolean, en: String, ta: String) = if (tamil) ta else en

/** A decrypted photo, square-cropped to [size] dp. */
@Composable
fun PhotoThumb(state: AppState, id: String, size: Int, modifier: Modifier = Modifier) {
    val bmp by produceState<android.graphics.Bitmap?>(null, id) { value = state.graph.photos.load(id, 600) }
    Box(modifier.size(size.dp).clip(RoundedCornerShape(16.dp)).background(Olai.colors.surface2)) {
        bmp?.let { Image(it.asImageBitmap(), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop) }
    }
}
