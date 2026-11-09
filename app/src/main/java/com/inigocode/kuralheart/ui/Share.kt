package com.inigocode.kuralheart.ui

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import com.inigocode.kuralheart.R
import com.inigocode.kuralheart.data.Journal
import com.inigocode.kuralheart.data.Kural
import com.inigocode.kuralheart.data.Pack
import com.inigocode.kuralheart.ui.theme.Olai
import java.io.File

@Composable
fun ShareScreen(state: AppState, kuralN: Int) {
    val l = LocalL.current
    val c = Olai.colors
    val ctx = state.activity
    val pack = state.pack
    val k = pack.kural(kuralN)
    val mine = state.journal.entries.firstOrNull { it.kural == kuralN && it.date == Journal.today() }
    var story by remember { mutableStateOf(false) }
    var addMine by remember { mutableStateOf(false) }
    val line = if (addMine) mine?.text?.lineSequence()?.firstOrNull()?.take(160) else null
    val bmp = remember(kuralN, story, line, state.prefs.tamil) { ShareCard.render(ctx, pack, k, line, story, state.prefs.tamil) }
    Column(Modifier.fillMaxSize()) {
        TopBar(l.shareTitle, onBack = { state.pop() }, close = true)
        Box(Modifier.weight(1f).fillMaxWidth().padding(horizontal = 24.dp), contentAlignment = Alignment.Center) {
            Image(
                bmp.asImageBitmap(), contentDescription = "${k.a} ${k.b}", contentScale = ContentScale.Fit,
                modifier = Modifier.clip(RoundedCornerShape(20.dp)),
            )
        }
        Column(Modifier.padding(horizontal = 20.dp)) {
            Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Choice(l.sharePost, !story, Modifier.weight(1f)) { story = false }
                Choice(l.shareStory, story, Modifier.weight(1f)) { story = true }
            }
            if (mine != null) {
                Row(Modifier.fillMaxWidth().heightIn(min = 60.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(l.shareMine, style = MaterialTheme.typography.bodyLarge, color = c.ink)
                        Text(l.shareMineSub, style = MaterialTheme.typography.labelMedium, color = c.ink3)
                    }
                    Switch(addMine, { addMine = it }, colors = SwitchDefaults.colors(checkedTrackColor = c.primary))
                }
            }
            Spacer(Modifier.height(8.dp))
            PrimaryButton(l.share, icon = Ico.share, modifier = Modifier.padding(bottom = 16.dp)) { ShareCard.send(ctx, bmp, k.n) }
        }
    }
}

