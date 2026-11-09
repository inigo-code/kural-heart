package com.inigocode.kuralheart.ui

import android.app.TimePickerDialog
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.inigocode.kuralheart.data.Crypto
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.ThemeMode
import com.inigocode.kuralheart.system.Alarms
import com.inigocode.kuralheart.system.TodayWidget
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
private fun Toggle(on: Boolean, onChange: (Boolean) -> Unit) {
    val c = Olai.colors
    Switch(on, onChange, colors = SwitchDefaults.colors(checkedTrackColor = c.primary, checkedThumbColor = c.onPrimary))
}

@Composable
fun SettingsScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val p = state.prefs
    val ctx = state.activity
    var wipe by remember { mutableStateOf(false) }
    var lockMissing by remember { mutableStateOf(false) }
    val exportText = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/plain")) { uri: Uri? ->
        ctx.pickingFile = false
        if (uri != null) ctx.lifecycleScopeLaunch { state.graph.backup.exportText(uri, state.pack) }
    }
    val askNotify = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        p.reminderOn = ok
        if (ok) Alarms.scheduleReminder(ctx, p.reminderMinutes)
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
        Spacer(Modifier.height(12.dp))
        Text(l.settings, style = MaterialTheme.typography.displaySmall, color = c.ink, modifier = Modifier.padding(start = 4.dp))

        SectionLabel(l.sLook)
        Group {
            GroupRow(l.sLang, divider = false) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Choice("EN", !p.tamil) { p.tamil = false; TodayWidget.refresh(ctx) }
                    Choice("தமிழ்", p.tamil) { p.tamil = true; TodayWidget.refresh(ctx) }
                }
            }
            GroupRow(l.sTheme, sub = when (p.theme) { ThemeMode.Auto -> l.themeAuto; ThemeMode.Ivory -> l.themeIvory; ThemeMode.Midnight -> l.themeMidnight }, onClick = {
                p.theme = ThemeMode.entries[(p.theme.ordinal + 1) % ThemeMode.entries.size]
            })
            GroupRow(l.sMotion, trailing = { Toggle(p.reduceMotion) { p.reduceMotion = it } })
        }

        SectionLabel(l.sDaily)
        Group {
            GroupRow(l.sRem, divider = false, trailing = {
                Toggle(p.reminderOn) { on ->
                    if (on && !Alarms.canNotify(ctx) && android.os.Build.VERSION.SDK_INT >= 33) askNotify.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                    else { p.reminderOn = on; if (on) Alarms.scheduleReminder(ctx, p.reminderMinutes) else Alarms.cancelReminder(ctx) }
                }
            })
            if (p.reminderOn) GroupRow(l.sRemTime, sub = timeLabel(p.reminderMinutes), onClick = {
                TimePickerDialog(ctx, { _, h, m -> p.reminderMinutes = h * 60 + m; Alarms.scheduleReminder(ctx, p.reminderMinutes) },
                    p.reminderMinutes / 60, p.reminderMinutes % 60, false).show()
            })
        }
        if (p.reminderOn && !Alarms.canNotify(ctx)) {
            // Reminders on in the app but refused by Android: say so plainly and offer the way back.
            Spacer(Modifier.height(12.dp))
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(c.surface).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Valluvar(ValluvarState.Listening, size = 120.dp, still = LocalStill.current)
                Text(l.remOffTitle, style = MaterialTheme.typography.headlineSmall, color = c.ink, textAlign = TextAlign.Center)
                Text(l.remOffBody, style = MaterialTheme.typography.bodyMedium, color = c.ink2, textAlign = TextAlign.Center)
                PrimaryButton(l.remOffOpen, modifier = Modifier.padding(top = 12.dp)) {
                    ctx.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName))
                }
                TextButton({ p.reminderOn = false; Alarms.cancelReminder(ctx) }) { Text(l.remOffKeep, color = c.primary) }
            }
        }

        SectionLabel(l.sPrivate)
        Group {
            GroupRow(l.sLock, sub = l.sLockSub, divider = false, trailing = {
                Toggle(p.lockOn) { on ->
                    if (on && !canLock(ctx)) lockMissing = true
                    else if (on) authenticate(ctx, l.sLock) { p.lockOn = true; ctx.locked.value = false }
                    else p.lockOn = false
                }
            })
            GroupRow(l.sBackup, sub = if (state.graph.backup.hasPassphrase && p.backupTree.isNotEmpty()) lastBackupLabel(p.lastBackup, l) else l.notSet, onClick = { state.push(Route.Backup) })
            GroupRow(l.sText, sub = l.sTextSub, onClick = { ctx.pickingFile = true; exportText.launch("Kural Heart pages.txt") })
            GroupRow(l.sWipe, titleColor = c.heart, onClick = { wipe = true })
        }

        SectionLabel(l.sAbout)
        Group {
            GroupRow(l.sAbout, divider = false, onClick = { state.push(Route.About) })
            GroupRow(l.sSources, onClick = { state.push(Route.Sources) })
        }
        Spacer(Modifier.height(28.dp))
    }
    if (lockMissing) {
        AlertDialog(
            onDismissRequest = { lockMissing = false },
            title = { Text(l.sLock) },
            text = { Text(if (p.tamil) "முதலில் அலைபேசியின் அமைப்புகளில் திரைப் பூட்டை அமைக்கவும்." else "Set a screen lock in your phone’s settings first. The app lock uses it.") },
            confirmButton = { TextButton({ lockMissing = false }) { Text(l.close) } },
        )
    }
    if (wipe) WipeDialog(state) { wipe = false }
}

