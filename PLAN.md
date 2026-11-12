# Kural Heart: Build Plan, version 6

9 November 2026. This replaces version 5 and version 4 and `docs/v1/plan-v1.md`. The live screens are the Design
canvas at https://claude.ai/artifact/3Xg9JoNNjmiztxxaed8Fnz. Its exact source, CSS and sample copy are
in `docs/canvas/project/`. The version 4 canvas source stays in `docs/design/` for reference. Nothing is
built yet.

## 1. The idea

Kural Heart is a private, offline Android journal. Each day opens with one Thirukkural couplet and a
question to write from. It is for Tamil and English readers who want a calm habit, not another feed.

Tagline: Journal with Valluvar. Tamil: குறளுடன் நாட்குறிப்பு.

Three things from the Tamil world carry the whole design. They are what a generic journaling app could
not copy.

| Idea | What it is | Where it shows |
| --- | --- | --- |
| ஏடு, the leaf | Palm-leaf manuscripts held one verse per leaf, kept in bundles | The couplet sits on the top leaf of a bundle. The bundle thickens as you write, showing progress with no numbers or streaks |
| நூல், the thread | The word means both thread and book. Leaves were strung on a cord | A fine cord behind your journal pages, with a mood dot at each. It stays off Today |
| சிறுபொழுது, the six small divisions of the day | The classical Tamil day: வைகறை, காலை, நண்பகல், எற்பாடு, மாலை, யாமம் | The sun moves across the six, and is a moon at night. The header says மாலை, not "Good evening" |

Principles:

1. **Calm first.** One main action per screen. No feeds, no ads, no streak guilt.
2. **Tamil is first class.** Every prompt has Tamil and English, and the user picks which leads.
3. **Provably private.** No internet permission at all, so anyone can check the promise. Backups are encrypted first.
4. **Motion explains.** Each animation shows a change of state, and all of it can be switched off.
5. **Respect the text.** Couplets appear exactly as sourced. The app name is never translated.
6. **Reward, never punish.** Writing grows your thread and earns seals. Two rest days a week are kept for
   you automatically, so a busy day costs nothing. A broken thread is never announced, never notified and
   never shown with a sad face. A day you did not write is a small dot.
7. **Premium means restraint.** Valluvar appears at the moments that matter and leaves the reading and
   writing screens alone. One hero per screen, flat colour, real materials, no confetti or badges for
   their own sake.

## 2. What changed

### Version 5, from the owner's brief

| Brief | What changed |
| --- | --- |
| "Use the Thiruvalluvar character design for the UI/UX animation", modelled on Duolingo-style characters | Valluvar returns as the app's companion, drawn as one bold, rounded vector rig with seven poses (section 7). This reverses version 3's "no depiction", on the owner's request |
| Saffron robes and holy ash in the reference | **White veshti and shawl with a gold border, no marks on the brow**, chosen by the owner. The saffron-and-ash look drew a public row in Tamil Nadu in 2019 because it ties Valluvar to one religion and party. The state's official portrait is in white |
| "Key moments should include achievements and streaks" | A streak called **the thread** (நூல்), with two rest days a week kept automatically, and nine **seals** (முத்திரைகள்) marked with Tamil numerals (sections 6 to 9) |
| "Create a suitable logo" | **The heart-beard mark**: Valluvar's head and shoulders on a dawn tile, his beard shaped as the heart, with a smile cut out of it like the Heart Apps tile's smile. It replaces Rising heart as the app icon. The owner liked the heart-shaped beard and asked for the smile |
| "Feel and look premium" | Valluvar stays off Today's reading area, Write and Page. Flat fills, one shade each, gold used sparingly, motion that plays once and then stops |

### Version 5.1, from the design review

| Review point | What changed |
| --- | --- |
| No single brand colour | One accent, **dawn**: #92441A on light grounds (5.1 to 1) and #EE9A5A on dark (7.6 to 1). It replaces the three per-sky golds. Heart red is only for hearts. Gold stays as a material, on Valluvar's border and the seals |
| The owner is unsure about the colours | Three palette directions were drawn: A. Six skies, B. Leaf and lamp, C. Indigo night. **The owner chose B on 8 Nov 2026.** Section 7 |
| Contrast was calculated, not measured | Measured for every period. The full skies fail: grey text 3.4 to 1 at the foot of வைகறை and 3.6 to 1 at the foot of மாலை, light text 1.2 to 1 over the evening sun. Palette B passes everywhere at 6.6 to 1 or better |
| Valluvar drawn from primitive shapes | Redrawn: tapered arms that bend at the elbow, hands with thumbs and fingers, a two-tier beard, a curled moustache, shaped eyebrows. A professional illustrator pass is still recommended before launch, brief in section 7 |
| No home-screen widget | Three Glance widgets in v1 |
| No looking back | On this day moves into v1, as a small palm leaf at the top of the Journal |
| The thread chip broke the quiet Today | It now appears only after today's page is saved. Before that, Today is exactly as quiet as in version 4 |

### Version 6, the complete rework

The owner rejected the look of every earlier version ("I want a premium journal app, not a knock-off"),
shared four showcases of their own, Pinterest, Dribbble and Figma references and an animation studio's
source, and asked for whatever is best by industry standards. **Version 6 replaces the visual world of
every earlier version, including palette B. Where this section and later sections disagree, this section
wins.** The source is `docs/canvas/project/` (`olai.css`, `Main.dc.html`, `Valluvar.dc.html`).

**The world, "Olai".** An editorial journal on warm ivory, with serif headings, one clay accent, rounded
cards and the palm leaf as the one drawn object. Material 3 structure, an 8dp grid, measured contrast.

| Token | Ivory (day) | Midnight (night) |
| --- | --- | --- |
| Ground, surface, raised | #F6F2EA, #FFFDF9, #EFE8DC | #14110F, #1E1A17, #28231F |
| Ink, secondary, tertiary | #1E1A16, #564D44, #73695E | #F3ECE2, #CBC1B4, #A0958A |
| Primary (clay), on primary | #B4492A, #FFF8F2 | #E58A62, #2A140B |
| The three parts | Aram #2F6B53, Porul #3A4E86, Inbam #A8475C | #7FC3A5, #9DB0E6, #E79AAD |
| Heart, gold material | #D63B58, #C9A45C | the same |

Night follows the period of the day: மாலை, யாமம் and வைகறை use Midnight. Type: Literata for Latin
headings, Noto Serif Tamil for Tamil headings, Anek Tamil for interface text, Anek Tamil condensed for the
couplet (the two-line rule is unchanged). The palm leaf is a drawn vector, not a photo: a straw gradient,
three faint veins, a punched hole and a gold cord.

**Screens.** A four-tab navigation bar: Today, Journal, Journey, Settings.

| Screen | What it holds |
| --- | --- |
| Today | Greeting with the Tamil date, the thread pill, the kural card (Valluvar reading in a small arch, the kural number and part, the leaf, the meaning, Word by word, Turn the leaf, Share), the question card in clay with the Mind, Speech and Action lens (மனம், சொல், செயல்) and Write, and a "How is your heart?" bento of four feelings |
| Word by word | A sheet with each word of the couplet and its plain meaning, in its 4 and 3 rhythm |
| Thread | A sheet with the number, the week as knots tied on a cord (rest days as open loops), and the rest-day rule |
| Feeling, mood match | Eight feelings, then a couplet, meaning, question and Write for that feeling |
| Write | The kural pill, the lens, the question, the editor, a feeling chip, Tamil help, and Valluvar scribing in the corner, faster while you type, with gold sparks |
| Save moment | Valluvar jumps for joy, "Saved", the count rolls on, and today's knot ties onto the cord |
| New seal | Valluvar, in his awarding state, jumps for joy holding the seal at his chest; it flies into his hands, rings burst from it, confetti twinkles and soft light turns behind him. Then Continue and Share |
| Journal | Search, On this day, the week's rhythm, and pages as cards with their part and feeling. An empty state with Valluvar |
| Journey | Valluvar walking with his staff, the thread, a 133-chapter mandala, the balance across the three parts, and the seals |
| Settings | Grouped cards: look and language, daily couplet, privacy and data, about |

**Valluvar: the owner's model.** On 9 Nov 2026 the owner judged Claude's rig unnatural and supplied their own
(`AnimatedThiruvalluvar` in `kural_heart_app_ui_showcase.tsx`, also on their Google Sites animation studio). It is now the
app's character, ported unchanged in drawing and motion to `docs/canvas/project/Valluvar.dc.html`: eight states (reading,
writing, contemplating, teaching, walking with a staff, celebrating, listening, presenting) plus a greeting wave and a calm rest
built only from its parts. Faces combine its eye modes (normal, upward, happy) and mouths (smile, joy, chant) into eight
expressions. Each state keeps the source's breath, head, blink, bun and cloth rhythms. Triggers: nod, faster writing while typing.
Build it in Compose from the same parts and keyframes. White robes, bare forehead, no halo.

**Left out on purpose.** The references' AI features ("Ask Valluvar", reflection synthesis, a chat
companion) and voice journaling, because the app has no internet or AI at runtime. The glowing "eureka"
halo, because a halo reads as religious. Tracked-caps labels and dense chips, which cheapen the look.

