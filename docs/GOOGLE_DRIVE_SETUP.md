# Google Drive sync: one-time setup

Kural Heart syncs through the Drive API's `drive.appdata` scope (a hidden folder that only Kural Heart can open). Google only lets an app ask for that once the app is registered in a Google Cloud project. These steps are the owner's: they need your Google account, and nothing here is secret.

Until this is done, turning on Drive sync in the app says: "Google sign-in isn't set up for this copy of the app yet."

## Steps

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project, for example **Kural Heart**.
2. **APIs & Services › Library**: enable **Google Drive API**.
3. **Google Auth Platform › Branding** (the OAuth consent screen): app name **Kural Heart**, support email **inigo@tosstheworld.org**, the app's privacy policy URL once the site exists. User type **External**.
4. **Data access**: add the scope `https://www.googleapis.com/auth/drive.appdata`. It is a non-sensitive scope, so Google doesn't need to verify the app for it.
5. **Audience**: while testing, add your Google account as a test user. Publish the app when it goes to Play.
6. **Clients › Create client › Android**, once for each signing key:
   - Package name: `com.inigocode.kuralheart`
   - SHA-1 of the key that signs local builds (`android/app/debug.keystore`, which `npx expo prebuild` writes; it is
     React Native's shared debug key, so it is fine for testing only):
     `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - The SHA-1 of the EAS build key: `npx eas-cli credentials -p android` shows it (after the first EAS build).
   - Later, the SHA-1 of the Play app signing key (Play Console › Test and release › App integrity).

No client ID goes into the app's code: Android matches the app by its package name and signing key.

To print a local key's fingerprint again: `keytool -list -v -keystore android/app/debug.keystore -storepass android`.

The 0.10.0 Kotlin builds used this computer's own debug key (SHA-1 `97:BD:7F:3D:6B:EA:72:53:52:22:70:F1:CC:7C:D3:47:1D:07:39:25`); that client can be deleted once nobody runs 0.10.0.
