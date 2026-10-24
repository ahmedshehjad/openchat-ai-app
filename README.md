# OpenChat AI

A mobile-friendly AI chat interface built with plain HTML, CSS, and JavaScript.

## Current features
- Responsive desktop and Android/mobile layout
- Chat-style message interface and prompt suggestions
- Model selector UI (OpenChat Demo, GPT-4o, Claude, Gemini, Llama)
- Keyboard-friendly input and accessible labels
- Model menu uses native vertical scrolling without custom swipe-to-dismiss behavior

## Important: AI provider is not connected yet
This repository currently contains the frontend only. Messages are shown in demo mode; selecting a provider model does not call a real AI service.

To enable live AI responses, add a server-side backend that calls your chosen provider. Keep API keys in server-side environment variables—never put secrets in `index.html`.

## Publish with GitHub Pages
1. Open **Settings** for this repository.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/(root)**, then save.
5. Wait for the Pages deployment to finish. GitHub will display the published URL in the Pages section.

Repository: https://github.com/ahmedshehjad/openchat-ai-app
