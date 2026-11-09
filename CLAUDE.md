# Kural Heart

A private, offline Android journal with Thiruvalluvar. Read `PRODUCT.md` (who it is for, brand rules) and `PLAN.md` (the build plan, milestones, decisions) before changing anything.

## Layout

- `app/`: the Android app, package `com.inigocode.kuralheart`. Kotlin and Jetpack Compose, one module.
  - `Graph.kt`: the few long-lived objects (prefs, journal, backup, pack) and today's couplet.
  - `data/`: `Pack` (loads the couplet pack), `Daily` (daily pick, mood pick, the six times of day), `Prefs`, `Journal` (SQLite, text sealed with a Keystore AES-GCM key), `Crypto`, `Backup` (passphrase-encrypted file in a folder the person picks), `Progress.kt` (the thread, called `Streak` in code, and the nine seals).
  - `system/`: daily reminder and nightly backup alarms, boot receiver, the Today widget (RemoteViews, never shows journal text).
  - `ui/`: `App.kt` (shell, tabs, routes), `Gate.kt` (onboarding, lock), `Today`, `Write`, `JournalScreens`, `Moments` (Journey, seal award, feelings, heavy days), `Share`, `SettingsScreens` (settings, backup, about, sources), `Strings.kt` (English and Tamil text), `Parts.kt` (icons, rows, seal medal).
  - `ui/theme`: Olai tokens (`Ivory`, `Midnight`) and fonts. Colours mirror `docs/canvas/project/olai.css`; change both together.
  - `ui/leaf`: `Leaf` and `CoupletText`. `ui/valluvar`: the renderer; `ValluvarArt.kt` is generated, never edit it.
- `app/src/main/assets/kural/pack.json`: the couplet pack. Built by script, never edited by hand.
- `tools/content/`: `build_pack.py`, the downloaded `sources/`, `questions.json` (draft questions, moods), `choices.json` (the 12 lines chosen by hand), `report.md` (what needs the owner's eye).
- `tools/valluvar/gen_valluvar.py`: regenerates `ValluvarArt.kt` from the canvas.
- `docs/canvas/project/`: the design canvas (https://claude.ai/artifact/3Xg9JoNNjmiztxxaed8Fnz), the design source of truth.
- `dist/`: APKs handed out for testing (ignored by git).

## Commands

Run from this folder (JDK 17, Android SDK in `%LOCALAPPDATA%\Android\Sdk`, set in `local.properties`):

```bash
./gradlew testDebugUnitTest assemblePreview checkReleaseNoInternet
```

```bash
python -I tools/content/build_pack.py
```

```bash
python -I tools/valluvar/gen_valluvar.py
```

Build types: `debug`; `release` (shrunk, unsigned; Play builds are signed with the owner's upload key, which never lives here); `preview` (release, signed with this computer's debug key, for installing on phones).

Emulator: AVD `KuralHeart_API36` (Pixel 7, Android 16). Start it with `-gpu host`; the software renderer (`swiftshader_indirect`) segfaults on this PC. Gboard on the emulator sometimes opens its stylus tutorial and swallows typed text; cancel it.

## Rules

- No network permission, ever. `check<Variant>NoInternet` fails the build if the merged manifest asks for INTERNET or ACCESS_NETWORK_STATE. Do not work around it.
- Kural text comes only from `pack.json`, built by `build_pack.py`. Never type Tamil couplets into code.
- Text fields that take writing use `TextFieldState`, not the String `value`/`onValueChange` form.
- Valluvar: white robes, no religious marks, no halo, hands without fingers.
- Valluvar's motions live in two places: `.tv` rules in `olai.css` and `Motions.kt`. Keep them in step.
- `compileSdk` is 37 because Compose 1.12 needs it. `targetSdk` stays 36 until 37 is tested.
- Commits as `Inigo <270059847+inigo-code@users.noreply.github.com>`, with no Claude co-author line. Commit only when asked.
