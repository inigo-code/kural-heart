package com.inigocode.kuralheart.workbench

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.backup.FolderBackupProbe
import com.inigocode.kuralheart.ui.leaf.CoupletText
import com.inigocode.kuralheart.ui.leaf.Leaf
import com.inigocode.kuralheart.ui.leaf.LeafNote
import com.inigocode.kuralheart.ui.theme.KuralFonts
import com.inigocode.kuralheart.ui.theme.KuralHeartTheme
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarFace
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import com.inigocode.kuralheart.ui.valluvar.defaultFace
import org.json.JSONObject

private enum class Bench(val label: String) { Leaf("Leaf"), Valluvar("Valluvar"), Type("Type"), Backup("Backup") }

@Composable
fun Workbench(start: String? = null) {
    var night by rememberSaveable { mutableStateOf(false) }
    var tamil by rememberSaveable { mutableStateOf(false) }
    var tab by rememberSaveable { mutableStateOf(Bench.entries.firstOrNull { it.name == start } ?: Bench.Leaf) }
    KuralHeartTheme(night = night, tamil = tamil) {
        val c = Olai.colors
        Column(
            Modifier.fillMaxSize().background(c.bg).windowInsetsPadding(WindowInsets.safeDrawing),
        ) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Kural Heart", style = MaterialTheme.typography.headlineSmall, color = c.ink)
                    Text("Milestone 0 workbench", style = MaterialTheme.typography.labelMedium, color = c.ink3)
                }
                FilterChip(selected = night, onClick = { night = !night }, label = { Text("Midnight") })
                Spacer(Modifier.padding(4.dp))
                FilterChip(selected = tamil, onClick = { tamil = !tamil }, label = { Text("தமிழ்") })
            }
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth().padding(horizontal = 20.dp)) {
                Bench.entries.forEachIndexed { i, b ->
                    SegmentedButton(
                        selected = tab == b, onClick = { tab = b },
                        shape = SegmentedButtonDefaults.itemShape(i, Bench.entries.size),
                    ) { Text(b.label, maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) }
                }
            }
            Spacer(Modifier.height(12.dp))
            when (tab) {
                Bench.Leaf -> LeafBench()
                Bench.Valluvar -> ValluvarBench()
                Bench.Type -> TypeBench()
                Bench.Backup -> BackupBench()
            }
        }
    }
}

private class Sample(val n: Int, val a: String, val b: String, val chapterTa: String, val chapterEn: String, val pope: String?)

/** Debug builds carry the prototype couplets; release builds have none until the verified pack lands. */
private fun loadSpecimen(context: Context): List<Sample> = runCatching {
    val json = JSONObject(context.assets.open("specimen.json").use { it.readBytes().decodeToString() })
    val arr = json.getJSONArray("kurals")
    List(arr.length()) { i ->
        val k = arr.getJSONObject(i)
        Sample(k.getInt("n"), k.getString("a"), k.getString("b"), k.getString("chapterTa"), k.getString("chapterEn"), if (k.isNull("pope")) null else k.getString("pope"))
    }
}.getOrDefault(emptyList())

