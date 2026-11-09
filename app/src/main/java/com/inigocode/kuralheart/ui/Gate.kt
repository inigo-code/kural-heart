package com.inigocode.kuralheart.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.inigocode.kuralheart.MainActivity
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.system.Alarms
import com.inigocode.kuralheart.ui.theme.Olai
import com.inigocode.kuralheart.ui.valluvar.Valluvar
import com.inigocode.kuralheart.ui.valluvar.ValluvarState

/** Valluvar inside the soft arch used on onboarding, lock and empty states. */
@Composable
fun ArchValluvar(state: ValluvarState, size: Dp = 230.dp, typing: Boolean = false, once: Boolean = false, nod: Boolean = false) {
    val c = Olai.colors
    Box(Modifier.size(size + 20.dp, size + 20.dp), contentAlignment = Alignment.BottomCenter) {
        Box(
            Modifier.padding(start = 18.dp, end = 18.dp, top = 18.dp).fillMaxSize()
                .clip(RoundedCornerShape(topStart = 120.dp, topEnd = 120.dp, bottomStart = 20.dp, bottomEnd = 20.dp)).background(c.surface2)
        )
        Valluvar(state, size = size, still = LocalStill.current, typing = typing, once = once, nod = nod)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Onboarding(state: AppState) {
    val prefs = state.prefs
    val l = LocalL.current
    val c = Olai.colors
    var step by remember { mutableIntStateOf(1) }
    val askNotify = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (!granted) prefs.reminderOn = false
        step = 3
    }
    fun finish() {
        prefs.onboarded = true
        prefs.whatsNewSeen = com.inigocode.kuralheart.data.WhatsNew.ID
        if (prefs.startedOn.isEmpty()) prefs.startedOn = Journal.today().toString()
        state.activity.locked.value = false
        Alarms.scheduleAll(state.activity)
    }
    Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
        Row(Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Spacer(Modifier.weight(1f))
            if (step < 3) TextButton(onClick = { step = 3 }) { Text(l.skip, color = c.ink3) }
        }
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            ArchValluvar(
                when (step) { 1 -> ValluvarState.Greeting; 2 -> ValluvarState.Listening; else -> ValluvarState.Writing },
                size = 220.dp,
            )
            Spacer(Modifier.height(20.dp))
            when (step) {
                1 -> {
                    Text("Kural Heart", style = MaterialTheme.typography.displaySmall, color = c.ink)
                    Text(l.tagline, style = MaterialTheme.typography.titleMedium, color = c.primary)
                    Spacer(Modifier.height(12.dp))
                    Text(l.ob1b, style = MaterialTheme.typography.bodyLarge, color = c.ink2, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(20.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Choice(l.leadEnglish, !prefs.tamil, Modifier.weight(1f)) { prefs.tamil = false }
                        Choice(l.leadTamil, prefs.tamil, Modifier.weight(1f)) { prefs.tamil = true }
                    }
                }
                2 -> {
                    Text(l.ob2, style = MaterialTheme.typography.headlineSmall, color = c.ink, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(8.dp))
                    Text(l.ob2b, style = MaterialTheme.typography.bodyLarge, color = c.ink2, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(16.dp))
                    Text(
                        if (prefs.reminderOn) timeLabel(prefs.reminderMinutes) else "—",
                        style = MaterialTheme.typography.displaySmall, color = c.ink,
                    )
                    Spacer(Modifier.height(12.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        for (m in listOf(6 * 60 + 30, 7 * 60, 13 * 60, 20 * 60 + 30, 22 * 60)) {
                            Choice(timeLabel(m), prefs.reminderOn && prefs.reminderMinutes == m) { prefs.reminderOn = true; prefs.reminderMinutes = m }
                        }
                        Choice(if (prefs.tamil) "வேண்டாம்" else "No reminder", !prefs.reminderOn) { prefs.reminderOn = false }
                    }
                }
                else -> {
                    Text(l.ob3, style = MaterialTheme.typography.headlineSmall, color = c.ink, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(16.dp))
                    for ((icon, text) in listOf(Ico.shield to l.p1, Ico.lock to l.p2, Ico.share to l.p3)) {
                        Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            Icon(icon, tint = c.primary)
                            Text(text, style = MaterialTheme.typography.bodyLarge, color = c.ink2)
                        }
                    }
                }
            }
        }
        Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.semantics { contentDescription = "$step / 3" }) {
                for (i in 1..3) Box(Modifier.size(if (i == step) 22.dp else 8.dp, 8.dp).clip(CircleShape).background(if (i == step) c.primary else c.surface3))
            }
            Spacer(Modifier.height(16.dp))
            PrimaryButton(if (step == 3) l.begin else l.next) {
                when (step) {
                    1 -> step = 2
                    2 -> if (prefs.reminderOn && Build.VERSION.SDK_INT >= 33 &&
                        ContextCompat.checkSelfPermission(state.activity, Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED
                    ) askNotify.launch(Manifest.permission.POST_NOTIFICATIONS) else step = 3
                    else -> finish()
                }
            }
        }
    }
}