**New content needed.** Every prompt now needs three questions, one per lens, and a word-by-word gloss of
its couplet. Both are drafted by Claude and checked like the meanings. The Tamil date (ஐப்பசி 23) needs a
verified solar calendar table.

### Version 5.2, the overall look

Three new worlds were drawn: hand-painted cinema banners, the Tamil tear-off daily calendar, and the
category standard. The owner's rule, 8 Nov 2026: **"A journal app should look like a journal, thirukural is
the main idea here, tamil aesthetics are better, but don't over do."** So palette B stays, refined into a
journal. Every change below was rendered and checked on the canvas's own runtime.

| Change | Detail |
| --- | --- |
| Cooler paper | Day ground #F3F1EC to #F8F7F3, so the straw leaf is the only warm, golden thing on screen |
| Paper grain | A 160 px grain tile over every ground, multiplied at 5 percent by day and screened at 4 percent by night |
| A bound book | One soft gutter shade along the left edge of every screen |
| A diary heading | Today leads with the date in Tiro Tamil, "Saturday, 7 November", with the period word beneath |
| A ruled page | Write has hairline rules on the text baseline, 29dp apart, that scroll with the text |
| Night leaf | The leaf, the bundle and On this day are dimmed to 90 percent at night |
| Depth rule | Only the leaf, the seals and sheets cast shadows. Everything else is flat |
| Icons | One set from the app's world, 2dp stroke with round ends: a leaf for Today, a bundle on a cord for Journal, a stylus for Settings, a seal for Seals |
| Settings and Backup | Section names in Tiro Tamil like a contents page, no dividers, values in grey on the right |
| Solid tab bar | The tab bar takes the ground colour with one hairline, so pages never show through it |
| Valluvar smaller | 188dp on the save moment, 156dp on the empty Journal |
| Bug fixed | A mood-dyed Write page kept the day ink and went dark on the dye. It now uses its own light ink |

Tamil touches stay light on purpose: the palm leaf, Tamil type, the period word, Valluvar and the Tamil
numerals on seals. No banner lettering, calendar print, silk borders or kolam.

**Changed in 1.0.1 at the owner's request:** subtle, secular Tamil patterns are now in, kept faint and never under text: a pulli kolam band on the tab bar, a sikku kolam threshold under Valluvar's arch, a Kanchipuram mayil-kann silk border on sheets and the Insights card, and an Athangudi tile corner on the Insights card. No temple, gopuram or rudraksham motifs (they read as religious).

### Version 3, from the owner's review

| Note | What changed |
| --- | --- |
| "Reflection written for Kural Heart" | Removed from every screen, in both languages. The Sources page says once that meanings are original to this app |
| App name was translated | "Kural Heart" stays in Latin letters everywhere, including Tamil screens. குறள் இதயம் is gone |
| Lower part of Today looked cluttered | Week, thread, day letters, today ring and bead row all removed from Today. Part of it was a bug: two lines drawn over each other. The week now appears in the save moment and the Journal |
| "OKish, not very premium", then "still needs work" | Nine directions were drawn for Today. The owner chose **H. Bundle and C. Sun**, now combined across the app. All nine stay on the canvas |
| "The couplets should never take a third line" | Exactly two lines, always, in Anek Tamil condensed (section 7). This replaces the earlier 3 and 4 line rule |
| Bring Valluvar into the design, then "drop it" | Drawn and AI figures were tried and dropped. Reversed in version 5, when the owner asked for him as the app's character |
| How do users type Tamil? | Section 11 |
| Google Drive backup, import and sync | Section 12, and it keeps the no-internet promise |
| Play Store release | Section 14 |

### Version 2, from the first plan

| Version 1 | Version 2 | Why |
| --- | --- | --- |
| Couplet at 26sp on two lines in a wide face | Two lines always, in a condensed face, sized to fit (section 7) | Measured: only 72 of 1,330 reach 18sp on two lines in Tiro Tamil on a 390dp phone. Anek Tamil condensed gets 1,309 there |
| Reveal is always 4 words then 3 | Reveal follows the actual words | 25 of 1,330 kurals are not 4+3 in the source checked |
| Fraunces and Inter, plus two Tamil fonts | Anek Tamil and Tiro Tamil only | One condensed face solves the two-line problem, one serif carries the voice |
| Cream and indigo, fixed light and dark | Six skies that follow the day | Avoids the stock cream-and-serif look, and it is specific to Tamil |
| Internet permission and a content fetch | **No internet permission**, new prompts arrive by app update, and Drive backup goes through Android's file picker | "Cannot send your words anywhere" beats any policy page. Removes hosting, checksums and fallback logic |
| Prompts imported into Room | Read-only JSON asset, kept in memory | 365 small records need no database or import step |
| Hilt | A small `AppContainer` with constructor injection | One-module app, fewer build risks |
| WorkManager reminder | AlarmManager inexact window, plus boot and time-change receivers | Closer to the chosen time, needs no exact-alarm permission |
| One encrypted database added at milestone 7 | SQLCipher from milestone 4 | Entries are never stored unencrypted, so no migration |
| Floating pill bar | Material 3 NavigationBar, themed flat with no fill | Fluent Android users trust it, and it respects gesture insets |
| Eight mood orbs in a row, 3 hidden off screen | One line of text, opening a labelled sheet of all 8 | Moods always have labels, and Today keeps one main action |
| Empty hearts on missed days | A small dot, in the Journal only | The empty heart read as a missed-day mark, which contradicts "no streak guilt" |
| `specialDate` as MM-DD | Explicit dates per year | Deepavali moves every year |
| No draft field on `entry`, `saved_prompt` table with no screen | `status` field added, `saved_prompt` removed | Autosave had nowhere to live, and nothing used saved prompts |
| Reduce motion only in the animation spec | Added to Settings | Screen 8 had left it out |

Not changed: the 8 moods, the chapter table, the Sources approach, the review method, offline-first,
biometric lock, the share card, and the milestone-by-milestone way of working.

## 3. Scope of v1

Android 8.0 (API 26) and up, phones first.

| Area | In v1 | Later |
| --- | --- | --- |
| Daily couplet | Leaf, reflection, question, share card | Audio recitation |
| Mood match | 8 moods, each with a pool of couplets | Free-text matching |
| Journal | Tamil or English writing, autosave, edit, delete with undo | Photos, voice notes |
| History | Journal list, month calendar, search, On this day | Year in review |
| Widgets | Today's couplet 4 by 2, Your thread 2 by 2, On this day 2 by 2 | Lock-screen glance |
| Reminder | One daily notification | Smarter timing |
| Privacy | Encrypted database, app lock, plain text export | |
| Backup | Encrypted backup to Google Drive or any place the user picks, restore on a new phone, merge between phones | Live background sync |
| Tamil typing | Works with any Tamil keyboard, help sheet to set one up | Built-in Tanglish converter |
| Content | 120 prompts at launch | 365 by about month 4, by app update |

Out of v1: accounts, social features, ads, analytics, and AI at runtime.

## 4. Stack

