# Kural Heart

A private, offline Android journal with Thiruvalluvar. Read `PRODUCT.md` (who it is for, brand rules) and `PLAN.md` (the build plan, milestones, decisions) before changing anything.

## Layout

- `app/`: the Android app, package `com.inigocode.kuralheart`. Kotlin and Jetpack Compose, one module.
  - `ui/theme`: Olai tokens (`Ivory`, `Midnight`) and fonts. Colours mirror `docs/canvas/project/olai.css`; change both together.
  - `ui/leaf`: `Leaf` (the palm-leaf card, drawn in code) and `CoupletText` (two lines, shrink to fit, wrap only between words).
  - `ui/valluvar`: the Valluvar renderer. `ValluvarArt.kt` is generated; never edit it by hand.
  - `backup`: the folder backup probe (Storage Access Framework, persistable tree URI).
  - `workbench`: milestone 0's test screens. Replaced by the real app shell at milestone 2.
- `app/src/debug/assets/specimen.json`: prototype couplets for the workbench, unverified, debug builds only.
- `docs/canvas/project/`: the design canvas (published at https://claude.ai/artifact/3Xg9JoNNjmiztxxaed8Fnz). It is the design source of truth.
- `tools/valluvar/gen_valluvar.py`: regenerates `ValluvarArt.kt` from `docs/canvas/project/Valluvar.dc.html`.
- `tools/specimen/gen_specimen.py`: regenerates the debug specimen from the canvas prototype.

## Commands

Run from this folder (JDK 17, Android SDK in `%LOCALAPPDATA%\Android\Sdk`, set in `local.properties`):

```bash
./gradlew assembleDebug testDebugUnitTest checkReleaseNoInternet
```

```bash
python -I tools/valluvar/gen_valluvar.py
```

Emulator: AVD `KuralHeart_API36` (Pixel 7, Android 16). Open a bench directly with `adb shell am start -n com.inigocode.kuralheart/.MainActivity --es tab Valluvar` (Leaf, Valluvar, Type, Backup).

## Rules

- No network permission, ever. `check<Variant>NoInternet` fails the build if the merged manifest asks for INTERNET or ACCESS_NETWORK_STATE. Do not work around it.
- Kural text comes only from the verified pack built by script (milestone 1). Never type Tamil couplets into code.
- Valluvar: white robes, no religious marks, no halo, hands without fingers.
- Valluvar's motions live in two places: `.tv` rules in `olai.css` and `Motions.kt`. Keep them in step.
- `compileSdk` is 37 because Compose 1.12 needs it. `targetSdk` stays 36 until 37 is tested.
- Commits as `Inigo <270059847+inigo-code@users.noreply.github.com>`, with no Claude co-author line. Commit only when asked.
