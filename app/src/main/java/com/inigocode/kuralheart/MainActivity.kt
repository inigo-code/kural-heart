package com.inigocode.kuralheart

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.inigocode.kuralheart.workbench.Workbench

/**
 * Milestone 0: the workbench that proves the foundations (type, the leaf, Valluvar, folder backup)
 * before any product screen is built on them.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // "tab" picks the opening bench, for screenshots and timing: adb shell am start -n ... --es tab Valluvar
        val start = intent.getStringExtra("tab")
        setContent { Workbench(start) }
    }
}