/** Draws the share image with plain Android graphics, so it needs no screen and no network. */
object ShareCard {
    fun render(ctx: Context, pack: Pack, k: Kural, mine: String?, story: Boolean, tamil: Boolean): Bitmap {
        val w = 1080
        val h = if (story) 1920 else 1350
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val cv = Canvas(bmp)
        val anek = ResourcesCompat.getFont(ctx, R.font.anek_tamil) ?: Typeface.DEFAULT
        val literataItalic = ResourcesCompat.getFont(ctx, R.font.literata_italic) ?: Typeface.SERIF
        val serifTamil = ResourcesCompat.getFont(ctx, R.font.noto_serif_tamil) ?: Typeface.SERIF

        // Ivory ground, warmer at the foot.
        cv.drawPaint(Paint().apply { shader = LinearGradient(0f, 0f, 0f, h.toFloat(), 0xFFF6F2EA.toInt(), 0xFFEFE4CF.toInt(), Shader.TileMode.CLAMP) })

        val margin = 90f
        val leafTop = if (story) 360f else 150f
        // Couplet lines: shrink together until the longer fits the leaf.
        val couplet = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = anek; fontVariationSettings = "'wght' 560, 'wdth' 75"; color = 0xFF2B1E10.toInt(); textAlign = Paint.Align.CENTER
        }
        var size = 64f
        val inner = w - 2 * margin - 80f
        while (size > 34f) {
            couplet.textSize = size
            if (maxOf(couplet.measureText(k.a), couplet.measureText(k.b)) <= inner) break
            size -= 2f
        }
        val lineH = size * 1.55f
        val leafH = 110f + lineH * 2 + 70f
        val leaf = RectF(margin, leafTop, w - margin, leafTop + leafH)
        cv.drawRoundRect(RectF(leaf).apply { offset(0f, 18f) }, 44f, 44f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x223C280A })
        cv.drawRoundRect(leaf, 44f, 44f, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(0f, leaf.top, 0f, leaf.bottom, 0xFFF3E7C6.toInt(), 0xFFE7D4A2.toInt(), Shader.TileMode.CLAMP)
        })
        val rib = Paint().apply { color = 0x177A5A2E }
        for (f in listOf(0.334f, 0.614f, 0.854f)) cv.drawRect(leaf.left + 6, leaf.top + leafH * f, leaf.right - 6, leaf.top + leafH * f + 3, rib)
        cv.drawRoundRect(leaf, 44f, 44f, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 3f; color = 0x387A5A2E })
        cv.drawCircle(w / 2f, leaf.top + 42f, 13f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFF6F2EA.toInt() })
        cv.drawCircle(w / 2f, leaf.top + 42f, 15f, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 4f; color = 0x487A5A2E })
        val baseY = leaf.top + 110f + size
        cv.drawText(k.a, w / 2f, baseY, couplet)
        cv.drawText(k.b, w / 2f, baseY + lineH, couplet)
        val ch = pack.chapterOf(k)
        val note = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = anek; textSize = 32f; color = 0xFF6A4B22.toInt(); textAlign = Paint.Align.CENTER }
        cv.drawText("${ch.ta} · ${if (tamil) "குறள்" else ch.en} · ${k.n}", w / 2f, leaf.bottom - 36f, note)

        // Aiyar's English, or the person's own line if they chose to add it.
        val quote = mine?.let { "“$it”" } ?: k.en
        val qp = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = if (mine != null && mine.any { it in '஀'..'௿' }) serifTamil else literataItalic
            textSize = if (story) 46f else 42f; color = 0xFF3B2F25.toInt()
        }
        val layout = StaticLayout.Builder.obtain(quote, 0, quote.length, qp, (w - 2 * margin - 40).toInt())
            .setAlignment(Layout.Alignment.ALIGN_CENTER).setLineSpacing(0f, 1.3f).setMaxLines(if (story) 9 else 6)
            .setEllipsize(android.text.TextUtils.TruncateAt.END).build()
        cv.save(); cv.translate(margin + 20, leaf.bottom + 70f); layout.draw(cv); cv.restore()
        if (mine == null) {
            val by = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = anek; textSize = 28f; color = 0xFF6A5A4A.toInt(); textAlign = Paint.Align.CENTER }
            cv.drawText("V. V. S. Aiyar", w / 2f, leaf.bottom + 70f + layout.height + 56f, by)
        }

        // The mark and wordmark at the foot.
        val icon = ResourcesCompat.getDrawable(ctx.resources, R.drawable.splash_icon, null)
        val markSize = 84
        val mx = w / 2 - 150
        val my = h - 170
        cv.save()
        val clip = android.graphics.Path().apply { addRoundRect(RectF(mx.toFloat(), my.toFloat(), (mx + markSize).toFloat(), (my + markSize).toFloat()), 20f, 20f, android.graphics.Path.Direction.CW) }
        cv.clipPath(clip)
        icon?.setBounds(mx - markSize / 4, my - markSize / 4, mx + markSize + markSize / 4, my + markSize + markSize / 4)
        icon?.draw(cv)
        cv.restore()
        val wm = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = ResourcesCompat.getFont(ctx, R.font.literata) ?: Typeface.SERIF; textSize = 44f; color = 0xFF1E1A16.toInt()
        }
        cv.drawText("Kural Heart", (mx + markSize + 24).toFloat(), my + markSize / 2f + 15f, wm)
        return bmp
    }

    fun send(ctx: Context, bmp: Bitmap, n: Int) {
        val dir = File(ctx.cacheDir, "share").apply { mkdirs() }
        val file = File(dir, "kural-$n.png")
        file.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
        val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.share", file)
        val send = Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION).apply { clipData = ClipData.newRawUri(null, uri) }
        ctx.startActivity(Intent.createChooser(send, null))
    }
}
