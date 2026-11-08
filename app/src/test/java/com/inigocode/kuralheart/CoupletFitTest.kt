package com.inigocode.kuralheart

import com.inigocode.kuralheart.ui.leaf.CoupletFit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CoupletFitTest {
    // A line whose width grows linearly with size: 20 px per sp.
    private val widest = { sp: Float -> sp * 20f }

    @Test fun keepsTheLargestSizeWhenItFits() = assertEquals(21f, CoupletFit.fit(1000f, 21f, 14f, widest))

    @Test fun shrinksUntilTheLongerLineFits() {
        val s = CoupletFit.fit(350f, 21f, 14f, widest)
        assertTrue("fits", widest(s) <= 350f)
        assertTrue("not needlessly small", widest(s + 0.25f) > 350f)
    }

    @Test fun stopsAtTheSmallestSize() = assertEquals(14f, CoupletFit.fit(100f, 21f, 14f, widest))
}