**Changed 9 November 2026 (owner's decision): Kural Heart is rebuilt in Expo, like Prompt Heart and Watch Heart.**
Expo SDK 58, React Native 0.88, Expo Router, EAS builds and `eas update` over the air; Skia draws Valluvar, the
seals and the icons; expo-sqlite holds the journal, sealed with AES-GCM through expo-crypto and a device key in
expo-secure-store; backups keep the KHB1 format. CLAUDE.md has the layout. The table below is the original native
plan, kept for its reasoning; the Kotlin app is at the git tag `native-0.10.0`.

Native Android, for Google Play first. This is the first Heart App not built on Expo, so nothing from
Prompt Heart or Watch Heart's code carries over, and there are no over-the-air updates.

| Concern | Choice |
| --- | --- |
| UI | Kotlin, Jetpack Compose, Material 3 with a custom colour scheme and type scale |
| Navigation | Single activity, Navigation Compose, SharedTransitionLayout, system Back and predictive Back |
| Architecture | One Gradle module, clear packages, MVVM with `StateFlow`, repositories, `AppContainer` |
| Journal storage | Room on SQLCipher (`net.zetetic:sqlcipher-android`) |
| Key handling | Random 256-bit key, wrapped by an Android Keystore AES key. Pass it raw, so there is no slow key derivation at launch |
| Prompts | `assets/prompts/pack_v1.json`, parsed with kotlinx.serialization on a background thread at start |
| Settings | Jetpack DataStore Preferences |
| Lock | androidx.biometric with device credential fallback |
| Reminder | AlarmManager `setWindow`, receivers for boot, time and timezone changes, one notification channel |
| Files | Storage Access Framework for backup, sync and export, so no storage permission and no Google sign-in |
| Animation | Compose animation APIs and Canvas, read in the draw phase |
| Tests | JUnit, Turbine, Compose UI tests, Macrobenchmark, Baseline Profile |

Toolchain on this PC, checked 7 Nov 2026: JDK 17, Android platforms 34 and 37, build-tools 36 and 37,
Gradle 9.4.1 and AGP 9.2.1 in the cache, Kotlin 2.2.21. Confirm the combination at milestone 0. **No
emulator is installed and no phone was connected.** Milestone 0 needs one of the two.

Package layout:

```text
app/src/main/java/com/inigocode/kuralheart/
  core/design/      skies, type, motion, LeafBand, MoodDot, WeekMarks, CoupletText
  core/data/        Room, DAOs, DataStore, repositories, key manager
  core/model/       Kural, Prompt, Entry, Mood, Period
  content/          pack loader, daily picker
  feature/onboarding, today, mood, write, journal, settings, reviewer (debug only)
tools/content/      scripts that build and validate the pack (Python, not shipped)
```

## 5. Content plan

Claude drafts and cross-checks in bulk. The owner approves the chapter table once, then reads only a
sample, in the app, in a few minutes a week.

**Chapter triage.** 68 core, 22 selective, 43 skipped, 133 in total. Figures rechecked.

| Group | Core, 4 to 5 prompts each | Selective, about 2 each | Skipped |
| --- | --- | --- | --- |
| Aram (1 to 38) | 8 to 14, 16 to 25, 30 to 32, 34, 37 | 4, 5, 7, 29, 36, 38 | 1 to 3, 6, 15, 26 to 28, 33, 35 |
| Porul (39 to 108) | 40, 42 to 51, 53, 54, 60 to 63, 65 to 68, 76, 79 to 86, 96 to 103 | 41, 52, 71 to 73, 87 to 89, 94, 95, 104, 105 | 39, 55 to 59, 64, 69, 70, 74, 75, 77, 78, 90 to 93, 106 to 108 |
| Inbam (109 to 133) | 113, 115, 116, 120, 121, 127, 131, 133 | 117, 123, 130, 132 | 109 to 112, 114, 118, 119, 122, 124 to 126, 128, 129 |

68 chapters at about 4.5, 22 at 2, and 15 special days comes to 365.

**Pipeline:**

1. **Source of record.** Build `tools/content/kurals.json` by script, never by typing. Choose one edition
   of record in the metrical form, because the word rhythm and the reveal depend on it.
2. **Check.** 1,330 kurals, 133 chapters of 10, two lines each. A plain letter-for-letter diff of two
   sources is not enough. Between Project Madurai and the GitHub dataset, 441 kurals differed even with
   spaces removed, because editions space and join words differently, for example ஆகா தெனினும் and ஆகாது
   எனினும். Normalise spacing and joined forms first, then list only what is left.
3. **Select.** Universal, turns into a question, gentle in tone, and fine to meet on a bad day.
4. **Measure.** The build script lays out each couplet at 360dp using the real font. Anything under 17sp
   is flagged. 1,330 is far more than the 365 needed, so these can usually be swapped.
5. **Draft.** Plain meaning and question in both languages, in original wording. Moods are tagged.
6. **Cross-check.** Against Parimelazhagar, Manakkudavar, Pope and Aiyar. Confidence High, Medium or Low.
   Any disagreement is Low.
7. **Owner review.** All Low prompts plus a random 15 percent of the rest, in Reviewer mode.
8. **Ship.** Only approved prompts, or High prompts that passed sampling.

**Gentleness applies to mood pools.** A couplet can be true and still wrong for the moment. Example: the
old sketches gave Kural 621, smile at trouble, to someone anxious. Version 2 uses 622 instead, where a
flood of trouble fades once the mind turns and faces it. Anxious, Lonely, Angry and Missing get the
strictest test. Longing prompts avoid gendered wording.

**Order of prompts.** The first seven days are a hand-picked welcoming sequence. After that, shuffled by
the user's seed. Prompts are used only on days the app opens, so nobody skips couplets by being away.

**Rights:**

- Safe: the Tamil kurals, Pope (1886), Aiyar (1916, Standard Ebooks is CC0), and the medieval commentators.
- Do not copy: Mu. Varadarajan, Karunanidhi, Salamon Pappaiah or any modern commentary.
- The GitHub dataset `tk120404/thirukkural` has no licence on its page and bundles modern commentaries.
  Its `Translation` field is not Pope. Do not ship from it. It was used here only to source sample
  couplets, with 391, 622, 783, 108, 151 and 1266 matching Project Madurai letter for letter.
- Project Madurai's page carries its own copyright notice, so read its terms before redistributing a
  file. The kurals themselves are public domain.
- Meanings and questions are original. The Sources page says so once, with credits. No per-screen label.
  This is a careful reading, not legal advice.

**Status, 9 November: not solid yet.** No kural text in the app comes from a source of record so far. The
prototype's Pope lines and transliterations were typed for the design and are unverified, and every meaning,
question, lens, word gloss and Tamil UI string is a Claude draft awaiting review. Sources to build from:
Project Madurai's Thirukkural e-text and Tamil Wikisource for the Tamil, Internet Archive scans of Pope's 1886
edition (choose a scan without a modern rights notice), and Standard Ebooks' Aiyar (CC0). Milestone 1 builds
`kurals.json` by script and checks all 1,330 against a second source before anything ships.

## 6. Data

**Prompt pack (JSON).** Validated at build time, so a bad pack fails the build and never reaches a phone.

```json
{
  "packVersion": 1,
  "prompts": [{
    "id": "p-0001",
    "kurals": [{
      "number": 391,
      "line1": "<from the source file>",
      "line2": "<from the source file>",
      "translit": ["<line 1>", "<line 2>"],
      "pope": "<public-domain text>",
      "aiyar": "<public-domain text>"
    }],
    "chapter": { "number": 40, "ta": "கல்வி", "en": "Learning" },
    "pal": "aram",
    "meaningTa": "<reflection>", "meaningEn": "<reflection>",
    "questionTa": "<question>", "questionEn": "<question>",
    "moods": ["driven", "unsure"],
    "gentle": true,
    "tier": 1,
    "firstWeekDay": null,
    "specialDates": ["<YYYY-MM-DD>"],
    "confidence": "high",
    "review": "approved"
  }]
}
```

A prompt holds one or two kurals. Never write Tamil kural text in code by hand.

**Moods.**

| Id | English | Tamil | Dot | Dye, top | Dye, bottom |
| --- | --- | --- | --- | --- | --- |
| grateful | Grateful | நன்றி | #EFA945 | #45290E | #573614 |
| calm | Calm | அமைதி | #5FA79B | #102E2B | #163D39 |
| anxious | Anxious | கவலை | #837AD0 | #1F1D42 | #292654 |
| angry | Angry | சினம் | #D9534A | #411517 | #531C1E |
| lonely | Lonely | தனிமை | #5478BE | #121C34 | #1A2847 |
| missing | Missing someone | ஏக்கம் | #DA7396 | #41182B | #521F37 |
| driven | Driven | முயற்சி | #66B05E | #112D1C | #173C27 |
| unsure | Seeking clarity | தெளிவு | #A6A0BD | #262337 | #322E45 |

**Encrypted tables.**

| Table | Fields |
| --- | --- |
| entry | id (UUID), createdAt, updatedAt, localDate, promptId (nullable), moodId (nullable), text, wordCount, status (draft or saved), deletedAt (nullable), deviceId |
| daily_pick | localDate (primary key), promptId |
| seal | id (primary key), earnedAt, entryId that earned it |

**DataStore:** leadLanguage, colourMode, reminderEnabled, reminderTime, lockEnabled, shuffleSeed,
onboardingDone, reduceMotion, lastOpenedDate, deviceId, backupUri, backupAuto, lastBackupAt, lastSyncAt.

**Rules:**

- One entry per prompt per day. Tapping "Keep writing" reopens it. Free writes and mood entries are
  separate entries.
- Autosave 2 seconds after typing stops, and also on leaving the screen. A draft does not fill the heart.
  Save does. An abandoned draft reopens from Today.
- Daily pick: a special date wins, then first-week order, then the next unused prompt in seeded order.
  The pick is frozen in `daily_pick` and changes at local midnight, even with the app open.
- Search: `LIKE` over saved entries. If FTS comes later, test Tamil queries and vowel signs first.
- Word count splits on whitespace, which works for Tamil too.

**The thread (the streak).** Computed from saved entries, never stored, so a restore or merge can never
corrupt it.

- A day counts when it has at least one saved page. Drafts do not count.
- In each Monday-to-Sunday week, up to two days without a page are rest days and keep the thread whole.
  No purchase, no "freeze" to remember, no setting.
- A third missed day in a week ends the thread quietly. The next page starts a new one. The longest thread
  is kept and shown, so nothing earned ever disappears.
- Never mention the thread in a notification, and never show a broken thread as a loss.
- Days use the phone's local date. Travelling across timezones never breaks a thread: a day is kept if
  either the old or the new local date has a page.

**Seals.** Earned once, kept for ever, stored in `seal` so a seal survives even if the page that earned it
is deleted. Each carries a Tamil numeral.

| Id | Seal | Numeral | Earned by |
| --- | --- | --- | --- |
| first | முதல் ஏடு, First leaf | ௧ | The first saved page |
| tamil | தமிழில், In Tamil | அ | A saved page that is mostly Tamil script |
| week | ஏழு நாள் நூல், Seven-day thread | ௭ | A thread of 7 days |
| chapter | அதிகாரம், A chapter | ௰ | 10 saved pages, as a chapter holds 10 kurals |
| times | ஆறு பொழுது, All six times | ௬ | A page in each of the six சிறுபொழுது |
| three | முப்பால், All three parts | ௩ | Pages on prompts from Aram, Porul and Inbam |
| month | முப்பது நாள் நூல், Thirty-day thread | ௩௰ | A thread of 30 days |
| hundred | நூறு ஏடுகள், A hundred leaves | ௱ | 100 saved pages |
| year | ஓர் ஆண்டு, A year with Valluvar | ௩௱௬௰௫ | 365 saved pages |

Seals are brass medallions with an enamel face and two ribbon tails, coloured by kind: clay for pages, rose for the thread, indigo for Tamil, green for the times of day and the three parts. Seals ahead are a dashed ring in their colour. Each seal shows the Tamil numeral with the familiar digit beneath it, because most readers today take the numerals for letters (owner, 9 Nov 2026). No seal depends on mood, so nobody is nudged to feel angry or lonely to complete a set. No seal rewards
speed or length. Seals that need restores or merges recompute on open and only ever add.

## 7. Design system

The look is one warm object in a calm, near-empty field. Premium comes from restraint: one hero per
screen, plenty of space, one button, and a real material. If something does not earn its place, it goes.

### The couplet rule

A kural is two lines. **It is always set on exactly two lines, on every screen, phone and font size.** Each
line of the kural is one line on screen, left aligned or centred, and never wraps.

- Face: Anek Tamil at width 75 (condensed), weight 400 to 500.
- Size: the largest that fits the wider line, capped at 25sp. Both lines use the same size.
- Leaf: 8dp from the screen edges, with 12dp inside, so text width is screen width minus 40dp. The cord hole
  sits above the text, not beside it.
- This fit is measured in code at runtime. The text never wraps, so `softWrap = false`, and the size is
  calculated from the real text width, including at any system font scale.

Results for all 1,330 kurals, at weight 500:

| Phone width | Text width | Median size | 18sp or larger | 20sp or larger | Smallest |
| --- | --- | --- | --- | --- | --- |
| 412dp | 372 | 23.8sp | 1,323 | 1,242 | 17.4sp |
| 390dp | 350 | 22.4sp | 1,294 | 1,107 | 16.4sp |
| 360dp | 320 | 20.4sp | 1,145 | 762 | 15.0sp |

For comparison, at a slightly wider 358dp of text: Tiro Tamil has a median of 15sp and a smallest of 11.1sp,
and Noto Serif Tamil at its narrowest width has 19sp and 13.9sp. That is why the couplet cannot be in Tiro Tamil.

Two honest costs. Condensed Tamil is tighter and less classical than a serif, so the serif voice moves to
the period word and the question. And because the couplet must stay on two lines, it cannot grow with a
large system font size. At high font scales the meaning and question grow, and TalkBack reads the couplet
as usual.

### Fonts

Both are open-licensed. Bundle the OFL licence files and credit them on the Sources page.

| Role | Face | Size |
| --- | --- | --- |
| Couplet | Anek Tamil, width 75, weight 400 to 500 | By the couplet rule |
| Period word | Tiro Tamil Regular | 23sp |
| Screen titles | Tiro Tamil Regular | 30 to 34sp |
| Question | Tiro Tamil, Latin in Italic | Tamil 23sp, English 26sp |
| Meaning | Anek Tamil Regular, muted | 15.5sp |
| Journal text | Anek Tamil Regular | 16.5 to 17sp, line height 1.55 Latin, 1.7 Tamil |
| Labels, buttons | Anek Tamil Regular or Medium | 12.5 to 16.5sp |

Tamil rules: no italic, no synthetic bold, no capitals, no tracking, line height at least 1.55 in running
text, sp units always, and never clip a line. Set headings to weight 400 explicitly, since Tiro Tamil has
no bold and a default bold is faked. Latin labels are sentence case too.

The specimen screen compares Anek Tamil condensed with Noto Serif Tamil extra-condensed. My pick is Anek.
The owner decides on a real phone. Bundle the variable font so Compose can set the width axis.

### Palette: B, Leaf and lamp, chosen by the owner

Three directions were drawn on the same screens and the owner chose **B** on 8 Nov 2026. Build only B. A
and C stay on the canvas and in `kural.css` for the record, and the prototype's palette tweak still shows
them, but no code path for them ships.

| | A. Six skies | **B. Leaf and lamp, chosen** | C. Indigo night |
| --- | --- | --- | --- |
| Idea | The whole screen takes the colour of the hour | Paper by day, lamp-black by night. The hour lives in a tint at the top of Today, the sun and the period word | Always dark, one indigo ground, a small sun |
| Grounds | Six calm pairs, below | Day #F5F1E8 to #FBF8F2, night #121014 to #1C1820 | #0F1226 to #171B35 |
| Ink, muted | Per period, below | Day #1F1A15, #5C544A. Night #F2ECE2, #B5ACA2 | #EDEAF5, #A9A8C4 |
| Worst measured contrast | Grey 3.4 to 1, text over sun 1.2 to 1 | Grey 6.6 to 1 | Grey 7.3 to 1 |
| Feels like | Vivid, unique, busy | Day One or Stoic, with a Tamil soul | Stoic or Calm |
| Cost | Six palettes to test on every screen | Two | One |

Why B: it keeps the six சிறுபொழுது, which no rival has, but moves them off the text, so every word sits on
a plain ground. With fewer colours on the screen, the palm leaf and Valluvar become the richest things on it.
That restraint is what reads as premium. In B, the splash, save moment and new seal keep the full sky of the
hour, because they carry almost no text.

| B, by day | Value | B, by night | Value |
| --- | --- | --- | --- |
| Ground top, bottom | #F5F1E8, #FBF8F2 | Ground top, bottom | #121014, #1C1820 |
| Ink | #1F1A15 | Ink | #F2ECE2 |
| Muted | #5C544A | Muted | #B5ACA2 |
| Button, on button | #1F1A15, #FBF8F2 | Button, on button | #F2ECE2, #121014 |
| Accent | #92441A | Accent | #EE9A5A |

Day is காலை, நண்பகல் and எற்பாடு. Night is மாலை, யாமம் and வைகறை. Today's top tints and sun places are in
`docs/canvas/project/kural.css`, under palette B.

### Skies and the sun

With palette B, the full skies below appear only on the splash, the save moment and a new seal. Today shows
the hour as a tint at its top and the sun in its B position. Every other screen uses the paper or lamp
ground, and the "calm" columns below are superseded by B's grounds.

"Follow the day" is the default: paper for காலை, நண்பகல் and எற்பாடு, lamp for மாலை, யாமம் and வைகறை.
Settings also offers Follow system, Always paper and Always lamp. The ground changes on the next open, not
while someone is mid-sentence.

Today, the splash and the save moment use the full sky with the sun. All other screens use the calm pair
of colours, so reading and writing are never next to a big bright shape.

| Period | Hours | Today sky, top to bottom | Sun | Calm top | Calm bottom |
| --- | --- | --- | --- | --- | --- |
| வைகறை | 2 to 6 am | #0F1430, #232650, #5A3F66, #8A4F66 | Not risen, only the glow | #11162B | #2A2842 |
| காலை | 6 to 10 am | #DCE7EE, #EFEBDD, #F7E3BE | Low on the left, 250dp, #FFE9B4 to #F7C160 | #EEF0EC | #F5F3EC |
| நண்பகல் | 10 am to 2 pm | #E3EEF2, #F2F1E9 | High at top right, 270dp, #FFF3C8 to #FFE29A | #F6F4EE | #FAF8F3 |
| எற்பாடு | 2 to 6 pm | #F0E3C8, #EFD2A2, #E9B77E | Lowering on the right, 310dp, #FFD089 to #E98E45 | #F1E8D8 | #EBDCC2 |
| மாலை | 6 to 10 pm | #120E22, #231632, #4A2340, #8C3F3E | Huge and setting, 560dp, #FFD79A to #A63F3A | #17131F | #241A2B |
| யாமம் | 10 pm to 2 am | #090B18, #10142A | A small moon, 66dp, #F6F1E4 to #CFC9BA | #0B0C14 | #11131F |

| Period | Ink | Muted | Button | On button | Sheet |
| --- | --- | --- | --- | --- | --- |
| வைகறை | #F2EEEA | #C2BECC | #F2EADD | #171A30 | #242642 |
| காலை | #191A24 | #565762 | #191A24 | #F7F4EC | #FBFAF5 |
| நண்பகல் | #1A1A1F | #58585F | #1A1A1F | #FAF8F3 | #FFFDF8 |
| எற்பாடு | #251A16 | #5B4A3E | #251A16 | #F7EFE0 | #F6EEDF |
| மாலை | #F5EFE6 | #BDB3BA | #F3EBDD, and #1A1022 on the sun | #1B1620, and #FBF3E8 on the sun | #2A2031 |
| யாமம் | #EEEBE4 | #ABAAB4 | #EEE8DC | #11131F | #191B29 |

Over the sun or the dawn glow, use full ink, not muted, for the link and navigation labels. Muted fell to
3.4 to 1 there. In மாலை those labels are dark, #2A1216, and the active tab is marked by weight.

Accent, in every palette: dawn, #92441A on light grounds and #EE9A5A on dark, used sparingly. Heart:
#D63B58, and nothing else in the app is red. Heart Apps chip: #F2B84B. Gold #D0A85F is a material only,
on Valluvar's border and the seals, never for text or controls.

Contrast measured on 8 Nov 2026 against every gradient stop and the sun, with the WCAG formula. On the calm
pairs, ink is 12.3 to 1 or better and muted 6.2 to 1 or better, but the full skies used on Today fail for grey
text at the foot of வைகறை (3.4 to 1) and மாலை (3.6 to 1), and for light text over the மாலை sun (1.2 to 1).
Palette B and C pass everywhere. A screen photo on a real phone is still required at milestone 2, because
screens, brightness and night modes vary.

### The materials

- **Leaf.** Pale straw, fine long fibres, faint ribs, from `docs/design/leaf.jpg` (70 KB, made by
  `docs/design/leaf_texture.py`). 7dp corners, soft shadow, about 124dp tall. Text is ink #24170C. One small
  dark cord hole at the top centre. It looks the same in every sky.
- **Bundle.** On Today, earlier leaves stack beneath the top leaf, each offset 6dp, slightly misaligned and
  darker going down. No count is ever shown. Thresholds for extra leaves: 1, 7, 30, 100 and 365 saved
  pages, plus today's page while it is new. Maximum 6 leaves, so it stays tidy.
- **Sun.** A flat disc with a soft radial tone, no glow halo, behind everything else.
- **Mood dots.** Flat and matte, 14dp on chips and 26dp in the sheet.
- **Cord.** Only in the Journal, 1dp at 28 percent opacity.
- **Hearts.** Only a page you saved earns one.
- **Dye.** Mood screens use a deep flat dye, so the leaf stands out.

Material 3 stays the rulebook for structure: NavigationBar (flat, no fill, no indicator), ModalBottomSheet,
FAB, Snackbar, Switch, 48dp targets, edge-to-edge with insets, and system Back. Brand arrives through the
colour scheme, type and these materials. No dynamic colour, because the skies are the point.

### Valluvar, the companion

The owner asked for Valluvar to carry the app's animation, in the spirit of Duolingo's characters: bold,
round and expressive. The source is `docs/canvas/project/Valluvar.dc.html`, and the character sheet is on
the canvas.

**Look.** Seated cross-legged, big head, large eyes with a highlight, thick rounded limbs, flat fills with one
shade each, no outlines, no gradients. Hair in a bun, full beard and moustache, white veshti and shawl with a
gold border, a palm leaf and stylus. **No holy ash, tilak or other religious mark, and no saffron**, the
owner's decision. He looks the same on every sky.

| Part | Colour |
| --- | --- |
| Skin, shade | #B8754A, #9A5B37 |
| Hair and beard | #2A2130 |
| Veshti and shawl, shade | #F6F1E7, #DDD4C4 |
| Gold border | #D0A85F |
| Palm leaf, shade, ink | #E8CF96, #CBAA68, #7A5A2E |

**Seven poses, one rig.** Body, head and face are shared. Only arms, eyes, mouth and props change.

| Pose | Where it appears |
| --- | --- |
| Greeting (wave) | Onboarding page 1, and a new seal |
| Reading | Onboarding page 2, and the thread sheet |
| Writing | Onboarding page 3, and the empty Journal |
| Thinking, stroking his beard | The feeling sheet |
| Joy, leaf held high | The save moment |
| Teaching, Tamil letters rising | The Tamil keyboard help sheet |
| Resting | The thread sheet on a rest day |

**Where he never appears:** the couplet leaf, Write, Page, Settings, Backup, the share card and any
notification. Reading and writing stay his verses and your words.

**On sheets** he peeks over the top edge at 116dp, on the right, so he never covers text.

**Build.** Each part is a Compose `ImageVector` drawn on one `Canvas`, transformed with `graphicsLayer`. A
pose is an enum in state, and changing it crossfades the changed parts over 220ms. No Lottie or Rive
dependency, so nothing new to vet for the no-internet rule. Ship the rig as one Kotlin file generated from
the SVG by a script in `tools/`, so the drawing has a single source.

**Illustrator brief, before launch.** The canvas drawing is a working design, not final art. Hire an
illustrator for one pass, with this brief: keep the silhouette, proportions, palette, white robe with gold
border and the seven poses exactly. Refine the hands and elbows, give the beard and veshti folds real
rhythm, make one consistent corner radius across every shape, and deliver layered SVG with one group per
part, named as in `Valluvar.dc.html` (`vl-head`, `vl-eye`, `vl-pupil`, pose groups), so the Compose rig
needs no rework. Budget for 7 poses, the icon bust, and a 1024 px store image. No religious mark, ever.

**Respect.** He is a gentle, warm presence, never a joke. He never frowns, cries, sulks or scolds, never
points at the user, and never says anything. Words stay in the app's voice.

### Logo: the heart-beard mark

**Updated 9 Nov 2026:** the mark is now drawn with the owner's Valluvar model: his rounded face, topknot, ears, eyebrows and dot eyes, with the beard shaped as the heart and a smile cut out, on the dawn tile with white shoulders. The monochrome icon outlines the face over a solid heart. Source: `docs/canvas/project/Logo.dc.html`. The older drawing below is superseded.

Valluvar's head and shoulders on a dawn tile, #FFD08A to #E5693F. His beard is the heart, #2A2130, with a
smile cut out of it in #F3C9A0, the way the Heart Apps tile cuts out its smile. White shawl with the gold
border below. The vector is in `docs/canvas/project/Logo.dc.html`.

- **Adaptive icon:** the dawn gradient is the background layer. The figure is the foreground layer, scaled to
  0.8 so the bun and beard sit inside the 66dp safe zone.
- **Monochrome (themed) icon:** bun, face ring, eyes and the heart beard with the smile cut out, one colour.
- **Notification small icon (9 Nov):** the heart-beard glyph, cut down to what survives at 24dp in one colour:
  the bun, the hair and the heart beard with its smile. It replaces Rising heart. Drawn on the Brand board.
- The launcher icon (adaptive, with the monochrome layer) was built at milestone 0. The notification glyph
  and the animated splash follow at milestone 9.

## 8. Screens

All of these are in the canvas, and the first board plays the whole app.

| Flow | Path |
| --- | --- |
| First launch | Splash, language, reminder, privacy, Today |
| New phone | Splash, language, Restore from a backup, passphrase, Today |
| Daily habit | Notification, Today, Write, Save, Today |
| By feeling | Today, feeling sheet, mood match, Write |
| Free write | Journal, plus button, Write |
| Revisit | Journal, page, edit or delete |
| Find | Journal, search, page |

1. **Splash.** The sky and sun of the hour, with the logo and wordmark rising. Must not delay first content.
2. **Onboarding, three pages, skippable.** Language. Reminder time, the only place notification
   permission is asked. Privacy promise with the optional lock, plus a Restore from a backup link.
3. **Today.** Sky and sun. Then six things only: period word and date, the thread chip with the language switch, the bundle with
   today's leaf, kural number with the meaning, the question, and Write. "How are you feeling?" is a line of text below. The body scrolls for
   long content. After saving, the button reads Keep writing.
4. **Turning the leaf.** Tap the leaf to flip it on its long axis: transliteration, Pope's verse, later
   Aiyar. This is how non-Tamil readers reach the sound of the verse.
5. **Feeling sheet.** All 8 moods with both labels.
6. **Mood match.** The mood's dye fills the screen. Leaf, meaning, question, Write, and Show another
   couplet, which never repeats back to back.
7. **Write.** Couplet collapsed to a pill that expands on tap, question, editor, mood chips above the
   keyboard, Save and a word count. The அ button opens Tamil keyboard help. Choosing a mood dyes the page.
   With no prompt, it is a blank page.
8. **Save moment.** On the sky, Valluvar jumps for joy with the leaf held high and petals of jasmine and
   gold fall once. "Saved", then the thread count rolls up by one beside a heart, and the week appears with
   today's heart filling. Back on Today, the bundle has the new leaf.
8a. **Thread chip.** Once today's page is saved, a heart and the thread's number appear beside the language
   switch. Before that, Today shows nothing new. Tapping it opens the thread sheet.
8b. **Thread sheet.** Valluvar reading, peeking over the top edge. The number large, "days on your thread",
   the week with hearts for pages and a leaf for rest days, a line saying two rest days are kept each week,
   the longest thread, and a row to Your seals.
8c. **New seal.** Only when a page earns one. The seal turns in, a light passes across it once, its Tamil and
   English names, one sentence on why it matters, Valluvar greeting, Continue and Share this seal.
8d. **Seals.** From the Journal's seal button. Nine seals in a grid of three. Seals ahead are a dashed ring
   with a faint numeral and what earns them, never grey or locked.
9. **Journal.** On this day first, when a page exists from the same date a year or more ago: a small palm
   leaf with the date, two lines of that page and its kural, opening the page. Then this week's marks, then pages as plain text on a fine cord, no cards, newest first. Calendar
   toggle with mood dots on days. Search. Plus button for a free write. Empty state: உங்கள் முதல் ஏடு
   காத்திருக்கிறது.
10. **Page.** Date, mood, collapsed couplet, full text, Edit, Share text, Delete. Delete shows a snackbar
    with Undo, and becomes final when it times out.
11. **Settings.** Language, colours, reduce motion, reminder, lock, Backup and sync, delete all data,
    sources, about. Debug builds add Reviewer and Font specimen.
12. **Backup and sync.** First time: what it does and Choose Google Drive. Connected: place, last backup,
    automatic switch, Back up now, Sync with this backup, Change passphrase, Export as text.
13. **Tamil keyboard help.** A sheet with three steps and a button to the system's keyboard settings.
14. **Share card.** Post 1080 by 1350 and Story 1080 by 1920: the leaf, the meaning, a still Valluvar and
    the wordmark. "Add my line" is off by default, so a journal line is shared only on purpose.
15. **Widgets.** Jetpack Glance, on ivory and Midnight cards (redrawn in Olai, 9 Nov), plus a slim 4 by 1. Today's couplet (4 by 2): the period word,
    the kural reference, the leaf with the couplet on two lines, and Write. If the couplet would set below
    15sp at the widget's width, show the question instead. Your thread (2 by 2): a still Valluvar, the
    heart and the number; before today's page it says the question is waiting, never that a thread is at
    risk. On this day (2 by 2): only that a page exists and its kural, never the words written, because a
    home screen is visible to anyone holding the phone. With the app lock on, the widgets show only the
    kural. They redraw at local midnight from the daily pick's alarm and after each save, with no network.

**Designed in words only, not yet drawn:** search results state, passphrase entry, restore progress, sync
conflict note, delete all confirmation (type the word), lock screen, permission refused, About with the
Heart Apps block, Sources, Reviewer, and the 200 percent font scale. Milestones that reach these use the
same parts and must show the owner a screenshot before moving on.

**Reviewer (debug only).** One prompt at a time with everything the owner needs. Approve or flag with a
note. Exports JSON.

## 9. Motion

Tokens: 150, 300 and 500ms. Standard (0.2, 0, 0, 1), decelerate (0.05, 0.7, 0.1, 1), accelerate
(0.3, 0, 0.8, 0.15). Springs: damping 0.8, medium stiffness. Keep to transform, alpha and, on Android 12
and up, blur.

| Moment | Spec |
| --- | --- |
| Splash | Sun rises, logo and wordmark rise over 500ms |
| Couplet reveal | The one authored moment. Each word fades, rises 12dp and unblurs over 450ms, 60ms apart, with a 120ms pause between verse lines. Blur only on Android 12 and up |
| Sun | Rises 22dp and fades in over 1 second on opening Today, then stays still |
| Leaf turn | 600ms rotation on the long axis |
| New leaf | After saving, the top leaf settles onto the bundle from 30dp above, 550ms |
| Feeling sheet | Rises 350ms, decelerate |
| Mood | Circular dye reveal from the tapped mood, 450ms, then the leaf fades in and scales from 0.96 over 350ms |
| Leaf to Write | Shared element into the pill, 400ms |
| Mood chip | Dye crossfades, 500ms |
| Save | Heart draws over 700ms, confirm haptic, today's small heart fills in the week over 700ms, screen leaves. Total 1.4 seconds, content is already saved before it starts |
| Journal | Pages rise 16dp, 40ms stagger, first 8 only |
| Language swap | Crossfade 220ms |
| Tabs | Fade-through 200ms |
| Valluvar idle | Breathes every 3.6 seconds, 1.6dp, and blinks every 5.2 seconds. Resting breathes every 5.6 |
| Valluvar gestures | Writing: the stylus scratches, 1.2 seconds. Greeting: the arm waves from the shoulder, 0.8 seconds. Thinking: the hand strokes the beard and thought dots rise. Teaching: the mouth moves and Tamil letters rise and fade |
| Valluvar joy | Squash, jump 18dp, land and settle, 1.4 seconds, twice. The shadow shrinks as he rises. Petals fall once, 2.8 seconds |
| Valluvar peek | Rises 24dp and fades in over 500ms, 200ms after a sheet opens |
| Thread count | After the heart draws, the old number rolls up and the new one arrives, 450ms, and the heart beats once |
| New seal | Turns in from 0.55 scale and -14 degrees, 700ms, decelerate. One light sweep, 1.2 seconds, then it repeats only while the screen is open |

Haptics: light tick on mood and tab, confirm on Save, a second confirm when a seal is earned, nothing while
typing.

Valluvar under reduced motion: every pose is a still drawing, the thread number simply shows the new value,
and the seal appears without turning.

Reduced motion, from the system or Settings: no stagger, blur, turn, fill or sun rise. Everything else is a
100ms crossfade. Nothing may depend on an animation finishing.

## 10. Privacy, notifications, accessibility

**Privacy**

- The merged release manifest must not contain INTERNET, and the build fails if it does. Check every
  dependency for this.
- No analytics, ad or crash-reporting SDKs.
- `allowBackup` false, plus data extraction rules. Backups are the app's own, as in section 12.
- Plain text export is also offered, because the words belong to the user.
- The promise is about this app. The wording must stay honest: "cannot go online on its own", and backups
  go through the Drive app the user chose.
- Ask the keyboard not to learn from journal text with `IME_FLAG_NO_PERSONALIZED_LEARNING`. I could not
  confirm the Compose route for this flag, so settle it at milestone 4. It is a request a keyboard may
  ignore.
- Lock re-engages 30 seconds after leaving the app. With lock on, set FLAG_SECURE on Write, Journal and
  Page, and hide them in recents.
- Delete all data wipes the database, DataStore and Keystore key.
- Play Data safety: no data collected. Host a plain privacy page on the site.

**Notifications**

- One channel, Daily couplet. Body is the reflection question in the lead language, never journal text.
- After 7 ignored days, stop until the app is opened. No guilt copy, ever.

**Heavy days.** This app will meet people at 2 am. Add a quiet "If today feels too heavy" row in Settings
and on the Anxious and Lonely mood screens, listing Indian support lines stored in the app. Verify every
number just before release, and never ship one unverified.

**Accessibility**

- Full strings in `values-ta` and default English.
- Font scale to 200 percent with no clipped Tamil.
- Mood always has a text label.
- TalkBack: tag Tamil text with its locale, read a couplet as one unit, and give every control a label.
- 48dp targets, with contrast already calculated in section 7. Recheck on a device.

**Performance targets:** cold start under 1.5 seconds on a mid-range phone, install under 30 MB, smooth on
a 2 GB device. Confirm that blur and shared elements hold up on low-end hardware.

## 11. Typing in Tamil

On Android the keyboard is a separate app. Kural Heart does not need its own: the editor accepts Tamil
from any keyboard. The app's job is to make sure people get there.

- **What users can do today:** Gboard has Tamil. It offers a Tamil layout, and typing in English letters
  to pick the Tamil word. Other Tamil keyboards work too. So does pasting.
- **Hint the language.** When Tamil leads, set `KeyboardOptions.hintLocales` to Tamil, which asks a
  multilingual keyboard to switch by itself. The Compose docs call this best effort.
- **Detect and help.** Use `InputMethodManager` to check for an enabled Tamil subtype. If Tamil leads and
  there is none, show the help sheet once. It is always reachable from the அ button in Write, and opens
  `Settings.ACTION_INPUT_METHOD_SETTINGS`.
- **Mixed writing is normal.** The editor font covers both scripts, with one line height tall enough for
  Tamil. Search and word count treat them the same.
- **Not in v1:** a built-in Tanglish converter. Without a large dictionary it cannot choose between ன, ண
  and ந, or ற and ர, so it would do worse than Gboard and add size.
- **Keyboard privacy.** A keyboard sees what is typed. Voice typing and any cloud features belong to that
  keyboard, not to Kural Heart.

## 12. Backup and sync

Google Drive backup, restore and merging between phones, with **no internet permission and no Google
sign-in**. Android's file picker lets the user choose Drive as a location. Kural Heart writes an encrypted
file there, and the Drive app carries it.

**Set up.** `ACTION_CREATE_DOCUMENT` opens the system picker, and the user chooses Drive. Take a
persistable URI permission so later backups need no picker. The user sets a passphrase. The derived key
is wrapped by the Keystore, so automatic backups do not ask again.

**File.** One file, `kural-heart.backup`: entries including deletions, settings worth keeping, and the
daily picks, as JSON, encrypted with AES-256-GCM using PBKDF2-HMAC-SHA256 at 600,000 iterations or more.
Random salt and IV, versioned header. Only ciphertext ever leaves the app. A lost passphrase cannot be
recovered, and the app must say so plainly when it is set.

**Automatic backup.** After a save, debounced by 30 seconds, and when the app goes to the background.
Writes use mode `"wt"`, write to memory first, and never leave a half-written file on failure.

**Restore on a new phone.** From onboarding or Settings: `ACTION_OPEN_DOCUMENT`, pick the file from Drive,
enter the passphrase, and optionally keep using that file.

**Merge between phones.** On app open and on Sync with this backup: read, decrypt, merge, write back.

- Entries match by UUID. Newest `updatedAt` wins.
- A deletion is kept as `deletedAt` so it does not come back, and purged after 90 days.
- **Never lose words.** If the same page changed on both phones since `lastSyncAt`, keep both, the second
  marked as a copy.
- Merging is idempotent, and any error leaves local data untouched.

**Honest limits.**

- This is sync by a shared file, not live sync. A change reaches the other phone after Drive uploads it
  and that phone reopens the app.
- Both phones need the Drive app signed in to the same account.
- **Unproven, and the biggest risk in this plan.** Android's docs say persistable access depends on the
  provider, and I found no confirmation of how Drive behaves when written to days later, or how fresh its
  copy is on read. Prove this on a real phone with a throwaway test before milestone 4 fixes the design.

**If that test fails:**

1. Keep the no-internet path but make it manual: Back up now and Restore each open the picker. Backup and
   restore still work. Automatic sync does not.
2. Or use the Google Drive API with sign-in. Sync becomes dependable, but the app gains the INTERNET
   permission, a Google Cloud project and sign-in, and the "no internet" promise ends. That is the
   owner's decision, not a default.

The same file approach works with other storage providers and with a local file, and needs no Google
libraries, so an F-Droid build stays possible.

## 13. Heart Apps rules

- App id: `com.inigocode.kuralheart`, matching Prompt Heart and Watch Heart. Version 1 suggested
  `app.kuralheart`. It cannot change after the first Play upload, so confirm it first.
- Commits as `Inigo <270059847+inigo-code@users.noreply.github.com>`, with no Claude attribution lines.
- Settings > About has one row, "About Kural Heart", with the Heart Apps tile. The About screen carries the
  "A HEART APP" chip and the Heart Apps card, as `heart-apps.md` describes.
- Free, with no ads, tracking or purchases. Contact: inigo@tosstheworld.org.
- Add Kural Heart to `heart-apps.md`, the shared notes and the sites when it first ships.
- Every update has What's new. With no internet there is no update prompt, so updates come through Play.
- A sideloaded APK, if offered, uses a fixed name, suggested `kural-heart.apk`. Ask before creating repos,
  sites or releases.

## 14. Google Play release

Play is the main release path. Check every requirement in Play Console when the time comes, because these
rules change.

**Technical**

- Upload an Android App Bundle from `bundleRelease`, with Play App Signing. Keep the upload key out of git.
- Target API 36 or higher. Third-party guides say this has applied to new apps since 2026, and the exact
  current rule must be confirmed in Play Console.
- Support 16 KB memory pages. SQLCipher is the app's native code, so pick a build that supports it and
  test on a 16 KB emulator image. Guides disagree on the enforcement date, so treat it as required now.
- A Play install and a sideloaded APK are signed differently, so one cannot update the other. The backup
  file moves a journal between them.

**Testing gate**

- Newer personal developer accounts must run a closed test with at least 12 opted-in testers for 14 days,
  then apply for production. Guides say the 14 days should be continuous, and review can take about a week.
- Prompt Heart is going through this now. Confirm in Play Console whether it applies again to a second app
  on the same account, and allow about 3 weeks in case. Keep 3 to 5 spare testers.

**Store listing**

- Title, short and full description in English and Tamil (ta-IN).
- 512 by 512 icon, 1024 by 500 feature graphic, phone screenshots from a real device in both languages.
- Privacy policy URL on the Kural Heart site, plus the contact address.
- Content rating questionnaire, target audience, ads declared as none.
- Data safety: nothing collected or shared by the app, and encryption explained. Answer the form from the
  final build, including how user-chosen Drive backups are described.
- No account, so no account deletion flow. Delete all data covers local data.
- Make no health or therapy claims in the listing or app, and answer any health declaration honestly.

## 15. Milestones

Build one at a time. Stop after each so the owner can run it on a phone. Before milestone 0, run `git init`
inside this folder and set the commit identity from section 13, because no repository exists here yet.

| # | Milestone | Done when |
| --- | --- | --- |
| 0 | Project, skies, type, fonts, Leaf, CoupletText, font specimen, Valluvar rig with all seven poses, **Drive test app** | Tamil test string renders cleanly in both faces on a real device, Valluvar matches the character sheet and holds 60fps on a mid-range phone, build check proves no INTERNET, and the section 12 Drive test has a written result |
| 1 | Content: kurals.json script, validator, pack loader, picker, 12 sample prompts | Tests pass for validation, stable daily pick, first week and special dates |
| 2 | Shell: splash, onboarding, navigation, DataStore, language switch, sky logic | First-launch flow works and remembers choices, the ground, tint and sun are right at all six periods |
| 3 | Today: leaf band, reveal, leaf turn, feeling link | Matches the canvas in both languages at 360 and 412dp |
| 4 | Write and save: SQLCipher, key manager, autosave, chips, Tamil keyboard help, save moment | An entry survives the app being killed mid-typing, the database file is unreadable without the key, and Tamil typing works with Gboard |
| 5 | Journal: cord list, calendar, search, page, edit, delete with undo, On this day, widgets | Tamil and English search both work. On this day appears only when a page exists. Widgets redraw at midnight and never show journal text |
| 6 | Mood match, share card, the thread, seals | No back-to-back repeat, share image looks right. Thread tests pass for rest days, a third missed day, timezone travel and a restore. Every seal is earned exactly once and survives deleting its page |
| 7 | Reminder, lock, Backup and sync, text export | Reminder survives a reboot. Drive backup restores on a fresh install. Two phones merge with no lost pages, including the same page edited on both |
| 8 | Sources, About, Reviewer, heavy-day row | Owner can review a prompt batch on the phone |
| 9 | Reduced motion, TalkBack, 200 percent scale, icon, Baseline Profile | Checklist below is fully ticked |
| 10 | Play: signed bundle, listing in both languages, Data safety, closed test, production application | App approved for production. Publishing stays the owner's action |

### Milestone 0 result, 9 November

Built in this folder, and git initialised (nothing committed yet):

- Gradle 9.4.1 wrapper, AGP 9.2.1 with built-in Kotlin 2.4.21, Compose BOM 2026.09.00. compileSdk 37,
  because Compose 1.12 requires it; targetSdk 36; minSdk 26.
- The no-network guard: `check<Variant>NoInternet` reads the merged manifest and fails any assemble or bundle
  that asks for INTERNET or ACCESS_NETWORK_STATE. Proven by adding INTERNET on purpose: the build failed.
- `allowBackup` off and cloud backup and device transfer excluded, so the journal leaves only as Kural
  Heart's own file.
- Olai tokens (ivory and Midnight) and the three bundled OFL fonts, as weight and width instances of the
  variable files. Anek Tamil at width 75 for couplets.
- `Leaf` drawn in code (no bitmap) and `CoupletText`, which shrinks both lines together until the longer one
  fits, and only at its smallest size wraps, always between words.
- Valluvar in Compose, generated from the canvas by `tools/valluvar/gen_valluvar.py`: all eleven states,
  eight faces, and every motion from olai.css (breath, head, blink, stylus, walk, confetti, award burst),
  plus still, once, typing and nod. Reduced motion freezes him.
- The adaptive launcher icon with its monochrome layer, from the mark.
- A workbench screen with Leaf, Valluvar, Type and Backup benches.
- Unit tests for the couplet fit and the motion maths: 8 pass.

Checked on an emulator (Pixel 7, Android 16):

- Tamil couplets render cleanly in Anek Tamil condensed. Literata, Noto Serif Tamil and Tamil numerals render.
- Valluvar matches the canvas in every state, in ivory and Midnight.
- At 200 percent font, couplets shrink, then wrap between words, never inside one.
- **Folder backup test:** picked a folder through Android's picker, wrote a file and read it back, restarted
  the app, access was kept, and wrote again. The emulator has no Drive app, so Drive itself is still to be
  tried on a real phone. Nothing in the result depends on Drive beyond its document provider.

Still open for milestone 0:

- 60fps for Valluvar, and cold start, on a real mid-range phone. On the software-rendered emulator a debug
  build starts in about 3.5 seconds whichever bench opens first, so it is the emulator and debug build, not
  the leaf or Valluvar. Measure a release build with a Baseline Profile on the phone.
- The Drive pick on a real phone.
- The workbench's specimen couplets are copied from the canvas prototype into a debug-only asset, marked
  unverified, and never ship. Real couplets arrive with the milestone 1 pack.

### Version 1.0.0, rebuilt in Expo, 9 November

The owner asked for the app to be "like my other apps": the same stack as Prompt Heart and Watch Heart. Every
feature of 0.10.0 was ported screen by screen; the couplet pack, Valluvar's art and motions, the strings and the
backup format carried over unchanged.

- **Updates**: over the air with `eas update` (expo-updates), checked at launch and on every return, with a restart
  prompt and What's new. The GitHub APK self-updater is gone, and with it any need to install packages.
- **Moving pages from 0.10.0**: the Kotlin app sealed its journal with an Android Keystore key the new app can't
  read, and the signing key changed, so: back up in 0.10.0 (Settings, Backup), uninstall it, install 1.0.0, then
  Restore from that backup file. Photos, seals, the day log and saved couplets come across.
- **Background**: the nightly backup and Drive sync run through expo-background-task (Android picks the moment)
  and also when the app opens after a day. Reminders are planned a week ahead each time the app opens; only
  today's names its couplet, since later days' couplets are chosen when those days are opened.
- **Not changed**: permissions (coarse location, camera, biometrics, notifications; storage, media, fine location,
  microphone and the advertising ID are blocked), the Drive app-data folder, the widget, the thread and seals.

### Version 0.10.0, after the owner's review, 9 November

The owner asked for bigger type, a Kural library, richer pages, a profile, filters, audio, better share images, Drive
sync and over-the-air updates, and chose to drop the no-internet promise for Drive, weather and updates.

- **Type**: every size up a step, Tamil a further 8 percent, and a text-size setting (90, 100, 115, 130 percent).
  Couplets are always flush left: on the leaf, in lists, on share images and on the widget.
- **Kural tab** (fifth tab): all 133 chapters under the three books, search by number or Tamil or English words,
  filters (book, saved, written about, not read yet), each couplet's page with Aiyar, Pope's verse and Pope's prose,
  the chapter's question, listen (the phone's text-to-speech, Tamil then English), save, share, and "Make today's
  couplet". Today gains Listen, Another couplet and Choose from the Kural, and shows the chosen English under the leaf.
