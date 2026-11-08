package com.inigocode.kuralheart

import androidx.compose.ui.geometry.Offset
import com.inigocode.kuralheart.ui.valluvar.Affine
import com.inigocode.kuralheart.ui.valluvar.Key
import com.inigocode.kuralheart.ui.valluvar.Motion
import org.junit.Assert.assertEquals
import org.junit.Test

class MotionsTest {
    private val sway = Motion(listOf(Key(0f), Key(0.5f, rot = 10f), Key(1f)), 1000, "R", Offset(10f, 10f))

    @Test fun restsAtTheEndsAndPeaksInTheMiddle() {
        assertEquals(0f, sway.sample(0f).rot, 1e-4f)
        assertEquals(10f, sway.sample(0.5f).rot, 1e-4f)
        assertEquals(0f, sway.sample(1f).rot, 1e-4f)
    }

    @Test fun loopsForever() = assertEquals(sway.poseAt(250, false).k.rot, sway.poseAt(1250, false).k.rot, 1e-4f)

    @Test fun settlesAfterTwoPlaysWhenAskedOnce() = assertEquals(0f, sway.poseAt(2500, settle = true).k.rot, 1e-4f)

    @Test fun turnsAboutItsOrigin() {
        // A quarter turn about (10, 10) leaves the origin where it is.
        val m = Motion(listOf(Key(0f, rot = 90f), Key(1f, rot = 90f)), 1000, "R", Offset(10f, 10f)).poseAt(0, false).matrix(Offset(10f, 10f))
        assertEquals(10f, m.a * 10f + m.c * 10f + m.e, 1e-3f)
        assertEquals(10f, m.b * 10f + m.d * 10f + m.f, 1e-3f)
    }

    @Test fun composesLikeSvg() {
        val m = Affine.translate(5f, 0f) * Affine.scale(2f, 2f)
        assertEquals(7f, m.a * 1f + m.c * 0f + m.e, 1e-4f) // (1,0) scaled to (2,0), then moved to (7,0)
    }
}
