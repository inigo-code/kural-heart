package com.inigocode.kuralheart

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.fragment.app.FragmentActivity
import com.inigocode.kuralheart.system.TodayWidget
import com.inigocode.kuralheart.ui.KuralApp

/** A FragmentActivity because the app lock uses the system's biometric prompt. */
class MainActivity : FragmentActivity() {
    /** Set when opened from a notification or widget's Write button. Bumped so repeat taps register. */
    val writeRequest = mutableIntStateOf(0)
    /** True while the app lock should show. Set when the app goes to the background with the lock on. */
    val locked = mutableStateOf(true)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        handle(intent)
        setContent { KuralApp(this) }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handle(intent)
    }

    override fun onStart() {
        super.onStart()
        TodayWidget.refresh(this)
    }

    override fun onStop() {
        super.onStop()
        if (!isChangingConfigurations && !pickingFile) locked.value = true
    }

    /** The system file and folder pickers send us to the background; that shouldn't lock the app. */
    var pickingFile = false

    private fun handle(intent: Intent?) {
        if (intent?.getBooleanExtra(EXTRA_WRITE, false) == true) writeRequest.intValue++
    }

    companion object {
        const val EXTRA_WRITE = "write"
    }
}
