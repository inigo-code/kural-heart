package com.inigocode.kuralheart

import android.app.Application
import com.inigocode.kuralheart.system.Alarms

class KuralHeartApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Alarms.scheduleAll(this)
    }
}
