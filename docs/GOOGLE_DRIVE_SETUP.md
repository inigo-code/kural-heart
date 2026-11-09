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
   - SHA-1 of this computer's debug key (debug and preview builds):
     `97:BD:7F:3D:6B:EA:72:53:52:22:70:F1:CC:7C:D3:47:1D:07:39:25`
   - Later, the SHA-1 of the Play app signing key (Play Console › Test and release › App integrity) and of your upload key.

No client ID goes into the app's code: Android matches the app by its package name and signing key.

To print the fingerprints again: `./gradlew signingReport`.