@Composable
fun Choice(label: String, on: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val c = Olai.colors
    Box(
        modifier.heightIn(min = 48.dp).clip(RoundedCornerShape(24.dp))
            .background(if (on) c.primarySoft else c.surface)
            .border(1.dp, if (on) c.primary else c.line, RoundedCornerShape(24.dp))
            .clickable(role = Role.RadioButton, onClick = onClick).padding(horizontal = 10.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        // One line, never broken inside a word; long labels shrink slightly instead.
        Text(label, style = MaterialTheme.typography.labelLarge, color = if (on) c.onSoft else c.ink, textAlign = TextAlign.Center, maxLines = 1, softWrap = false,
            overflow = androidx.compose.ui.text.style.TextOverflow.Visible)
    }
}

@Composable
fun PrimaryButton(label: String, modifier: Modifier = Modifier, enabled: Boolean = true, tonal: Boolean = false, icon: String? = null, onClick: () -> Unit) {
    val c = Olai.colors
    Button(
        onClick = onClick, enabled = enabled,
        modifier = modifier.fillMaxWidth().heightIn(min = 52.dp),
        shape = RoundedCornerShape(26.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (tonal) c.primarySoft else c.primary, contentColor = if (tonal) c.onSoft else c.onPrimary,
            disabledContainerColor = c.surface3, disabledContentColor = c.ink3,
        ),
    ) {
        icon?.let { Icon(it, tint = if (tonal) c.onSoft else c.onPrimary, size = 20.dp); Spacer(Modifier.width(10.dp)) }
        Text(label, style = MaterialTheme.typography.titleMedium)
    }
}

fun timeLabel(minutes: Int): String {
    val h = minutes / 60
    val m = minutes % 60
    val h12 = if (h % 12 == 0) 12 else h % 12
    return "%d:%02d %s".format(h12, m, if (h < 12) "am" else "pm")
}

/** Whether this phone has a screen lock or biometrics that the app lock can use. */
fun canLock(activity: MainActivity): Boolean =
    BiometricManager.from(activity).canAuthenticate(BIOMETRIC_WEAK or DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS

fun authenticate(activity: MainActivity, title: String, onOk: () -> Unit) {
    val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) = onOk()
    })
    prompt.authenticate(
        BiometricPrompt.PromptInfo.Builder().setTitle(title).setAllowedAuthenticators(BIOMETRIC_WEAK or DEVICE_CREDENTIAL).build()
    )
}

@Composable
fun LockScreen(state: AppState) {
    val l = LocalL.current
    val c = Olai.colors
    val unlock = {
        if (canLock(state.activity)) authenticate(state.activity, "Kural Heart") { state.activity.locked.value = false }
        else state.activity.locked.value = false // the phone's own lock was removed; nothing to check against
    }
    LaunchedEffect(Unit) { unlock() }
    Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(Modifier.weight(1f))
        ArchValluvar(ValluvarState.Resting)
        Spacer(Modifier.height(20.dp))
        Text(l.locked, style = MaterialTheme.typography.displaySmall, color = c.ink, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(l.lockedSub, style = MaterialTheme.typography.bodyLarge, color = c.ink2, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = 300.dp))
        Spacer(Modifier.weight(1f))
        PrimaryButton(l.unlock, icon = Ico.lock, onClick = unlock)
        Spacer(Modifier.height(12.dp))
        Text(l.lockedFoot, style = MaterialTheme.typography.labelMedium, color = c.ink3)
    }
}
