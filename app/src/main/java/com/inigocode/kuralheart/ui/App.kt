package com.inigocode.kuralheart.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inigocode.kuralheart.Graph
import com.inigocode.kuralheart.MainActivity
import com.inigocode.kuralheart.data.Entry
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Period
import com.inigocode.kuralheart.data.Seal
import com.inigocode.kuralheart.data.Streak
import com.inigocode.kuralheart.data.ThemeMode
import com.inigocode.kuralheart.system.TodayWidget
import com.inigocode.kuralheart.ui.theme.KuralHeartTheme
import com.inigocode.kuralheart.ui.theme.Olai
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.inigocode.kuralheart.data.Updates
import com.inigocode.kuralheart.data.WhatsNew
import java.time.LocalTime

enum class Tab { Today, Kural, Journal, Journey, Settings }

/** Pages pushed over the tabs. */
sealed interface Route {
    data class Write(val kural: Int, val entryId: String? = null) : Route
    data class Page(val id: String) : Route
    data class Share(val kural: Int) : Route
    data class Award(val seals: List<Seal>) : Route
    data object Feeling : Route
    data object Backup : Route
    data object About : Route
    data object Sources : Route
    data class Chapter(val n: Int) : Route
    data class KuralView(val n: Int) : Route
    data object Profile : Route
}

/** A string in the lead language. New text is written inline this way; older text lives in [L]. */
@Composable
fun tr(en: String, ta: String): String = if (LocalL.current === Tamil) ta else en

/** Everything a screen needs, passed down once. */
class AppState(val graph: Graph, val activity: MainActivity) {
    var tab by mutableStateOf(Tab.Today)
    val stack = mutableStateListOf<Route>()
    val snackbar = SnackbarHostState()
    var update by mutableStateOf<com.inigocode.kuralheart.data.Updates.Release?>(null)
    var entryFilter by mutableStateOf(EntryFilter())
    val prefs get() = graph.prefs
    val pack get() = graph.pack
    val journal get() = graph.journal

    fun push(r: Route) { stack.add(r) }
    fun pop() { if (stack.isNotEmpty()) stack.removeAt(stack.lastIndex) }
    fun replaceTop(r: Route) { pop(); push(r) }

    fun thread(): Streak.State = Streak.compute(journal.entries.map { it.date }.toSet(), Journal.today())

    /** After a save: record any seals newly met, and say which to celebrate. */
    fun sealsAfterSave(): List<Seal> {
        val have = prefs.seals().keys
        val fresh = Seal.newlyEarned(journal.entries, pack, thread(), have)
        fresh.forEach { prefs.earnSeal(it.name, Journal.today()) }
        return fresh
    }
}

@Composable
fun KuralApp(activity: MainActivity) {
    val graph = remember { Graph.get(activity) }
    val state = remember { AppState(graph, activity) }
    val prefs = graph.prefs
    var period by remember { mutableStateOf(Period.at(LocalTime.now())) }
    LaunchedEffect(Unit) {
        graph.journal.load()
        graph.purgePhotos()
        while (true) {
            kotlinx.coroutines.delay(60_000)
            period = Period.at(LocalTime.now())
        }
    }
    val night = when (prefs.theme) {
        ThemeMode.Ivory -> false
        ThemeMode.Midnight -> true
        ThemeMode.Auto -> period.night
    }
    val l = if (prefs.tamil) Tamil else English
    // Opened from the reminder or widget: go straight to writing today's page.
    LaunchedEffect(activity.writeRequest.intValue) {
        if (activity.writeRequest.intValue > 0 && prefs.onboarded) {
            state.stack.clear(); state.tab = Tab.Today
            state.push(Route.Write(graph.todayKural()))
        }
    }
    // Status and navigation bar icons follow the app's theme, not the phone's.
    androidx.compose.runtime.SideEffect {
        androidx.core.view.WindowCompat.getInsetsController(activity.window, activity.window.decorView).apply {
            isAppearanceLightStatusBars = !night
            isAppearanceLightNavigationBars = !night
        }
    }
    // Look for a new version once a day, if the person allows it (website copies only).
    LaunchedEffect(prefs.updateCheck) {
        if (prefs.updateCheck && Updates.enabled && Journal.now() - prefs.lastUpdateCheck > 20 * 3600_000L) {
            runCatching { Updates.latest() }.getOrNull()?.let { r -> if (Updates.isNewer(r.version)) state.update = r }
            prefs.lastUpdateCheck = Journal.now()
        }
    }
    val base = androidx.compose.ui.platform.LocalDensity.current
    // The person's text size scales every sp in the app, on top of the phone's own setting.
    val scaled = androidx.compose.ui.unit.Density(base.density, base.fontScale * prefs.textScale / 100f)
    KuralHeartTheme(night = night, tamil = prefs.tamil, accent = prefs.accent) {
        CompositionLocalProvider(LocalL provides l, LocalStill provides prefs.reduceMotion, androidx.compose.ui.platform.LocalDensity provides scaled) {
            Box(Modifier.fillMaxSize().background(Olai.colors.bg)) {
                when {
                    !prefs.onboarded -> Onboarding(state)
                    prefs.lockOn && activity.locked.value -> LockScreen(state)
                    else -> {
                        Shell(state, period)
                        if (prefs.whatsNewSeen < WhatsNew.ID) WhatsNewDialog(prefs.tamil) { prefs.whatsNewSeen = WhatsNew.ID }
                    }
                }
            }
        }
    }
}

