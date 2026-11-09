package com.inigocode.kuralheart.system

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.inigocode.kuralheart.Graph
import com.inigocode.kuralheart.MainActivity
import com.inigocode.kuralheart.R
import com.inigocode.kuralheart.data.Period
import java.time.LocalTime

/**
 * Today's couplet on the home screen (4 by 2). It never shows journal text: a home screen is seen by anyone
 * holding the phone. It redraws when the reminder fires, when the app opens, and twice a day.
 */
class TodayWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (id in ids) manager.updateAppWidget(id, views(context))
    }

    companion object {
        fun refresh(context: Context) {
            val m = AppWidgetManager.getInstance(context)
            val ids = m.getAppWidgetIds(ComponentName(context, TodayWidget::class.java))
            if (ids.isNotEmpty()) for (id in ids) m.updateAppWidget(id, views(context))
        }

        private fun views(context: Context): RemoteViews {
            val g = Graph.get(context)
            val k = g.pack.kural(g.todayKural())
            val ch = g.pack.chapterOf(k)
            val period = Period.at(LocalTime.now())
            val ta = g.prefs.tamil
            val open = PendingIntent.getActivity(
                context, 10, Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
                PendingIntent.FLAG_IMMUTABLE,
            )
            val write = PendingIntent.getActivity(
                context, 11, Intent(context, MainActivity::class.java).putExtra(MainActivity.EXTRA_WRITE, true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
                PendingIntent.FLAG_IMMUTABLE,
            )
            return RemoteViews(context.packageName, R.layout.widget_today).apply {
                setTextViewText(R.id.w_period, if (ta) period.ta else "${period.ta} · ${period.en.lowercase()}")
                setTextViewText(R.id.w_ref, "${k.n} · ${if (ta) ch.ta else ch.en}")
                setTextViewText(R.id.w_line1, k.a)
                setTextViewText(R.id.w_line2, k.b)
                setTextViewText(R.id.w_write, if (ta) "இதைப் பற்றி எழுது" else "Write about this")
                setOnClickPendingIntent(R.id.w_leaf, open)
                setOnClickPendingIntent(R.id.w_write, write)
            }
        }
    }
}
