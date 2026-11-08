# Kural Heart — Build Plan

Nov 7, 2026 · @Joy

## Vision and principles

Kural Heart is a private, offline-first Android journal that opens each day with one Thirukkural couplet and a question to write from. It is for Tamil and English readers who want a calm, meaningful journaling habit, not another feed.

Tagline: "Journal with Valluvar." Tamil: குறளுடன் நாட்குறிப்பு (kuṟaḷuṭaṉ nāṭkuṟippu), to be confirmed by the owner.

Five principles guide every decision:

1. **Calm first.** One main action per screen. No feeds, no social features, no ads, no streak guilt.
2. **Bilingual by default.** Tamil is a first-class language, not a translation. Every prompt shows Tamil and English; the user picks which leads.
3. **Private by default.** Entries stay on the device. No account, no analytics that read content, optional biometric lock.
4. **Motion with meaning.** Animation explains state (a couplet arriving, an entry being saved, a week filling) and never decorates. It respects the system reduced-motion setting.
5. **Respect for the text.** Couplets appear exactly as the classical text. Meanings and questions are labelled as reflections, not as authoritative translation.

## MVP scope

Version 1 ships a daily couplet, mood-matched couplets, a journal, history with search, and a daily reminder, all working offline on Android 8.0 (API 26) and above, phones in portrait first.

| Area | In v1 | Deferred |
| --- | --- | --- |
| Daily Kural | Couplet of the day in Tamil and English, one reflection question, shareable card | Audio recitation |
| Mood match | 8 moods; pick one and get a couplet from the mood pool | Free-text matching of how the user feels |
| Journal | Text entry tied to a couplet, autosave, edit, delete, mood tag | Photos, voice notes |
| History | Timeline, month calendar with entry dots, search by words | Year in review |
| Reminders | One daily local notification at a chosen time | Smarter timing |
| Privacy | Local storage, biometric lock, encrypted export and import file | Cloud sync |
| Language | Tamil or English as the lead language, switchable anytime | More languages |
| Content | Launch pack of 120 prompts, then monthly content updates | Full 365 and beyond |

Deliberately out of v1: accounts, social features, cloud sync, ads, and any AI generation at runtime. Prompts are curated ahead of time, which keeps the app private, offline and predictable.

## Tech stack and architecture

Build a native Android app in Kotlin with Jetpack Compose, one Gradle module with clean packages, and no backend for user data.

| Concern | Choice | Why |
| --- | --- | --- |
| UI | Jetpack Compose, Material 3 with a fully custom theme | Fine control of type and motion |
| Navigation | Single activity, Navigation Compose, shared element transitions | Today card flows into the Write screen |
| Architecture | MVVM, unidirectional state, repositories, Hilt | Testable and predictable |
| Async | Kotlin Coroutines and Flow | Reactive lists and autosave |
| Entries | Room on SQLite, encrypted with SQLCipher, key held in Android Keystore | Private by default |
| Prompts | JSON asset imported into Room on first launch | Offline and updatable |
| Settings | Jetpack DataStore (Preferences) | Simple key-value state |
| Lock | androidx.biometric with device credential fallback | Optional app lock |
| Reminders | WorkManager plus a notification channel; request POST\_NOTIFICATIONS on Android 13+ | Reliable daily nudge |
| Animation | Compose animation APIs (Animatable, AnimatedContent, SharedTransitionLayout, graphicsLayer), custom Canvas for the heart | Lightweight, no heavy dependency |
| Fonts | Bundled in res/font, open-licensed | Works offline, no flash of fallback |
| Content updates | Static JSON pack fetched over HTTPS, version and checksum verified | New prompts without an app update |
| Quality | JUnit, Turbine, Compose UI tests, Macrobenchmark, Baseline Profiles | Smooth 60 fps start and scroll |

The only network call is the optional content pack fetch. It sends no user data.

Suggested package layout:

```text
app/src/main/java/.../kuralheart/
  core/design/      theme, typography, colour, motion tokens, shared components
  core/data/        Room database, DAOs, DataStore, repositories
  core/model/       Kural, Prompt, Entry, Mood
  content/          prompt pack loader, validator, updater
  feature/onboarding/
  feature/today/
  feature/mood/
  feature/write/
  feature/journal/  timeline, calendar, search, entry detail
  feature/settings/
```

