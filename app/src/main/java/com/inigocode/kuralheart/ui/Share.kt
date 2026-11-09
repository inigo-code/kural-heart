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
import com.inigocode.kuralheart.ui.valluvar.ValluvarState
import com.inigocode.kuralheart.ui.valluvar.valluvarBitmap
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
    val bmp = remember(kuralN, story, line, state.prefs.tamil) { ShareCard.render(ctx, pack, k, line, story, state.prefs.tamil, state.prefs.translation) }
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

/**
 * Draws the share image with plain Android graphics, so it needs no screen and no network.
 * Story (9:16): a dawn sky over ivory, Valluvar reading, then the leaf. Post (4:5): the leaf first, Valluvar below.
 * Couplets are always flush left.
 */
object ShareCard {
    private const val INK = 0xFF1E1A16.toInt()
    private const val LEAF_INK = 0xFF2B1E10.toInt()
    private const val NOTE = 0xFF6A4B22.toInt()

    fun render(ctx: Context, pack: Pack, k: Kural, mine: String?, story: Boolean, tamil: Boolean, translation: String = "aiyar"): Bitmap {
        val w = 1080
        val h = if (story) 1920 else 1350
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val cv = Canvas(bmp)
        val anek = ResourcesCompat.getFont(ctx, R.font.anek_tamil) ?: Typeface.DEFAULT
        val literata = ResourcesCompat.getFont(ctx, R.font.literata) ?: Typeface.SERIF
        val literataItalic = ResourcesCompat.getFont(ctx, R.font.literata_italic) ?: Typeface.SERIF
        val serifTamil = ResourcesCompat.getFont(ctx, R.font.noto_serif_tamil) ?: Typeface.SERIF
        val ch = pack.chapterOf(k)
        val margin = 96f

        // Ground: a dawn sky fading into ivory for stories, plain warm ivory for posts.
        val ground = if (story) {
            LinearGradient(0f, 0f, 0f, h.toFloat(), intArrayOf(0xFFFFD08A.toInt(), 0xFFF5B98A.toInt(), 0xFFF6F2EA.toInt(), 0xFFEFE4CF.toInt()), floatArrayOf(0f, 0.22f, 0.48f, 1f), Shader.TileMode.CLAMP)
        } else {
            LinearGradient(0f, 0f, 0f, h.toFloat(), 0xFFF6F2EA.toInt(), 0xFFEFE4CF.toInt(), Shader.TileMode.CLAMP)
        }
        cv.drawPaint(Paint().apply { shader = ground })

        val label = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = serifTamil; textSize = 38f; color = if (story) 0xFF5A2A12.toInt() else NOTE }
        var y: Float
        if (story) {
            cv.drawText("திருக்குறள் · ${if (tamil) "குறள்" else "Kural"} ${k.n}", margin, 150f, label)
            // Valluvar reading, with a soft arch behind him.
            val vw = 600
            val vx = (w - vw) / 2f
            val arch = RectF(vx + 30, 230f, vx + vw - 30, 230f + vw * 220f / 240f + 20)
            cv.drawRoundRect(arch, 300f, 300f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x33FFFFFF })
            cv.drawBitmap(valluvarBitmap(ValluvarState.Reading, vw), vx, 210f, null)
            y = 230f + vw * 220f / 240f + 70
        } else {
            cv.drawText("திருக்குறள் · ${if (tamil) "குறள்" else "Kural"} ${k.n}", margin, 140f, label)
            y = 200f
        }

        // The leaf, couplet flush left; both lines shrink together until the longer fits.
        val couplet = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = anek; fontVariationSettings = "'wght' 560, 'wdth' 75"; color = LEAF_INK }
        val inner = w - 2 * margin - 100f
        var size = 68f
        while (size > 36f) {
            couplet.textSize = size
            if (maxOf(couplet.measureText(k.a), couplet.measureText(k.b)) <= inner) break
            size -= 2f
        }
        val lineH = size * 1.5f
        val leafH = 100f + lineH * 2 + 80f
        val leaf = RectF(margin, y, w - margin, y + leafH)
        cv.drawRoundRect(RectF(leaf).apply { offset(0f, 18f) }, 44f, 44f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x223C280A })
        cv.drawRoundRect(leaf, 44f, 44f, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(0f, leaf.top, 0f, leaf.bottom, 0xFFF3E7C6.toInt(), 0xFFE7D4A2.toInt(), Shader.TileMode.CLAMP)
        })
        val rib = Paint().apply { color = 0x177A5A2E }
        for (f in listOf(0.334f, 0.614f, 0.854f)) cv.drawRect(leaf.left + 6, leaf.top + leafH * f, leaf.right - 6, leaf.top + leafH * f + 3, rib)
        cv.drawRoundRect(leaf, 44f, 44f, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 3f; color = 0x387A5A2E })
        cv.drawCircle(w / 2f, leaf.top + 40f, 13f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFF6F2EA.toInt() })
        cv.drawCircle(w / 2f, leaf.top + 40f, 15f, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 4f; color = 0x487A5A2E })
        val textX = leaf.left + 50f
        val baseY = leaf.top + 100f + size
        cv.drawText(k.a, textX, baseY, couplet)
        cv.drawText(k.b, textX, baseY + lineH, couplet)
        val note = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = anek; textSize = 32f; color = NOTE }
        cv.drawText("அதிகாரம் ${ch.n} · ${ch.ta} · ${ch.en}", textX, leaf.bottom - 40f, note)
        y = leaf.bottom + 70f

        // The English chosen in Settings, or the person's own line if they added it.
        val english = mine?.let { "“$it”" } ?: translationOf(k, translation)
        val qp = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = if (mine != null && mine.any { it in '\u0B80'..'\u0BFF' }) serifTamil else literataItalic
            textSize = if (story) 46f else 42f; color = 0xFF3B2F25.toInt()
        }
        val layout = StaticLayout.Builder.obtain(english, 0, english.length, qp, (w - 2 * margin).toInt())
            .setAlignment(Layout.Alignment.ALIGN_NORMAL).setLineSpacing(0f, 1.3f).setMaxLines(if (story) 8 else 5)
            .setEllipsize(android.text.TextUtils.TruncateAt.END).build()
        cv.save(); cv.translate(margin, y); layout.draw(cv); cv.restore()
        y += layout.height + 40f
        if (mine == null) {
            val by = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = anek; textSize = 30f; color = 0xFF6A5A4A.toInt() }
            cv.drawText("— ${translator(translation)}", margin, y, by)
        }

        // Post: a smaller Valluvar sits at the foot, beside the wordmark.
        if (!story) {
            val vw = 330
            cv.drawBitmap(valluvarBitmap(ValluvarState.Reading, vw), w - margin - vw + 30, h - 330f, null)
        }

        // The mark and wordmark at the foot.
        val icon = ResourcesCompat.getDrawable(ctx.resources, R.drawable.splash_icon, null)
        val markSize = 84
        val mx = margin.toInt()
        val my = h - 170
        cv.save()
        val clip = android.graphics.Path().apply { addRoundRect(RectF(mx.toFloat(), my.toFloat(), (mx + markSize).toFloat(), (my + markSize).toFloat()), 20f, 20f, android.graphics.Path.Direction.CW) }
        cv.clipPath(clip)
        icon?.setBounds(mx - markSize / 4, my - markSize / 4, mx + markSize + markSize / 4, my + markSize + markSize / 4)
        icon?.draw(cv)
        cv.restore()
        val wm = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = literata; textSize = 44f; color = INK }
        cv.drawText("Kural Heart", (mx + markSize + 24).toFloat(), my + markSize / 2f + 2f, wm)
        val sub = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = anek; textSize = 28f; color = 0xFF6A5A4A.toInt() }
        cv.drawText("குறளுடன் நாட்குறிப்பு", (mx + markSize + 24).toFloat(), my + markSize / 2f + 42f, sub)
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