- **Pope**: Project Madurai e-text 0153 parsed into the pack (verse and prose for all 1,330; broken lines rebuilt by
  script). Modern commentaries stay out (copyright); Parimelazhagar waits for a checked digital text.
- **Pages**: Markdown formatting bar (bold, italic, heading, list, checklist, quote), editable date and time, weather
  (Open-Meteo or picked by hand), place (Android geocoder or typed), photos from the gallery or camera (shrunk and
  sealed with the device key), tags, star. Journal filters: starred, photos, period, feeling, book, tags, order.
- **Profile and look**: name, photo, journal name, stats; four accent colours; English shown (Aiyar, Pope verse, Pope
  prose); today's couplet daily or random.
- **Online**: Google Drive sync to the app-data folder, sealed with the passphrase, nightly and on demand (needs the
  owner's Google Cloud setup, docs/GOOGLE_DRIVE_SETUP.md); update checks against GitHub releases of
  inigo-code/kural-heart (repo not created yet) with download and install, only in website builds; What's new after
  each update. The build's permission check is now an allowlist.
- **Checked on the emulator**: type, library, search, couplet page, writing with live weather and place (Chennai),
  Journal filters, Settings, both share images. Not checked: Drive (no OAuth client yet), the update download (no
  release yet), audio (no Tamil voice on the emulator image), camera.

### Version 0.9.0, the whole app, 9 November

The owner asked for the full app at once, so milestones 1 to 9 were built in one pass instead of one at a time.

- **Couplet pack** (`tools/content/build_pack.py`): all 1,330 couplets from Project Madurai's plain e-text 0001, each
  line voted against e-text 0017 and the tk120404 dataset. 1,306 agree, 12 were settled by vote, and 12 lines where all
  three differ were chosen by hand in `choices.json`. Four mistyped couplet numbers in the source were corrected by
  position. English is Aiyar (1916, Standard Ebooks, CC0). Pope is not in the app yet. `report.md` lists every line
  that needs the owner.
- **Questions**: one per chapter for the 90 pool chapters, plus Mind, Speech and Action lens prompts, in English and
  Tamil. All drafts, marked so on the Sources page.
- **App**: onboarding (language, reminder time, privacy), Today (greeting by the six times of day, leaf with turn to
  Aiyar, three lenses), Write (autosaving draft, feelings, Tamil keyboard help, Valluvar writing), save moment and seal
  award, Journal (list, search, calendar, On this day, page, edit, delete with undo, share text), Journey (thread with
  rest days, 133 chapter beads, nine seals with progress), How is your heart (mood couplets, heavy-days card with no
  invented numbers), share card (post and story images), Settings (language, theme, reduce motion, reminder and time,
  reminders-refused state, app lock, backup, text export, delete everything with typed confirmation, About, Sources),
  backup and restore (passphrase, folder, nightly, merge keeping both versions on conflict), daily reminder with the
  heart-beard glyph, Today widget, Android 12 splash.
- **Storage**: SQLite with each page's text and mood sealed by an Android Keystore AES-GCM key. Backups: PBKDF2
  (210,000 rounds) and AES-GCM, a 520-byte file for one page, unreadable without the passphrase.
- **Checked on the emulator**: onboarding, Today, writing and autosave (a draft survived the emulator crashing), the
  First leaf seal, Journal, search and its empty state, Journey, Settings, Tamil with Midnight, 200 percent font,
  feelings, share, backup, and restore onto a fresh install. 16 unit tests pass. The preview build opens in about a
  second.
- **Not yet checked**: the widget on a home screen, the reminder actually firing, the app lock prompt, nightly backup,
  a Google Drive folder, and anything on a real phone.
- **Still the owner's**: review the 12 chosen lines and the Tamil text, the draft questions, seal names and UI Tamil;
  the Play upload key and listing.

### Canvas additions, 9 November

New boards: onboarding pages 2 and 3, lock, backup, passphrase, restore, sync conflict, calendar, search,
share, About with Heart Apps, Sources and credits, delete everything, notifications refused, heavy days,
largest system font, Tamil-first and Midnight variants of Journal, Write, Journey and Settings, the widgets
redrawn in Olai, a brand board (notification glyph, animated splash, store icon), the 1024 by 500 feature
graphic, and English and Tamil store screenshots. The heavy-days board shows empty lines on purpose: no
helpline number is shown until it comes from a checked list for the reader's country. Since 1.0.6 that list is
`src/lib/helplines.ts` (India, Sri Lanka, Singapore, Malaysia, UK and Ireland, US, Canada, Australia, each checked
against the service's own site), with findahelpline.com for everywhere else.

The content track runs alongside. Chapter approval and the launch pack land in
`assets/prompts/pack_v1.json`, and it can start now.

## 16. Decisions for the owner

| Decision | My default |
| --- | --- |
| Palette | B, Leaf and lamp. Decided by the owner, 8 Nov |
| Illustrator pass on Valluvar before launch | Yes, brief in section 7 |
| Screens in the canvas, now Bundle and Sun with Valluvar | Go ahead as drawn |
| Valluvar's look, white with no marks | Decided by the owner, 8 Nov |
| App icon, the heart-beard mark with the cut-out smile | Built at milestone 0. The notification glyph is now the heart beard too |
| Thread rules, two rest days a week | Go ahead |
| The nine seals and their Tamil names | Needs your eye for the Tamil |
| Tamil wording: tagline, UI text and sample meanings, all drafted by Claude | Needs your eye |
| Chapter table | Approve as is |
| No internet permission | Yes |
| If the Drive test fails | Manual backup and restore, keeping the no-internet promise |
| App id | `com.inigocode.kuralheart`, final once uploaded to Play |
| Couplet font | Anek Tamil condensed. Renders cleanly on the emulator; confirm on your phone |
| Source of record for the Tamil text | Project Madurai, checked against Tamil Wikisource, once Project Madurai's terms are read |
| Heavy-days row | Include |
| Is this a public Heart App? | Assumed yes, since it lives in the Heart Apps folder |

## 17. Kickoff prompt for Claude Code

```text
Read PLAN.md fully, then docs/canvas/project/Main.dc.html, Valluvar.dc.html, Seal.dc.html
and kural.css for exact values, drawings and copy. Build the Android app Kural Heart one milestone at a time, starting
at milestone 0. After each milestone: run the tests, summarise what changed in 5
lines, and stop for my review. Couplets are always exactly two lines. Follow the couplet rule, skies, materials and motion
exactly. Use real Material 3 components for structure. Keep a CLAUDE.md with the
package layout, commands to build and test, and decisions so far. Tamil kural text
comes only from the prompt pack. Never add the INTERNET permission. Never commit
unless asked. Take screenshots from a real device or emulator, not a browser.
```

## 18. Acceptance checklist

- [ ] Every couplet in the pack sets on exactly two lines on every screen, at 100 and 200 percent font scale, at 360 and 412dp
- [ ] Every couplet in the pack is 17sp or larger on 360dp
- [ ] No clipped Tamil anywhere
- [ ] Reveal follows the real words, and is skipped under reduced motion
- [ ] The release APK has no INTERNET permission, and every feature works in airplane mode
- [ ] Today's couplet holds all day and changes at local midnight with the app open
- [ ] An entry survives the app being killed mid-typing
- [ ] Biometric lock re-locks after 30 seconds away
- [ ] A TalkBack user can open, read, write and save, in Tamil and in English
- [ ] Palette B passes contrast on a real device in all six periods, including the tint at the top of Today and the full skies on the moments
- [ ] The bundle grows at the set thresholds and never shows a number
- [ ] Drive backup restores on a fresh install, and a wrong passphrase fails cleanly
- [ ] The backup file is unreadable without the passphrase
- [ ] Two phones merge through Drive, and a page edited on both keeps both versions
- [ ] A phone with Gboard Tamil can write, save and search in Tamil
- [ ] "Kural Heart" appears in Latin letters on every Tamil screen
- [ ] Any support numbers shown were verified just before release
- [ ] Cold start under 1.5 seconds on a mid-range phone, install under 30 MB
- [ ] The bundle meets Play's current target API and 16 KB rules
- [ ] Valluvar never appears on the couplet leaf, Write, Page, the share card or a notification
- [ ] Valluvar carries no religious mark in any pose, icon or store image
- [ ] Every Valluvar pose is a still drawing under reduced motion
- [ ] Two missed days in a week never break the thread, and no screen or notification mentions a broken one
- [ ] The icon reads as a face at 24dp, and the heart beard sits inside the adaptive safe zone
- [ ] No widget ever shows journal text, and with the lock on they show only the kural
- [ ] Dawn is the only accent colour, and red appears only on hearts
- [ ] The thread chip is absent on Today until a page is saved