## Content strategy

Claude drafts and cross-checks the content in bulk; the owner approves one chapter table and then reads only a small sample, and the app launches with 120 prompts and grows to 365 over about four months.

**Chapter triage (proposal for the owner to approve).** Of the 133 chapters, 68 are core, 22 are selective and 43 are skipped. Skipped chapters cover royal and military statecraft, spies and diplomacy, ritual or dietary doctrine, gendered framings, the explicitly sensual love chapters, and the opening praise chapters. Chapter numbers follow the standard 1 to 133 order.

| Group | Core (4 to 5 prompts each) | Selective (about 2 each) | Skipped |
| --- | --- | --- | --- |
| Aram, virtue (1 to 38) | 8 to 14, 16 to 25, 30 to 32, 34, 37 (22 chapters) | 4, 5, 7, 29, 36, 38 | 1 to 3, 6, 15, 26 to 28, 33, 35 |
| Porul, wealth (39 to 108) | 40, 42 to 51, 53, 54, 60 to 63, 65 to 68, 76, 79 to 86, 96 to 103 (38 chapters) | 41, 52, 71 to 73, 87 to 89, 94, 95, 104, 105 | 39, 55 to 59, 64, 69, 70, 74, 75, 77, 78, 90 to 93, 106 to 108 |
| Inbam, love (109 to 133) | 113, 115, 116, 120, 121, 127, 131, 133 (8 chapters) | 117, 123, 130, 132 | 109 to 112, 114, 118, 119, 122, 124 to 126, 128, 129 |

About 68 core chapters at 4 to 5 prompts plus 22 selective chapters at 2, plus roughly 15 special-day prompts, gives 365. A prompt may pair two related kurals.

**Pipeline, in order:**

1. **Source text.** Type the 1330 Tamil kurals from the public-domain Project Madurai or Tamil Wikisource text. A script checks 1330 kurals, 133 chapters of 10, and two lines each, and diffs against a second source.
2. **Select.** From core and selective chapters, pick kurals that are universal, can become a question, and stay gentle in tone. Tag each with 1 to 3 of the 8 moods.
3. **Draft.** For each prompt write a plain Tamil meaning, a plain English meaning, and a reflection question in both languages. These are original wording, not copied from any modern commentary.
4. **Cross-check.** Compare each meaning with Parimelazhagar and Manakkudavar (classical commentary), and the Pope (1886) and V.V.S. Aiyar (1916) translations. Assign confidence High, Medium or Low; any disagreement between sources is Low.
5. **Owner review.** The owner reads all Low-confidence prompts plus a random 15 percent of the rest, about 30 prompts for the launch pack, using the debug-only Reviewer mode (see Screens). Approve or flag with a note.
6. **Ship.** Only approved prompts, or High-confidence prompts that passed sampling, go into a versioned pack.

**Release tiers.** Launch pack: 120 prompts, at least 10 per mood. Month 2: plus 120. Month 4: plus 125, reaching 365. The daily couplet is picked by date from a per-user shuffled order so nothing repeats until the list is exhausted, with special-day prompts (Pongal, Tamil New Year, Deepavali, year start and end) keyed to explicit dates in the pack.

**Attribution.** The app has a Sources page crediting the public-domain Tamil text, Pope, Aiyar and the classical commentators, and labels every meaning "Reflection written for Kural Heart". Do not copy any modern commentary (Mu. Varadarajan, Karunanidhi, Salamon Pappaiah and others); it is still in copyright.

## Data model

Prompts live in a versioned JSON pack that is imported into Room; the user's entries live only in the encrypted Room database.

**Prompt pack (JSON).** Values in angle brackets are placeholders; Tamil text must come from the verified source file, never typed by hand.