fun lastBackupLabel(at: Long, l: L): String =
    if (at == 0L) l.backupNever
    else l.backupLast(Instant.ofEpochMilli(at).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("d MMM, h:mm a")))

@Composable
private fun WipeDialog(state: AppState, dismiss: () -> Unit) {
    val l = LocalL.current
    val c = Olai.colors
    var typed by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = dismiss,
        icon = { Icon(Ico.trash, tint = c.heart) },
        title = { Text(l.wipeTitle, textAlign = TextAlign.Center) },
        text = {
            Column {
                Text(l.wipeBody(state.journal.entries.size))
                Spacer(Modifier.height(12.dp))
                Text(l.wipeType, style = MaterialTheme.typography.labelLarge, color = c.primary)
                Field(typed, { typed = it }, l.wipeWord)
            }
        },
        confirmButton = {
            TextButton(enabled = typed.trim() == l.wipeWord, onClick = {
                state.activity.lifecycleScopeLaunch {
                    state.journal.deleteAll()
                    state.graph.backup.forget()
                    Alarms.cancelReminder(state.activity)
                    Crypto.deleteDeviceKey()
                    state.prefs.wipe()
                    TodayWidget.refresh(state.activity)
                    state.stack.clear(); state.tab = Tab.Today
                }
                dismiss()
            }) { Text(l.wipeConfirm, color = if (typed.trim() == l.wipeWord) c.heart else c.ink3) }
        },
        dismissButton = { TextButton(dismiss) { Text(l.cancel) } },
    )
}

@Composable
fun Field(value: String, onChange: (String) -> Unit, placeholder: String, secret: Boolean = false, modifier: Modifier = Modifier) {
    val c = Olai.colors
    Box(
        modifier.fillMaxWidth().heightIn(min = 56.dp).clip(RoundedCornerShape(16.dp)).background(c.surface)
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        if (value.isEmpty()) Text(placeholder, style = MaterialTheme.typography.bodyLarge, color = c.ink3)
        BasicTextField(
            value, onChange, singleLine = true, cursorBrush = SolidColor(c.primary),
            textStyle = MaterialTheme.typography.bodyLarge.copy(color = c.ink),
            visualTransformation = if (secret) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = if (secret) KeyboardType.Password else KeyboardType.Text, autoCorrectEnabled = !secret),
            modifier = Modifier.fillMaxWidth().semantics { contentDescription = placeholder },
        )
    }
}