@Composable
private fun Shell(state: AppState, period: Period) {
    val top = state.stack.lastOrNull()
    BackHandler(enabled = top != null || state.tab != Tab.Today) {
        if (top != null) state.pop() else state.tab = Tab.Today
    }
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f).windowInsetsPadding(WindowInsets.statusBars)) {
                AnimatedContent(state.tab, transitionSpec = { fadeIn(tween(180)) togetherWith fadeOut(tween(120)) }, label = "tab") { tab ->
                    when (tab) {
                        Tab.Today -> TodayScreen(state, period)
                        Tab.Kural -> LibraryScreen(state)
                        Tab.Journal -> JournalScreen(state)
                        Tab.Journey -> JourneyScreen(state)
                        Tab.Settings -> SettingsScreen(state)
                    }
                }
            }
            NavBar(state)
        }
        if (top != null) {
            Box(Modifier.fillMaxSize().background(Olai.colors.bg).windowInsetsPadding(WindowInsets.safeDrawing)) {
                AnimatedContent(top, transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(120)) }, label = "page") { r ->
                    when (r) {
                        is Route.Write -> WriteScreen(state, r)
                        is Route.Page -> PageScreen(state, r.id)
                        is Route.Share -> ShareScreen(state, r.kural)
                        is Route.Award -> AwardScreen(state, r.seals)
                        Route.Feeling -> FeelingScreen(state)
                        Route.Backup -> BackupScreen(state)
                        Route.About -> AboutScreen(state)
                        Route.Sources -> SourcesScreen(state)
                        is Route.Chapter -> ChapterScreen(state, r.n)
                        is Route.KuralView -> KuralScreen(state, r.n)
                        Route.Profile -> ProfileScreen(state)
                    }
                }
            }
        }
        SnackbarHost(state.snackbar, Modifier.align(Alignment.BottomCenter).windowInsetsPadding(WindowInsets.navigationBars).padding(bottom = 88.dp))
    }
}

@Composable
private fun NavBar(state: AppState) {
    val c = Olai.colors
    val l = LocalL.current
    val big = androidx.compose.ui.platform.LocalDensity.current.fontScale >= 1.5f
    Column(Modifier.background(c.bg).windowInsetsPadding(WindowInsets.navigationBars)) {
        HorizontalDivider(color = c.line)
        Row(Modifier.fillMaxWidth().height(if (big) 88.dp else 80.dp)) {
            for ((tab, icon, label) in listOf(
                Triple(Tab.Today, Ico.today, l.today), Triple(Tab.Kural, Ico.book, l.kural), Triple(Tab.Journal, Ico.journal, l.journal),
                Triple(Tab.Journey, Ico.journey, l.journey), Triple(Tab.Settings, Ico.settings, l.settings),
            )) {
                val on = state.tab == tab
                Column(
                    Modifier.weight(1f).fillMaxWidth().clickable(role = Role.Tab) { state.tab = tab; state.stack.clear() }
                        .semantics { selected = on }.padding(top = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Box(
                        Modifier.size(56.dp, 32.dp).clip(RoundedCornerShape(16.dp)).background(if (on) c.primarySoft else androidx.compose.ui.graphics.Color.Transparent),
                        contentAlignment = Alignment.Center,
                    ) { Icon(icon, tint = if (on) c.onSoft else c.ink3) }
                    // At the largest font sizes only the open tab keeps its label (LargeText board).
                    if (!big || on) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            label, maxLines = 1, color = if (on) c.ink else c.ink3,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = if (on) FontWeight.SemiBold else FontWeight.Medium, fontSize = 12.sp),
                        )
                    }
                }
            }
        }
    }
}

/** Save a page, refresh the widget, and celebrate: a seal if one was earned, otherwise a quiet "Saved". */
fun AppState.savePage(entry: Entry, after: () -> Unit) {
    activity.lifecycleScopeLaunch {
        journal.save(entry)
        TodayWidget.refresh(activity)
        val fresh = sealsAfterSave()
        after()
        if (fresh.isNotEmpty()) push(Route.Award(fresh)) else snackbar.showSnackbar(if (prefs.tamil) Tamil.savedMsg else English.savedMsg)
    }
}

/** Delete with undo, as the plan asks: the page comes back if Undo is tapped. */
fun AppState.deletePage(id: String) {
    activity.lifecycleScopeLaunch {
        val gone = journal.delete(id) ?: return@lifecycleScopeLaunch
        TodayWidget.refresh(activity)
        val l = if (prefs.tamil) Tamil else English
        if (snackbar.showSnackbar(l.deleted, l.undo, withDismissAction = false) == SnackbarResult.ActionPerformed) journal.save(gone)
    }
}

/** Work tied to the activity: cancelled if the activity is destroyed. */
fun MainActivity.lifecycleScopeLaunch(block: suspend kotlinx.coroutines.CoroutineScope.() -> Unit) {
    lifecycleScope.launch(block = block)
}

/** "What's new" after each update (Heart Apps rule). */
@Composable
private fun WhatsNewDialog(tamil: Boolean, dismiss: () -> Unit) {
    val c = Olai.colors
    androidx.compose.material3.AlertDialog(
        onDismissRequest = dismiss,
        title = { Text(if (tamil) "புதியவை" else "What's new") },
        text = {
            Column {
                for (line in if (tamil) WhatsNew.ta else WhatsNew.en) {
                    Row(Modifier.padding(vertical = 4.dp)) {
                        Text("•  ", color = c.primary, style = MaterialTheme.typography.bodyMedium)
                        Text(line, style = MaterialTheme.typography.bodyMedium, color = c.ink2)
                    }
                }
            }
        },
        confirmButton = { androidx.compose.material3.TextButton(dismiss) { Text(if (tamil) "சரி" else "Got it", color = c.primary) } },
    )
}
