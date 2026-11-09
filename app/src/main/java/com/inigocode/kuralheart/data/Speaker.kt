package com.inigocode.kuralheart.data

import android.content.Context
import android.content.Intent
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.util.Locale

/**
 * Reads a couplet aloud with the phone's own text-to-speech: the Tamil first, then the English. Tamil needs a Tamil
 * voice on the phone; if there isn't one, [missingTamil] turns true and the app offers Android's voice settings.
 */
class Speaker(context: Context) {
    private val app = context.applicationContext
    private var ready = false
    private var tts: TextToSpeech? = null
    var speaking by mutableIntStateOf(0)
        private set
    var missingTamil by mutableStateOf(false)
        private set

    private fun engine(then: () -> Unit) {
        tts?.let { if (ready) { then(); return } }
        tts = TextToSpeech(app) { status ->
            ready = status == TextToSpeech.SUCCESS
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) = Unit
                override fun onDone(id: String?) { if (id == "last") speaking = 0 }
                @Deprecated("Deprecated in Java") override fun onError(id: String?) { speaking = 0 }
            })
            if (ready) then()
        }
    }

    /** Toggle: reading couplet [n] stops it if it is already being read. */
    fun read(k: Kural, english: String, slow: Boolean = true) {
        if (speaking == k.n) { stop(); return }
        engine {
            val t = tts ?: return@engine
            speaking = k.n
            t.stop()
            t.setSpeechRate(if (slow) 0.85f else 1f)
            val ta = Locale.forLanguageTag("ta-IN")
            val ok = t.isLanguageAvailable(ta) >= TextToSpeech.LANG_AVAILABLE
            missingTamil = !ok
            if (ok) {
                t.language = ta
                t.speak("${k.a}. ${k.b}.", TextToSpeech.QUEUE_ADD, null, "ta")
                t.playSilentUtterance(500, TextToSpeech.QUEUE_ADD, "gap")
            }
            t.language = Locale.UK
            t.speak(english, TextToSpeech.QUEUE_ADD, null, "last")
        }
    }

    fun stop() {
        tts?.stop()
        speaking = 0
    }

    fun voiceSettings(context: Context) {
        context.startActivity(Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    fun shutdown() {
        tts?.shutdown()
        tts = null
        ready = false
    }
}