@Composable
private fun LeafBench() {
    val context = LocalContext.current
    val samples = remember { loadSpecimen(context) }
    val c = Olai.colors
    if (samples.isEmpty()) {
        Text("No specimen couplets in this build.", Modifier.padding(20.dp), color = c.ink2)
        return
    }
    LazyColumn(contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        item {
            Text(
                "Prototype text from the design canvas, unverified. The real couplets come from the kural pack.",
                style = MaterialTheme.typography.labelMedium, color = c.ink3,
            )
        }
        items(samples, key = { it.n }) { k ->
            Leaf {
                CoupletText(k.a, k.b)
                LeafNote("${k.chapterTa} · ${k.chapterEn} · ${k.n}")
                k.pope?.let {
                    Text(
                        it, Modifier.padding(top = 8.dp),
                        style = MaterialTheme.typography.bodyMedium.copy(fontFamily = KuralFonts.Serif, fontStyle = FontStyle.Italic, fontSize = 13.sp, lineHeight = 1.45.em),
                        color = c.leafInk,
                    )
                }
            }
        }
        item {
            Text("Mini leaf (widget, journal rows)", style = MaterialTheme.typography.labelLarge, color = c.ink2)
            Spacer(Modifier.height(8.dp))
            Leaf(mini = true) { CoupletText(samples.first().a, samples.first().b, maxSize = 16.sp, minSize = 12.sp) }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ValluvarBench() {
    var state by rememberSaveable { mutableStateOf(ValluvarState.Reading) }
    var face by remember { mutableStateOf<ValluvarFace?>(null) }
    var typing by remember { mutableStateOf(false) }
    var once by remember { mutableStateOf(false) }
    var nod by remember { mutableStateOf(false) }
    var still by remember { mutableStateOf(false) }
    val c = Olai.colors
    Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
        // He jumps and holds things above his head, so leave him headroom inside the scroll's clip.
        Spacer(Modifier.height(28.dp))
        Valluvar(
            state, Modifier.align(Alignment.CenterHorizontally), size = 280.dp,
            face = face ?: state.defaultFace(),
            still = still, once = once, typing = typing, nod = nod, description = "Valluvar, ${state.name.lowercase()}",
        )
        Text("State", style = MaterialTheme.typography.labelLarge, color = c.ink2)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ValluvarState.entries.forEach { s -> FilterChip(state == s, { state = s; face = null; nod = false }, { Text(s.name) }) }
        }
        Spacer(Modifier.height(8.dp))
        Text("Face", style = MaterialTheme.typography.labelLarge, color = c.ink2)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(face == null, { face = null }, { Text("Default") })
            ValluvarFace.entries.forEach { f -> FilterChip(face == f, { face = f }, { Text(f.name) }) }
        }
        Spacer(Modifier.height(8.dp))
        Text("Moments", style = MaterialTheme.typography.labelLarge, color = c.ink2)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(typing, { typing = !typing }, { Text("Typing") })
            FilterChip(once, { once = !once }, { Text("Celebrate once") })
            FilterChip(nod, { nod = !nod }, { Text("Nod") })
            FilterChip(still, { still = !still }, { Text("Still") })
        }
        Spacer(Modifier.height(16.dp))
        Text("All eleven at small size", style = MaterialTheme.typography.labelLarge, color = c.ink2)
        Row(Modifier.horizontalScroll(rememberScrollState()).padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            ValluvarState.entries.forEach { s -> Valluvar(s, size = 96.dp) }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun TypeBench() {
    val c = Olai.colors
    val t = MaterialTheme.typography
    Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Good morning", style = t.displaySmall, color = c.ink)
        Text("காலை வணக்கம்", style = t.displaySmall.copy(fontFamily = KuralFonts.SerifTamil, fontSize = 27.sp), color = c.ink)
        Text("Today's couplet", style = t.headlineSmall, color = c.ink)
        Text("இன்றைய குறள்", style = t.headlineSmall.copy(fontFamily = KuralFonts.SerifTamil, fontSize = 21.sp), color = c.ink)
        Text("Write what this couplet stirs in you", style = t.titleMedium, color = c.ink)
        Text(
            "Anek Tamil carries the interface in both scripts, so English and Tamil sit on the same line at the same weight. எழுத்தும் சொல்லும் ஒரே எடையில்.",
            style = t.bodyLarge, color = c.ink2,
        )
        for (w in listOf(400, 500, 600, 700)) {
            Text("Anek Tamil $w  ·  அனெக் தமிழ்", style = t.bodyLarge.copy(fontWeight = FontWeight(w)), color = c.ink)
        }
        Text("Literata italic, for Pope's English", style = t.bodyLarge.copy(fontFamily = KuralFonts.Serif, fontStyle = FontStyle.Italic), color = c.ink)
        Text("Numerals ௧ ௨ ௩ ௰ ௱ · 1 2 3 10 100", style = t.bodyLarge.copy(fontFamily = KuralFonts.SerifTamil), color = c.ink)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {}) { Text("Write") }
            OutlinedButton(onClick = {}) { Text("Word by word") }
        }
        Text(
            "Check this page at Settings › Display › Font size at its largest. Nothing should clip; couplet lines shrink, then wrap between words.",
            style = t.labelMedium, color = c.ink3,
        )
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun BackupBench() {
    val context = LocalContext.current
    val probe = remember { FolderBackupProbe(context) }
    var folder by remember { mutableStateOf(probe.savedFolder) }
    var report by remember { mutableStateOf<String?>(null) }
    val c = Olai.colors
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri: Uri? ->
        if (uri != null) {
            probe.remember(uri)
            folder = uri
            report = probe.writeAndReadBack(uri).fold({ it }, { "Failed: ${it.message}" })
        }
    }
    Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Folder backup test", style = MaterialTheme.typography.headlineSmall, color = c.ink)
        Text(
            "Pick any folder, including one in Google Drive. Kural Heart writes a small file there and reads it back. " +
                "The app has no internet permission; the folder's own app does any syncing.",
            style = MaterialTheme.typography.bodyMedium, color = c.ink2,
        )
        Button(onClick = { pick.launch(null) }) { Text(if (folder == null) "Pick a folder" else "Pick another folder") }
        folder?.let { f ->
            val ok = probe.stillPermitted(f)
            Text(
                if (ok) "Access kept after restart: yes" else "Access kept after restart: no, pick the folder again",
                style = MaterialTheme.typography.labelLarge, color = if (ok) c.aram else c.heart,
            )
            OutlinedButton(onClick = { report = probe.writeAndReadBack(f).fold({ it }, { "Failed: ${it.message}" }) }) {
                Text("Write again")
            }
        }
        report?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = c.ink) }
    }
}
