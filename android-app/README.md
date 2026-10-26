# Open AI Chat — Android WebView app

This Android Studio project wraps the live GitHub Pages app:

https://ahmedshehjad.github.io/openchat-ai-app/

## Automatic website updates

The app loads the live website at launch. When the website frontend is updated on GitHub and GitHub Pages finishes publishing, the app normally shows the new version the next time it loads/reloads the site. Website-only changes do not require rebuilding or reinstalling the APK.

The API remains hosted on Render, so backend updates are published by Render's deploy process. Keep API keys in Render environment variables, never in this Android project.

## Build an APK

1. Install Android Studio on a computer.
2. Open the `android-app` folder as a project.
3. Allow Android Studio to sync Gradle and install any requested Android SDK components.
4. Use **Build → Build APK(s)**.
5. Find the APK under `app/build/outputs/apk/debug/`.

This repository does not include a Gradle wrapper, so use a recent Android Studio installation with Gradle support.

## Notes

- Package/application ID: `com.openaichat.app`
- Minimum Android version: Android 6.0 (API 23)
- Supports the website's HTML file upload picker for attaching supported documents/images.
- External HTTPS links open in the browser.
- This is a WebView wrapper, not a Play Store-ready signed release. Create a signed release build before distribution.
- If the website adds browser features unsupported by Android System WebView, those may need extra native Android work.