```json
{
  "packVersion": 1,
  "minAppVersion": 1,
  "checksum": "<sha256 of prompts array>",
  "prompts": [
    {
      "id": "p-0001",
      "kurals": [
        {
          "number": 391,
          "linesTa": ["<line 1>", "<line 2>"],
          "translit": ["<line 1>", "<line 2>"],
          "popeEn": "<public-domain text>",
          "aiyarEn": "<public-domain text>"
        }
      ],
      "chapter": { "number": 40, "nameTa": "<name>", "nameEn": "Learning" },
      "pal": "aram | porul | inbam",
      "meaningTa": "<reflection>",
      "meaningEn": "<reflection>",
      "questionTa": "<question>",
      "questionEn": "<question>",
      "moods": ["driven", "unsure"],
      "tier": 1,
      "confidence": "high | medium | low",
      "review": "approved | flagged | pending",
      "specialDate": "MM-DD or null"
    }
  ]
}
```

A prompt holds one or two kurals. The app rejects a pack whose checksum fails or whose minAppVersion is too high, and keeps the last good pack.

**Moods (8).** Each has an id, a Tamil and an English label, and an accent colour.

| Id | English | Tamil |
| --- | --- | --- |
| grateful | Grateful | நன்றி |
| calm | Calm | அமைதி |
| anxious | Anxious | கவலை |
| angry | Angry | சினம் |
| lonely | Lonely | தனிமை |
| missing | Missing someone | ஏக்கம் |
| driven | Driven | முயற்சி |
| unsure | Seeking clarity | தெளிவு |

**Room tables.**

| Table | Key fields |
| --- | --- |
| prompt | id, chapter, pal, tier, specialDate, packVersion, full JSON blob |
| prompt\_mood | promptId, moodId |
| daily\_pick | dateIso (primary key), promptId; freezes today's couplet |
| entry | id (UUID), createdAt, updatedAt, promptId (nullable), moodId (nullable), text, wordCount |
| saved\_prompt | promptId, savedAt |

**DataStore settings:** leadLanguage (ta or en), themeMode (system, light, dark), reminderEnabled, reminderTime, lockEnabled, shuffleSeed, onboardingDone, motionOverride.

**Search.** Version 1 uses a plain LIKE query over entry text; entries are small and the database is local. SQLite's default FTS tokenizer may split Tamil words at vowel signs, so if full-text search is added later, test with Tamil queries and declare the Tamil vowel signs (U+0BBE to U+0BCD) as extra token characters.

## Design system

The look is warm, quiet and premium: a palm-leaf manuscript feel in cream and indigo, with a serif voice for the couplet and a clean sans for everything else.

**Fonts (all open-licensed, bundled in res/font).**

| Role | Tamil | English / Latin | Size and line height |
| --- | --- | --- | --- |
| Couplet (hero) | Noto Serif Tamil, SemiBold | Fraunces, Medium | 26sp / 1.6 and 24sp / 1.35 |
| Reflection question | Noto Serif Tamil, Medium | Fraunces, Italic | 20sp / 1.6 and 20sp / 1.4 |
| Body and meaning | Anek Tamil, Regular | Inter, Regular | 16sp / 1.7 and 16sp / 1.55 |
| Journal input | Anek Tamil, Regular | Inter, Regular | 17sp / 1.75 |
| Labels and buttons | Anek Tamil, Medium | Inter, Medium | 12 to 14sp |

Compose a font specimen debug screen first, with Noto Serif Tamil and Tiro Tamil side by side, so the owner can pick the couplet face by eye. Test string: குறள் வள்ளுவர் ஔவை க்ஷ ஸ்ரீ கொ கோ கௌ.

Tamil typesetting rules: line height at least 1.6, no letter spacing, no all caps, no synthetic bold or italic (Tamil has no italic), use sp units so system font scale works, and never clip a line to its box height. Latin letter spacing is allowed only on small labels.

**Colour tokens.**

| Token | Light, Morning | Dark, Night |
| --- | --- | --- |
| background | #FBF6EC | #12111C |
| surface | #FFFDF8 | #1B1A29 |
| surfaceVariant | #F3EBDC | #26243A |
| ink | #1E1B2E | #F4EEE2 |
| inkMuted | #5E5A70 | #A9A4B8 |
| primary (kumkum rose) | #B8324F | #E86A85 |
| accent (turmeric gold) | #D9962B | #F0B957 |
| leaf (calm green) | #6E8F6A | #8DB58A |

Follow the system theme by default, with an override in Settings.

**Mood accents** are gradient pairs used on the mood orb and as a soft background wash on Write.

