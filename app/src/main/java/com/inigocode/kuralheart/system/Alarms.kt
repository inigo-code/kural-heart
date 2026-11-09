package com.inigocode.kuralheart.system

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.inigocode.kuralheart.Graph
import com.inigocode.kuralheart.MainActivity
import com.inigocode.kuralheart.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

/**
 * The daily reminder and the nightly backup, both on inexact alarms (no exact-alarm permission, no
 * network, no background service). Each alarm sets the next one when it fires; boot restores both.
 */
object Alarms {
    private const val CHANNEL = "daily_couplet"
    private const val ACTION_REMIND = "com.inigocode.kuralheart.REMIND"
    private const val ACTION_BACKUP = "com.inigocode.kuralheart.BACKUP"

    fun scheduleAll(context: Context) {
        val g = Graph.get(context)
        if (g.prefs.reminderOn) scheduleReminder(context, g.prefs.reminderMinutes) else cancel(context, ACTION_REMIND)
        if (g.prefs.backupNightly || g.prefs.driveOn) scheduleBackup(context) else cancel(context, ACTION_BACKUP)
    }

    fun scheduleReminder(context: Context, minutes: Int) =
        set(context, ACTION_REMIND, next(LocalTime.of(minutes / 60, minutes % 60)))

    private fun scheduleBackup(context: Context) = set(context, ACTION_BACKUP, next(LocalTime.of(2, 30)))

    private fun next(at: LocalTime): Long {
        val now = LocalDateTime.now()
        var t = now.toLocalDate().atTime(at)
        if (!t.isAfter(now)) t = t.plusDays(1)
        return t.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    }

    private fun pending(context: Context, action: String) = PendingIntent.getBroadcast(
        context, action.hashCode(), Intent(context, AlarmReceiver::class.java).setAction(action),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    private fun set(context: Context, action: String, at: Long) {
        val am = context.getSystemService(AlarmManager::class.java)
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(context, action))
    }

    fun cancel(context: Context, action: String) {
        context.getSystemService(AlarmManager::class.java).cancel(pending(context, action))
    }

    fun cancelReminder(context: Context) = cancel(context, ACTION_REMIND)

    fun canNotify(context: Context): Boolean =
        (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) &&
            NotificationManagerCompat.from(context).areNotificationsEnabled()

    private fun ensureChannel(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "Daily couplet", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "One gentle reminder a day with the day's kural."
            })
        }
    }

    internal fun showReminder(context: Context) {
        if (!canNotify(context)) return
        ensureChannel(context)
        val g = Graph.get(context)
        val k = g.pack.kural(g.todayKural(LocalDate.now()))
        val ch = g.pack.chapterOf(k)
        val open = PendingIntent.getActivity(
            context, 1, Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val write = PendingIntent.getActivity(
            context, 2, Intent(context, MainActivity::class.java).putExtra(MainActivity.EXTRA_WRITE, true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val title = if (g.prefs.tamil) "இன்றைய குறள் · ${ch.ta}" else "Today's couplet · ${ch.en}"
        // With the app lock on, the notification names the chapter only; the couplet waits inside.
        val body = if (g.prefs.lockOn) (if (g.prefs.tamil) "இன்றைய குறள் காத்திருக்கிறது." else "Today's couplet is waiting.") else "${k.a}\n${k.b}"
        val n = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_kural)
            .setColor(0xFFB4492A.toInt())
            .setContentTitle(title)
            .setContentText(body.lineSequence().first())
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(open)
            .addAction(0, if (g.prefs.tamil) "எழுது" else "Write", write)
            .setAutoCancel(true)
            .build()
        runCatching { NotificationManagerCompat.from(context).notify(1, n) }
    }

    class AlarmReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_REMIND -> {
                    showReminder(context)
                    TodayWidget.refresh(context)
                    val g = Graph.get(context)
                    if (g.prefs.reminderOn) scheduleReminder(context, g.prefs.reminderMinutes)
                }
                ACTION_BACKUP -> {
                    val done = goAsync()
                    CoroutineScope(Dispatchers.IO).launch {
                        val g = Graph.get(context)
                        runCatching { if (!g.journal.loaded) g.journal.load() }
                        if (g.prefs.backupNightly && g.prefs.backupTree.isNotEmpty()) runCatching { g.backup.backupNow() }
                        if (g.prefs.driveOn) g.drive.syncQuietly()
                        if (g.prefs.backupNightly || g.prefs.driveOn) scheduleBackup(context)
                        done.finish()
                    }
                }
                Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED, Intent.ACTION_TIMEZONE_CHANGED -> {
                    scheduleAll(context)
                    TodayWidget.refresh(context)
                }
            }
        }
    }
}