@Composable
fun BackupScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val p = state.prefs
    val ctx = state.activity
    val backup = state.graph.backup
    var hasPass by remember { mutableStateOf(backup.hasPassphrase) }
    var pass by remember { mutableStateOf("") }
    var again by remember { mutableStateOf("") }
    var wrote by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var restoreUri by remember { mutableStateOf<Uri?>(null) }
    var restorePass by remember { mutableStateOf("") }
    val pickFolder = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        ctx.pickingFile = false
        if (uri != null) {
            ctx.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            p.backupTree = uri.toString()
        }
    }
    val pickFile = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        ctx.pickingFile = false
        restoreUri = uri
    }
    fun run(label: String, block: suspend () -> String) {
        busy = label; message = null
        ctx.lifecycleScopeLaunch {
            message = runCatching { block() }.getOrElse { it.message ?: "Something went wrong." }
            busy = null
        }
    }
    Column(Modifier.fillMaxSize()) {
        TopBar(l.backupTitle, onBack = { state.pop() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(l.backupLede, style = MaterialTheme.typography.bodyLarge, color = c.ink2, modifier = Modifier.weight(1f))
                Valluvar(if (busy != null) ValluvarState.Walking else ValluvarState.Presenting, size = 110.dp, still = LocalStill.current)
            }
            if (busy != null) {
                Spacer(Modifier.height(8.dp))
                Text(busy!!, style = MaterialTheme.typography.headlineSmall, color = c.ink)
                LinearProgressIndicator(Modifier.fillMaxWidth().padding(vertical = 10.dp), color = c.primary, trackColor = c.surface3)
            }
            message?.let { Note(it, icon = Ico.shield) }

            SectionLabel(l.backupWhere)
            Group {
                val folder = p.backupTree.takeIf { it.isNotEmpty() }?.let { Uri.parse(it).lastPathSegment?.substringAfterLast(':') }
                GroupRow(folder ?: l.backupFolder, sub = l.backupFolderSub, divider = false, onClick = { ctx.pickingFile = true; pickFolder.launch(null) })
                if (hasPass && p.backupTree.isNotEmpty()) {
                    GroupRow(l.backupNightly, sub = lastBackupLabel(p.lastBackup, l), trailing = {
                        Toggle(p.backupNightly) { p.backupNightly = it; Alarms.scheduleAll(ctx) }
                    })
                }
            }
            Spacer(Modifier.height(12.dp))
            Note(l.backupPromise)

            if (!hasPass) {
                SectionLabel(l.passTitle)
                Text(l.passLede, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
                Spacer(Modifier.height(12.dp))
                Field(pass, { pass = it }, l.passLabel, secret = true)
                Spacer(Modifier.height(10.dp))
                Field(again, { again = it }, l.passAgain, secret = true)
                val problem = when {
                    pass.isNotEmpty() && pass.length < 10 -> l.passShort
                    again.isNotEmpty() && again != pass -> l.passMismatch
                    else -> null
                }
                problem?.let { Text(it, style = MaterialTheme.typography.labelMedium, color = c.heart, modifier = Modifier.padding(4.dp)) }
                Spacer(Modifier.height(10.dp))
                Note(l.passTip, icon = Ico.bulb, iconTint = c.primary)
                Row(Modifier.fillMaxWidth().clickable { wrote = !wrote }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(wrote, { wrote = it }, colors = CheckboxDefaults.colors(checkedColor = c.primary))
                    Text(l.passWritten, style = MaterialTheme.typography.bodyMedium, color = c.ink)
                }
                PrimaryButton(l.passTurnOn, enabled = pass.length >= 10 && pass == again && wrote) {
                    run(l.passTurnOn) {
                        backup.setPassphrase(pass.toCharArray()); pass = ""; again = ""; hasPass = true
                        if (p.backupTree.isNotEmpty()) { backup.backupNow(); l.backupDone } else l.backupFolder
                    }
                }
            } else if (p.backupTree.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                PrimaryButton(l.backupNow, enabled = busy == null) { run(l.backupNow) { backup.backupNow(); l.backupDone } }
            }

            SectionLabel(l.restore)
            Text(l.restoreSub, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
            Spacer(Modifier.height(10.dp))
            PrimaryButton(l.restore, tonal = true, enabled = busy == null) { ctx.pickingFile = true; pickFile.launch(arrayOf("*/*")) }
            Spacer(Modifier.height(28.dp))
        }
    }
    restoreUri?.let { uri ->
        AlertDialog(
            onDismissRequest = { restoreUri = null; restorePass = "" },
            title = { Text(l.restore) },
            text = { Field(restorePass, { restorePass = it }, l.passForRestore, secret = true) },
            confirmButton = {
                TextButton(enabled = restorePass.isNotEmpty(), onClick = {
                    val chars = restorePass.toCharArray()
                    restoreUri = null; restorePass = ""
                    run(l.restoring) {
                        val r = backup.restore(uri, chars)
                        chars.fill(' ')
                        TodayWidget.refresh(ctx)
                        state.sealsAfterSave()
                        l.restored(r.added, r.keptBoth)
                    }
                }) { Text(l.open) }
            },
            dismissButton = { TextButton({ restoreUri = null; restorePass = "" }) { Text(l.cancel) } },
        )
    }
}

@Composable
fun AboutScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    Column(Modifier.fillMaxSize()) {
        TopBar(l.sAbout, onBack = { state.pop() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                androidx.compose.foundation.Image(
                    androidx.compose.ui.res.painterResource(com.inigocode.kuralheart.R.drawable.ic_launcher_foreground), null,
                    Modifier.size(88.dp).clip(RoundedCornerShape(22.dp)).background(
                        androidx.compose.ui.graphics.Brush.verticalGradient(listOf(androidx.compose.ui.graphics.Color(0xFFFFD08A), androidx.compose.ui.graphics.Color(0xFFE5693F)))
                    ),
                )
                Spacer(Modifier.width(16.dp))
                Column {
                    Text("Kural Heart", style = MaterialTheme.typography.headlineSmall, color = c.ink)
                    Text("Version ${versionName(state)} · made by Inigo", style = MaterialTheme.typography.labelMedium, color = c.ink3)
                }
            }
            Spacer(Modifier.height(16.dp))
            Text(l.aboutLede, style = MaterialTheme.typography.bodyLarge, color = c.ink2)
            SectionLabel(l.heartApps)
            Group {
                GroupRow("Prompt Heart", sub = "Notes for your prompts · Android", divider = false)
                GroupRow("Watch Heart", sub = "A diary for films and anime · Android")
                GroupRow("Frame Heart, Still Heart, Rush Heart", sub = "Picture and media tools · Windows")
                GroupRow("inigo-code.github.io", titleColor = c.primary, onClick = {
                    state.activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://inigo-code.github.io")))
                })
            }
            Spacer(Modifier.height(12.dp))
            Group { GroupRow(l.sSources, divider = false, onClick = { state.replaceTop(Route.Sources) }) }
            Spacer(Modifier.height(28.dp))
        }
    }
}

