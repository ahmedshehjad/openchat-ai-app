# Open AI Chat

A mobile-first, Bengali-friendly AI chat web app with a Node.js API backend and an Android WebView wrapper.

## Live services

- Web app: https://ahmedshehjad.github.io/openchat-ai-app/
- API service: https://openchat-ai-app-1.onrender.com
- Source repository: https://github.com/ahmedshehjad/openchat-ai-app

The static frontend is published by GitHub Pages. The Node.js API runs on Render and deploys automatically from the `main` branch.

## Current features

- Responsive mobile and desktop interface branded **Open AI Chat**
- Separate desktop and mobile background photos with reduced opacity:
  - `background-desktop.jpg.jpg`
  - `background-mobile.jpg.jpg`
- Model selector defaults to **Nemotron 3 Ultra (Free)** for advanced reasoning; **OpenRouter Free (Auto)** remains available as a fallback option, alongside **Flint Coding (Free)**, **North Mini Code (Free)**, and **Nemotron 3.5 Super VL (Free)** for image/PDF understanding
- Keeps the latest 20 chat messages as context in the current page session
- Supports image/PDF attachments and text-based TXT, MD, CSV and JSON files, subject to app size limits and provider capabilities
- Image generation and reference-photo editing are temporarily disabled after removing AI Horde because it repeatedly produced inaccurate results. They will be re-enabled only after a suitable no-billing alternative is tested.
- Web Research uses a free DuckDuckGo HTML search flow and cites returned source URLs; it can be rate-limited or temporarily unavailable
- Video Summary summarizes pasted transcripts/subtitles/notes; direct YouTube transcript extraction is not included in the free backend
- Progressive Web App metadata and a dedicated Android WebView app icon
- Android app loads the live GitHub Pages website, so website changes normally appear on the next app reload without reinstalling the APK

## Required provider setup

The listed chat models are free-model routes, but **OpenRouter still requires an API key**. Set `OPENROUTER_API_KEY` in Render → `openchat-ai-app-1` → Environment. Keep the key only in Render environment variables; never put it in browser code or commit it to GitHub.

Free model routes can change, be rate-limited, or become temporarily unavailable. Image generation and reference-photo editing are currently disabled while a more reliable no-billing provider is evaluated. DuckDuckGo HTML search can also be throttled. These services are not guaranteed to be continuously available.

## API

- `POST /api/chat` — sends a chat request
- `GET /api/health` — reports service/provider-key configuration status
- `GET /api/chat` — returns `405 Method Not Allowed`; chat requests must use POST

## Android APK

The Android project is in `android-app/`. The GitHub Actions workflow builds a debug APK and uploads it as the `open-ai-chat-debug-apk` artifact. The APK is intended for testing/sideloading, not a signed Play Store release.

Workflow: https://github.com/ahmedshehjad/openchat-ai-app/actions/workflows/android-apk.yml

## Limitations

- Chat history is kept in the current browser session; there is no server-side user account/history database.
- Provider-dependent features need a valid configured provider key and a live provider endpoint.
- The debug APK is not a Play Store-ready signed release.
