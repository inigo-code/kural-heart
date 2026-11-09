package com.inigocode.kuralheart.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.util.Locale
import kotlin.coroutines.resume

/**
 * Where and in what weather a page was written, on request. The position comes from the phone (coarse, about a
 * neighbourhood). The place name comes from Android's geocoder, which asks Google Play services. The weather comes
 * from Open-Meteo, which needs no account and gets only the rounded position.
 */
object Places {
    fun hasPermission(context: Context) =
        ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED

    @SuppressLint("MissingPermission")
    suspend fun here(context: Context): Location? {
        if (!hasPermission(context)) return null
        val lm = context.getSystemService(LocationManager::class.java)
        val providers = listOf(LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER).filter { runCatching { lm.isProviderEnabled(it) }.getOrDefault(false) }
        if (providers.isEmpty()) return null
        if (Build.VERSION.SDK_INT >= 30) {
            val fresh = withTimeoutOrNull(12_000) {
                suspendCancellableCoroutine { cont ->
                    lm.getCurrentLocation(providers.first(), null, ContextCompat.getMainExecutor(context)) { cont.resume(it) }
                }
            }
            if (fresh != null) return fresh
        }
        return providers.mapNotNull { lm.getLastKnownLocation(it) }.maxByOrNull { it.time }
    }

    suspend fun name(context: Context, lat: Double, lon: Double, tamil: Boolean): String? = withContext(Dispatchers.IO) {
        if (!Geocoder.isPresent()) return@withContext null
        val g = Geocoder(context, if (tamil) Locale.forLanguageTag("ta-IN") else Locale.getDefault())
        val list = if (Build.VERSION.SDK_INT >= 33) {
            withTimeoutOrNull(10_000) { suspendCancellableCoroutine { c -> g.getFromLocation(lat, lon, 1) { c.resume(it) } } }
        } else {
            @Suppress("DEPRECATION") runCatching { g.getFromLocation(lat, lon, 1) }.getOrNull()
        }
        val a = list?.firstOrNull() ?: return@withContext null
        listOfNotNull(a.subLocality ?: a.thoroughfare, a.locality ?: a.subAdminArea).distinct().joinToString(", ").ifEmpty { a.adminArea }
    }

    /** Current weather from Open-Meteo, mapped from WMO codes to the app's eight kinds. */
    suspend fun weather(lat: Double, lon: Double): Weather? = runCatching {
        val la = "%.2f".format(Locale.ROOT, lat)
        val lo = "%.2f".format(Locale.ROOT, lon)
        val o = JSONObject(Net.text("https://api.open-meteo.com/v1/forecast?latitude=$la&longitude=$lo&current=temperature_2m,weather_code,wind_speed_10m"))
        val cur = o.getJSONObject("current")
        val code = cur.getInt("weather_code")
        val wind = cur.optDouble("wind_speed_10m", 0.0)
        val kind = when (code) {
            0 -> if (wind > 35) "wind" else "sun"
            1, 2 -> "partly"
            3 -> "cloud"
            45, 48 -> "fog"
            in 51..67, in 80..82 -> "rain"
            in 71..77, 85, 86 -> "snow"
            in 95..99 -> "storm"
            else -> "cloud"
        }
        Weather(kind, cur.getDouble("temperature_2m"))
    }.getOrNull()
}
