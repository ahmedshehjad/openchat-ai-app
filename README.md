# OpenChat AI

A mobile-friendly AI chat interface built with plain HTML, CSS, and JavaScript, plus a server-side API route for OpenAI chat completions.

## Features
- Responsive desktop and Android/mobile layout
- Chat-style interface, prompt suggestions, and conversation context
- OpenChat Demo and GPT-4o model choices
- Secure server-side OpenAI API request: the API key is never embedded in frontend code
- Input validation and friendly provider error messages

## Important: GitHub Pages cannot run the backend
The `api/chat.js` endpoint is a Vercel serverless function. GitHub Pages only serves static files, so the live chat API will not work at the GitHub Pages URL. Deploy this repository to Vercel to run both the frontend and backend together.

## Deploy to Vercel
1. Sign in at https://vercel.com/ and choose **Add New → Project**.
2. Import the GitHub repository `ahmedshehjad/openchat-ai-app`.
3. Keep the project root as the repository root and deploy.
4. In Vercel, open the project **Settings → Environment Variables**.
5. Add `OPENAI_API_KEY` with your secret OpenAI API key. Select the Production environment (and Preview too if you want preview deployments to work). Never add this key to `index.html`, commit it to GitHub, or share it in chat.
6. Redeploy the project after adding the environment variable.
7. Open the Vercel deployment URL and send a test message.

The backend supports `gpt-4o-mini` (used by OpenChat Demo) and `gpt-4o` (GPT-4o option). Claude, Gemini, and Llama are shown as future options but are not connected to their providers yet.

## API
- `POST /api/chat`
- JSON body: `{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}`
- Successful response: `{"reply":"..." }`

The API requires the server-side `OPENAI_API_KEY` environment variable. OpenAI API usage may incur charges and is subject to account limits.

## GitHub Pages
The existing GitHub Pages site can still show the static interface, but it cannot execute `api/chat.js`. Use the Vercel URL for live AI chat.

Repository: https://github.com/ahmedshehjad/openchat-ai-app