private fun versionName(state: AppState): String =
    runCatching { state.activity.packageManager.getPackageInfo(state.activity.packageName, 0).versionName }.getOrNull() ?: ""

@Composable
fun SourcesScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val tamil = state.prefs.tamil
    @Composable
    fun Item(title: String, body: String, tag: String? = null, ok: Boolean = false, first: Boolean = false) {
        Column {
            if (!first) androidx.compose.material3.HorizontalDivider(color = c.line)
            Column(Modifier.padding(16.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = c.ink)
                Text(body, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
                tag?.let {
                    Spacer(Modifier.height(6.dp))
                    Text(it, style = MaterialTheme.typography.labelMedium, color = if (ok) c.aram else c.onSoft,
                        modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(if (ok) c.aramSoft else c.primarySoft).padding(horizontal = 8.dp, vertical = 2.dp))
                }
            }
        }
    }
    Column(Modifier.fillMaxSize()) {
        TopBar(l.sSources, onBack = { state.pop() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Text(l.sourcesLede, style = MaterialTheme.typography.bodyLarge, color = c.ink2)
            Spacer(Modifier.height(16.dp))
            Group {
                Item(
                    if (tamil) "தமிழ்க் குறள்கள்" else "The couplets in Tamil",
                    "Project Madurai’s Thirukkural e-text (no. 0001), checked line by line against its e-text 0017 and a third copy. " +
                        "1,306 couplets agree, 12 were settled by vote, and 12 lines were chosen by hand.",
                    l.reviewPending, first = true,
                )
                Item(if (tamil) "ஆங்கில மொழிபெயர்ப்பு" else "English", "V. V. S. Aiyar, 1916, from Standard Ebooks.", l.publicDomain, ok = true)
                Item(
                    if (tamil) "கேள்விகள்" else "Questions",
                    "Written for Kural Heart in English and Tamil. ${l.draftNote}", l.reviewPending,
                )
                Item("Type", "Anek Tamil, Noto Serif Tamil and Literata, under the SIL Open Font License.")
                Item("Valluvar", "Drawn for Kural Heart. White robes, no marks: a teacher for everyone.")
            }
            Spacer(Modifier.height(12.dp))
            TextButton({
                state.activity.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:")).putExtra(Intent.EXTRA_SUBJECT, "Kural Heart: a mistake in a couplet"))
            }) { Text(l.reportMistake, color = c.primary) }
            Spacer(Modifier.height(28.dp))
        }
    }
}