| Mood | Start | End |
| --- | --- | --- |
| grateful | #F0B957 | #E8884B |
| calm | #7FB6A4 | #4E8C86 |
| anxious | #9A8FD6 | #6C63B5 |
| angry | #E5654F | #B53A3A |
| lonely | #6C8CC8 | #3C527F |
| missing | #E58AA5 | #B8506F |
| driven | #8CCB6E | #3E8E5A |
| unsure | #B8B2C9 | #807A99 |

**Shape and surface.** 8dp grid. Cards use 24dp corners, sheets 28dp, buttons are pills. Elevation comes from a soft tinted shadow plus a 1dp hairline, not heavy drop shadows. Cards carry a faint paper grain (about 3 percent noise). The signature element is the palm-leaf strip: the Today card is a wide rounded strip with fine horizontal grain lines and a small cord hole with a thread at the left edge.

**Core components.** CoupletCard, MoodOrb, MoodChip, ReflectionCard, EntryCard, PrimaryButton (pill, mood gradient), LanguageToggle (Tamil and English segments), HeartWeek (seven-day heart progress), BottomBar, SectionHeader, ConfirmSheet.

**Logo and icon.** A heart drawn as two interlocking strokes, echoing the two lines of a couplet. Adaptive icon: gold strokes on deep indigo (#2C2A4A), plus a monochrome variant for themed icons on Android 13 and above.

## Screens and flows

Kural Heart has eight screens plus a debug-only reviewer, with a three-tab bottom bar (Today, Journal, Settings), and the daily loop is open Today, write, save.

| Flow | Path |
| --- | --- |
| First launch | Splash, Onboarding (language, reminder, privacy), Today |
| Daily habit | Reminder notification, Today, Write, Save, Today with the week heart filled |
| Mood match | Today mood orb, Mood match, Write |
| Free write | Journal plus button, Write with no couplet |
| Revisit | Journal, Entry detail, Edit or Delete |
| Find | Journal search, Entry detail |

Global behaviour: the lead language shows first and the other language sits beneath in smaller muted type; tapping a couplet card swaps them with a crossfade. The bottom bar is a floating pill that hides on Write. All touch targets are at least 48dp. Wireframes below use ‹ › for content placeholders.

**1. Splash.** Two-stroke heart draws itself, then the wordmark and tagline fade in. About 1.2 seconds, then Today (or Onboarding on first launch).

```text
┌──────────────────────────────────┐
│                                  │
│                                  │
│        ( two-stroke heart        │
│          draws itself )          │
│                                  │
│           Kural Heart            │
│       Journal with Valluvar      │
│                                  │
└──────────────────────────────────┘
```

**2. Onboarding (3 pages, skippable).** Page 1 chooses the lead language with two large cards. Page 2 sets the daily reminder time with a wheel and asks for notification permission only here. Page 3 states the privacy promise (words stay on this phone) and offers an optional biometric lock. Pages slide with a parallax heart in the background.

```text
┌──────────────────────────────────┐
│                           Skip   │
│                                  │
│  Which language leads?           │
│  ‹Tamil version of the question›  │
│                                  │
│  ╭──────────────╮ ╭──────────────╮  │
│  │  ‹Tamil›    │ │   English    │  │
│  │  leads      │ │   leads      │  │
│  ╰──────────────╯ ╰──────────────╯  │
│                                  │
│            ● ○ ○               │
│        ( Continue )              │
└──────────────────────────────────┘
```

**3. Today (home).** Shows the date, a time-based greeting, the couplet of the day on the palm-leaf strip, the reflection question, a primary Write button, eight mood orbs, and the seven-day heart. The couplet card is the visual centre.

```text
┌──────────────────────────────────┐
│ Sat 7 Nov                [TA|EN] │
│ Good evening                     │
│                                  │
│ ╭──────────────────────────────╮ │
│ │ o─  Kural 391 · Learning     │ │
│ │                              │ │
│ │  ‹Tamil line 1›                │ │
│ │  ‹Tamil line 2›                │ │
│ │  ────────                    │ │
│ │  ‹English meaning›             │ │
│ ╰──────────────────────────────╯ │
│                                  │
│ Today's question                 │
│ ‹Reflection question›            │
│                                  │
│   ( Write about this  ♡ )        │
│                                  │
│ How are you feeling?             │
│ (◐)(◐)(◐)(◐)(◐)(◐)(◐)(◐)  →     │
│                                  │
│ This week   ♥ ♥ ♥ ○ ○ ○ ○      │
│                                  │
│   Today     Journal    Settings  │
└──────────────────────────────────┘
```

**4. Mood match.** Tapping a mood orb expands it into a full-screen gradient wash in that mood's colours. A couplet from the mood pool appears with its meaning and question. Two actions: Write about this, and Show another couplet (never repeats the same one twice in a row).

```text
┌──────────────────────────────────┐
│ ✕                        Anxious │
│ ~~~~ mood gradient wash ~~~~~~~~ │
│                                  │
│ ╭──────────────────────────────╮ │
│ │  ‹Tamil line 1›                │ │
│ │  ‹Tamil line 2›                │ │
│ │  ‹English meaning›             │ │
│ ╰──────────────────────────────╯ │
│ ‹Reflection question›            │
│                                  │
│   ( Write about this )           │
│        ↻ Show another            │
└──────────────────────────────────┘
```

**5. Write.** A distraction-free page with a soft wash in the chosen mood colour. The couplet card collapses to a one-line pill when the keyboard opens and can be tapped to expand. Text autosaves every 2 seconds as a draft. Mood chips sit above the keyboard. Save plays the seal animation, then returns to Today.

```text
┌──────────────────────────────────┐
│ ←                    Draft saved │
│ ╭──────────────────────────────╮ │
│ │ Kural 391 · ‹first words›  ⌄  │ │
│ ╰──────────────────────────────╯ │
│ ‹Reflection question›            │
│ ────────────────────────────────── │
│ |                                │
│   (cursor, writing area)         │
│                                  │
│ (◐ Calm)(◐ Driven)(◐ Unsure)  →  │
│ [ Save entry ♡ ]        42 words  │
│ ┌ keyboard ───────────────────────┐ │
└──────────────────────────────────┘
```

**6. Journal.** A timeline of entries grouped by day, with a month strip on top and a list or calendar toggle. Search opens from the magnifier. A floating plus button starts a free write.

```text
┌──────────────────────────────────┐
│ Journal         [search][list|cal]│
│ November 2026                    │
│ M  T  W  T  F  S  S              │
│ ·  ●  ·  ●  ●  ·  ·              │
│                                  │
│ Today                            │
│ ╭──────────────────────────────╮ │
│ │ Learning · 391       ◐ Driven │ │
│ │ ‹First lines of the entry›      │ │
│ │ 9:42 pm                      │ │
│ ╰──────────────────────────────╯ │
│ Yesterday                        │
│ ╭─ ‹another entry card› ───────╮ │
│                           ( + )  │
│   Today     Journal    Settings  │
└──────────────────────────────────┘
```

**7. Entry detail.** Shows the date, mood chip, the couplet it was written for (collapsed, tap to expand), and the full text in the reading font. Actions: Edit, Share as text, Delete (with a confirm sheet). Edit reuses the Write screen.

**8. Settings.** Lead language, theme (system, light, dark), daily reminder on or off and time, app lock, encrypted backup (export and import a file), Sources and credits, About, Delete all data (with a typed confirmation). In debug builds only: Reviewer mode and Font specimen.

**Share card.** From Today or Mood match, a Share action renders the couplet and its meaning as a 1080 by 1350 image on the palm-leaf background with the wordmark, then opens the Android share sheet.

**Reviewer mode (debug builds only).** Used by the owner to approve content in a few minutes a week. Shows one prompt at a time with Tamil couplet, both meanings, both questions, the confidence level and the source notes. Swipe right to approve, swipe left to flag with a short note. Reviews are stored locally and exported as a JSON file the owner can share back.

```text
┌──────────────────────────────────┐
│ Review  12 / 31     [Low conf.]  │
│ ╭──────────────────────────────╮ │
│ │ ‹Tamil couplet›                │ │
│ │ Meaning TA / EN              │ │
│ │ Question TA / EN             │ │
│ │ Sources: Pope · Aiyar · notes  │ │
│ ╰──────────────────────────────╯ │
│ ✕ Flag + note        ✓ Approve    │
└──────────────────────────────────┘
```

**Empty and edge states.** Journal with no entries shows a palm-leaf illustration and the line "Your first page is waiting" in the lead language. If the daily pack is exhausted, the app cycles with a fresh shuffle. If the device language is neither Tamil nor English, default to English.

## Animation and haptics

Every animation explains a change of state, runs on transform and alpha only so it stays at 60 fps on mid-range phones, and switches to near-instant when reduced motion is on.

**Motion tokens.** Short 150 ms, medium 300 ms, long 500 ms. Easing: standard (0.2, 0, 0, 1), emphasized decelerate (0.05, 0.7, 0.1, 1) for things arriving, emphasized accelerate (0.3, 0, 0.8, 0.15) for things leaving. Springs use damping ratio 0.8 and medium stiffness.

| Moment | Trigger | Spec |
| --- | --- | --- |
| Splash heart | App start | Two strokes draw in 900 ms (path trim 0 to 1), a 250 ms fill pulse, then wordmark fades and rises over 400 ms after a 600 ms delay |
| Couplet reveal | Today opens | Words appear one by one: alpha 0 to 1, rise 12dp, blur 6dp to 0, 450 ms each, 60 ms apart. Line 1 reveals 4 words, pauses 120 ms, line 2 reveals 3 (the 4+3 rhythm of a kural). The meaning fades in 300 ms after. Blur needs Android 12 or above; older versions use alpha and rise only |
| Language swap | Tap couplet card | Crossfade 220 ms with a 4dp vertical slide |
| Mood orbs, idle | Today visible | Each orb floats up and down 3dp on a 3 to 4 second sine loop, phases offset so they never move together |
| Mood orb press | Tap | Scale to 0.94 on press, then the orb expands to a full-screen gradient wash in 450 ms (shared element, emphasized decelerate), light haptic |
| Mood couplet | Mood match opens | Card fades in and scales from 0.96 over 350 ms |
| Card to Write | Tap Write | Couplet card is a shared element that morphs into the Write header over 400 ms |
| Card collapse | Keyboard opens | Couplet card collapses to a one-line pill with a spring, about 250 ms |
| Mood wash | Mood chip selected | Background wash crossfades to the new gradient over 500 ms |
| Save seal | Tap Save | Button morphs into a circle, a heart stroke draws in 400 ms, a ring ripples outward over 500 ms, confirm haptic, screen exits in 300 ms |
| Week heart | Back on Today after save | Today's heart fills like liquid from the bottom over 700 ms with a gentle wave on the surface, then pulses once (scale 1 to 1.12 to 1 over 400 ms) |
| List entry | Journal opens | Cards rise 16dp and fade in, 40 ms stagger, only the first 8 animate |
| Delete | Confirm delete | Card shrinks and fades over 250 ms, items below slide up |
| Tab change | Bottom bar tap | Fade-through, 200 ms |
| Onboarding | Page swipe | Background heart moves at half the swipe speed (parallax); page dots morph between sizes |

**Haptics.** Light tick on mood selection and on tab change; confirm haptic on Save; nothing while typing.

**Reduced motion.** If the system animator duration scale is 0, or the user turns on Reduce motion in Settings, remove idle floating, stagger, blur, parallax and liquid fill; replace the rest with a 100 ms crossfade. Content must never depend on an animation finishing.

**Budget.** No animation longer than 700 ms except the splash. Animate with graphicsLayer or Animatable values read in the draw phase, not by recomposing. Add a Baseline Profile and a Macrobenchmark for cold start and the Today screen scroll.

## Privacy, security, notifications and accessibility

Journal text never leaves the device, and the app must be provably quiet about it.

**Privacy and security**

- Request the INTERNET permission only for the content pack fetch. Include no analytics or ad SDKs. If crash reporting is added later, it must never include entry text.
- Encrypt the Room database with SQLCipher; keep the key wrapped by Android Keystore.
- Turn off Android cloud backup and device transfer of the database (allowBackup false plus data extraction rules). Offer the app's own export instead: a file encrypted with AES-GCM using a key derived from a user passphrase.
- App lock uses BiometricPrompt with device credential fallback and re-locks after 30 seconds in the background. When lock is on, set FLAG\_SECURE on Write, Journal and Entry detail, and hide content in the recents preview.
- Delete all data wipes the database, DataStore and Keystore key.
- Host a plain privacy policy page and complete the Play Data safety form as "no data collected".

**Notifications**

- One channel, "Daily couplet". Title: Today's Kural. Body: the reflection question in the lead language. Tapping deep-links to Today.
- Ask for POST\_NOTIFICATIONS only in onboarding page 2, never on launch.
- No guilt copy and no streak warnings. If the user ignores 7 days in a row, stop sending until they open the app.
- Never put journal text in a notification.

**Accessibility and localisation**

- Full UI strings in Tamil (values-ta) and English. Support font scale up to 200 percent without clipping Tamil.
- Text contrast at least 4.5 to 1 in both themes; mood is always shown with a text label, never colour alone.
- TalkBack labels on every control and orb; set the language tag on Tamil text so screen readers pick the right voice.
- Touch targets at least 48dp.

**Performance targets**

- Cold start under 1.5 seconds on a mid-range phone, with the splash animation not blocking first content.
- Install size under 30 MB including fonts.
- Smooth scrolling on a 2 GB RAM low-end test device.

## Build milestones and acceptance

Build in ten milestones, one at a time, stopping after each so the owner can run it on a phone before the next begins.

| # | Milestone | Done when |
| --- | --- | --- |
| 0 | Project setup, theme tokens, fonts, font specimen screen | App runs; the Tamil test string renders cleanly in both couplet font options |
| 1 | Content foundation: pack loader, validator, Room schema, 12 sample prompts | Unit tests pass for checksum, import and a daily pick that is stable for a given date |
| 2 | Shell: splash, onboarding, bottom bar, DataStore, language toggle | First-launch flow works end to end and remembers choices |
| 3 | Today screen: couplet card, word-by-word reveal, question, mood orbs, week heart | Matches the Today wireframe in both languages |
| 4 | Write and save: autosave drafts, mood chips, save seal, shared element from Today | An entry survives the app being killed mid-typing |
| 5 | Journal: timeline, calendar, LIKE search, entry detail, edit, delete | Tamil and English search both find entries |
| 6 | Mood match and share card | Another couplet never repeats back to back; the share image looks right |
| 7 | Reminders, app lock, SQLCipher, encrypted export and import | Backup from one install restores on a fresh install |
| 8 | Reviewer mode, content pack update fetch, Sources page | Pack with a bad checksum is rejected and the old pack stays |
| 9 | Polish: reduced motion, accessibility pass, Baseline Profile, icon, internal test release | Acceptance checklist below is fully ticked |

The content track runs in parallel in chat with Claude: chapter approval and the 120-prompt launch pack are ready to drop in as assets/prompts/pack\_v1.json by milestone 1.

**Decisions needed from the owner before milestone 0**

- Package name (suggested: app.kuralheart).
- Approve the chapter table in Content strategy, or mark changes.
- Confirm the Tamil tagline wording.
- Pick the couplet font from the specimen screen once milestone 0 is running.

**Kickoff prompt for Claude Code**

```text
Read PLAN.md fully. Build the Android app Kural Heart one milestone at a time,
starting at milestone 0. After each milestone: run the tests, summarise what
changed in 5 lines, and stop for my review. Follow the design system, screen
wireframes and animation spec exactly. Keep a CLAUDE.md with the package
layout, commands to build and test, and decisions made so far. Never put
Tamil kural text in code by hand; it comes only from the prompt pack.
```

**Acceptance checklist**

- [ ] Tamil text shows with no clipped vowel signs at 100 and 200 percent font scale
- [ ] Couplet reveal plays in the 4+3 rhythm and is skipped under reduced motion
- [ ] In airplane mode every feature works except the content update
- [ ] Today's couplet is the same all day and changes at local midnight
- [ ] Biometric lock re-locks after 30 seconds in the background
- [ ] No network traffic other than the content pack fetch
- [ ] Cold start is under 1.5 seconds on a mid-range phone
- [ ] A TalkBack user can complete the daily loop: open, read, write, save
- [ ] Install size is under 30 MB
