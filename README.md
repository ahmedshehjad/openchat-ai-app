# OpenChat AI

A mobile-friendly AI chat interface built with plain HTML, CSS, and JavaScript, plus a server-side API route for Google Gemini chat completions.

## Features
- Responsive desktop and Android/mobile layout
- Chat-style interface, prompt suggestions, and conversation context
- OpenChat Demo and GPT-4o model choices
- Secure server-side Gemini API request: the API key is never embedded in frontend code
- Input validation and friendly provider error messages

## Deploy on Render
The repository includes `server.js` and `package.json` for a Node.js web service. GitHub Pages serves only static files and cannot run the chat API, so use the Render deployment URL for live AI chat.

1. Create a **Web Service** in Render and connect `ahmedshehjad/openchat-ai-app`.
2. Set **Branch** to `main` and leave **Root Directory** blank.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Choose the Free instance if you want to start without a monthly hosting charge; it may spin down after inactivity.
5. Under **Environment Variables**, add `GEMINI_API_KEY` with your secret Google AI Studio API key. Never add this key to `index.html`, commit it to GitHub, or share it in chat.
6. Deploy or redeploy the service after setting the environment variable.
7. Open the Render service URL and send a test message.

The backend supports `gemini-2.5-flash` (used by OpenChat Demo) and `gpt-4o` (GPT-4o option). Claude, Gemini, and Llama are shown as future options but are not connected to their providers yet.

## API
- `POST /api/chat`
- JSON body: `{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"Hello"}]}`
- Successful response: `{"reply":"..." }`

The API requires the server-side `GEMINI_API_KEY` environment variable. Gemini API usage may incur charges and is subject to account limits.

## GitHub Pages
The existing GitHub Pages site can still show the static interface, but it cannot execute `api/chat.js`. Use the Render URL for live AI chat.

Repository: https://github.com/ahmedshehjad/openchat-ai-app
