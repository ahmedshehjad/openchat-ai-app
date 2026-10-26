# Open AI Chat

A responsive Bengali-friendly AI chat interface with a Node.js API backend.

## Current features

- Mobile and desktop layouts with separate background image paths:
  - `background-mobile.jpg.jpg`
  - `background-desktop.jpg.jpg`
- Chat context for the latest 20 messages
- Model selector for Gemini Flash and OpenRouter free models
- Image/PDF attachments for Gemini (up to 5 files, 8 MB per file, 10 MB combined)
- TXT, MD, CSV and JSON file text is added to the prompt (text is limited before sending)
- Image-generation mode using Gemini image models, when the Google API key/account has access
- Server-side API keys; secrets must never be put in `index.html` or committed to GitHub
- GitHub Pages frontend routed to the Render API service

## Deployment

The GitHub Pages site serves the static interface. It cannot run the Node.js API itself. The API runs on Render.

- Repository: `ahmedshehjad/openchat-ai-app`
- Frontend: https://ahmedshehjad.github.io/openchat-ai-app/
- Primary API service: https://openchat-ai-app-1.onrender.com
- Secondary API service: https://openchat-ai-app.onrender.com

Render service settings currently use branch `main`, build command `npm install`, and start command `npm start`.

## Environment variables

Set the relevant key in Render → service → Environment:

- `GEMINI_API_KEY` — Gemini chat, image/PDF analysis, and image generation where enabled
- `OPENROUTER_API_KEY` — OpenRouter free-model routing and the listed OpenRouter models

The app reports a clear error if a selected provider's key is missing. Do not send API keys in chat or expose them in browser code. Free providers may impose rate limits or change availability; model access depends on the provider account and current endpoint availability.

## API

- `POST /api/chat`
- Request JSON includes `model`, `messages`, and optional `attachments`.
- `GET /api/chat` returns `405 Method Not Allowed`; chat requests must use POST.

## Notes

- This is a web app/PWA-style frontend, not a compiled native Android application.
- Conversation history is held in the current page session and is not persisted as a server-side account history.
- Browser-side upload handling is implemented, but it still requires a live test with a real file and a configured provider key to confirm end-to-end behavior.
