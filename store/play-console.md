# Kural Heart on Google Play

How to get Kural Heart from a bundle to a public release, and the answers for every Play Console form, based on
what the app actually does. If the app changes (new data, a new library, ads), update these answers and the
[privacy policy](https://inigo-code.github.io/kural-heart-site/privacy.html) together.

## Before you start

- **The bundle:** `dist/kuralheart-1.0.3-play.aab` (versionCode 5, update channel `production`, signed with the EAS
  key). `dist/` isn't in git; keep a copy of every bundle you upload.
- **Package name:** `com.inigocode.kuralheart`. It is permanent once uploaded.
- **New personal developer accounts must run a closed test first**, for every new app: at least **12 testers** opted
  in for **14 days in a row** before Play lets you apply for production. Start the closed test as early as you can;
  the 14 days are the slow part.
- **Signing:** the EAS key is the **upload key**. Let Play create and keep the **app signing key** (Play App Signing,
  the default), as for Prompt Heart. Two things follow:
  - Phones that installed the GitHub APK can't update to the Play version (or back) without uninstalling, because
    Play signs with its own key. Tell testers to back up first (Settings → Backup), uninstall, install from Play,
    then restore.
  - Google Drive sign-in needs the Play key's SHA-1 too (step 9 below).
- **Version codes:** every upload to Play needs a higher versionCode than the last. GitHub APKs and Play bundles share
  one sequence (1.0.3 APK is 4, this bundle is 5). Before the next `eas build`, run
  `npx eas-cli build:version:set -p android` and set it to 5, so EAS carries on from here.
- **Over-the-air updates:** Play builds listen on the `production` channel, GitHub APKs on `preview`. Publish every
  `eas update` to both, after checking the runtime fingerprint (local builds have their own; see the Prompt Heart
  notes). Every update needs a new What's new entry.

## Step by step

### 1. Create the app

Play Console → **Home → Create app**.
- App name: **Kural Heart: Thirukkural Diary**
- Default language: **English (India) – en-IN**
- App or game: **App**. Free or paid: **Free** (this can't be changed to paid later).
- Tick the declarations (Developer Program Policies, US export laws) and **Create app**.

### 2. Set up the app (Dashboard → "Set up your app")

Fill each task with the answers in **App content answers** below: privacy policy, app access, ads, content rating,
target audience, news, data safety, government apps, financial features, health. Then the store settings: category
**Books & Reference**, email `inigo@tosstheworld.org`, website.

### 3. Store listing

Grow users → Store presence → **Main store listing**: paste from `store/listing.md` and upload the graphics in
`store/graphics/` (icon, feature graphic, the six phone screenshots).

### 4. Internal testing (a few minutes, for you)

Test and release → Testing → **Internal testing** → Create new release.
- When asked about app signing, choose **Use Google-generated key** (Play App Signing). Continue.
- Upload `dist/kuralheart-1.0.3-play.aab`. Release name: `1.0.3 (5)`. Release notes: from `store/listing.md`.
- **Testers** tab: create an email list with your own Google account, save, and copy the **opt-in link**.
- Save → Review release → **Start rollout to Internal testing**.
- On your phone, open the opt-in link, accept, then install from Play. (Uninstall the GitHub APK first, after a
  backup.) Check: today's couplet, Listen, writing a page with a photo and a voice note, Backup to a folder, and
  Google Drive sync (after step 9).

Internal testing doesn't count towards the 12-tester requirement; it's only your quick check.

### 5. Closed testing (12 testers, 14 days)

Testing → **Closed testing** → the default track (or **Create track**) → Create new release → **Add from library**
(the same bundle) → roll out.
- **Countries:** India, plus wherever your testers are.
- **Testers:** an email list of at least 12 Google accounts (friends, family), or a Google Group. Send them the
  opt-in link; each must tap **Become a tester** and install the app. Ask them to keep it installed and open it now
  and then: Google looks for real use and asks about it later.
- The first closed release goes to Google's review (usually a day or two, sometimes up to a week).

### 6. Apply for production

After 14 days with 12 or more testers opted in, Dashboard shows **Apply for production**. The form asks how you ran
the test, what feedback you got and what you changed, and why the app is ready. Plain, honest answers work: the
testers used the daily couplet, journal, backups and sharing; fixes made (for example the leaf, light-mode colours
and voices in 1.0.3); who it's for (readers of the Thirukkural who want a private daily practice). Review takes up
to about a week.

### 7. Production release

Test and release → **Production** → Countries/regions: add the countries (all, or start with India) → Create new
release → **Add from library** (the tested bundle, or a newer one) → release notes → **Review release** →
**Start rollout**. A staged rollout (for example 20%) lets you watch Android vitals before everyone gets it; raise it
to 100% from the same page.

### 8. Later updates

- JavaScript-only changes: `eas update` to both channels (`production` and `preview`), with a new What's new entry.
- Anything native (a new library, an app.json plugin change): a new bundle with a higher versionCode, uploaded to
  closed testing or straight to production. After EAS builds return (1 December), `npx eas-cli build -p android
  --profile production` makes the bundle; or build locally as this one was (`CLAUDE.md`, with
  `:app:bundleRelease` and channel `production`).
- Keep the GitHub APK and the site in step, as now.

### 9. Google Drive sign-in for Play installs

After the first upload: Test and release → Setup → **App integrity** → App signing → copy the **App signing key
certificate SHA-1**. In Google Cloud Console → Google Auth Platform → Clients → **Create client → Android**: package
`com.inigocode.kuralheart` and that SHA-1. Keep the EAS-key client too (it serves the GitHub APKs). Until this
exists, Drive sign-in in the Play version fails with `DEVELOPER_ERROR`. Add the SHA-1 to `docs/GOOGLE_DRIVE_SETUP.md`.

If the OAuth consent screen is still in **Testing**, only its listed test users can sign in to Drive: add your
closed testers there, or publish the consent screen (the `drive.appdata` scope isn't a sensitive scope, so it
doesn't need Google's verification).

## App content answers

### Privacy policy

https://inigo-code.github.io/kural-heart-site/privacy.html

### App access

**All functionality is available without any special access.** There is no account. The App lock is off unless
the person turns it on, and Google Drive sync uses the reviewer's own Google account.

### Ads

**No**, the app doesn't contain ads.

### Content rating

Category: **Reference, News, or Educational** (or "All other app types" if that is what's offered).
- Violence, fear, sexuality, language, controlled substances, gambling: **No**. (Chapter 94 of the Kural is about
  gambling, as moral teaching; it isn't gambling content.)
- Can users interact or exchange content with other users in the app? **No** (sharing goes out through Android's
  share sheet only)
- Does the app share the user's location with other users? **No**
- Digital purchases: **No**. Web browser or search engine: **No**.

Expected rating: Everyone / PEGI 3 / 3+.

### Target audience and content

- Age groups: **13–15, 16–17 and 18+**. Don't select any group under 13 (that brings in the Families policy; the
  privacy policy says the app isn't made for children under 13).
- Could the app unintentionally appeal to children? **No**.

### News, government, financial features, health

**No** to all. (It isn't a health app: feelings in the journal are personal notes.)

### Data safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS throughout).
**Do you provide a way for users to request that their data is deleted?** Yes: in the app, Settings → Delete all
data, and Backup → Delete the copy in Drive.
**Account creation:** the app doesn't let users create an account.

For each type below: **Shared: no** (Google Drive, Open-Meteo, Android's geocoder and Expo act for the user or as
service providers, which Google doesn't count as sharing).

| Data type (Play's category) | Collected | Optional? | Processed ephemerally? | Purposes |
|---|---|---|---|---|
| Location → Approximate location | Yes: only when the person adds a place or weather; rounded position to Open-Meteo, coordinates to Android's geocoder | Optional | Yes | App functionality |
| App activity → Other user-generated content (the journal) | Yes: only with Drive sync on, inside the passphrase-locked backup in the person's own Drive | Optional | No | App functionality (backup) |
| Photos and videos → Photos, Videos | Yes: as above, inside the locked backup | Optional | No | App functionality (backup) |
| Audio → Voice or sound recordings | Yes: voice notes, as above, inside the locked backup | Optional | No | App functionality (backup) |
| Device or other IDs | Yes: Expo's update service receives a random installation ID with each update check (can be turned off in Settings) | Optional | No | App functionality |

Not collected: name, email address (Google sign-in shows the account on the phone; it isn't sent anywhere), contacts,
messages, financial, health, files and docs, calendar, web history, app interactions, crash logs, diagnostics.

Why the journal is listed even though no one but the person can read it: it leaves the phone (to their Drive) when
sync is on, and Google's form counts data that leaves the device. Listing it is the safe reading. Everything in it
is encrypted with a passphrase only the person knows.

### Permissions and declarations

No special declarations should be needed:
- **Location:** approximate (coarse) only, in the foreground, when the person asks. No background location.
- **Camera, microphone:** only for a photo, a video or a voice note the person takes.
- **Photos and videos:** chosen with Android's photo picker; the broad media permissions are blocked in `app.json`.
- **Foreground services:** background audio playback is switched off (`enableBackgroundPlayback: false` for
  expo-audio), so there is no media-playback foreground service to declare. WorkManager and the widget add plain
  `FOREGROUND_SERVICE`, `WAKE_LOCK` and `RECEIVE_BOOT_COMPLETED` for the nightly backup and the widget. If Play asks
  about a foreground service anyway, answer: "Short background task for the nightly encrypted backup and the
  home-screen widget; no location or media in the background."
- **Biometric:** for the optional App lock; Android checks it and tells the app only whether it matched.
- **Notifications:** for the daily couplet reminder.
