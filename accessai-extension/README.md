# AccessAI Chrome Extension (Production Edition)

A high-performance, accessible Chrome Extension that enables users to select text on any website and instantly access AI-powered simplification, explanation, summarization, 90+ language translation, and a voice-enabled page assistant ("Ask This Page").

Connected directly to the production AccessAI backend deployed on Render (`https://accessai-backend-lx57.onrender.com`) and frontend on Vercel (`https://accessai-frontend.vercel.app`).

---

## 📁 Project Structure

```
accessai-extension/
├── manifest.json     → Manifest V3 production configuration
├── config.js         → Centralized API endpoints, timeouts, and storage keys
├── background.js     → Event-driven MV3 service worker (API gateway, auth, storage)
├── content.js        → Isolated content script (selection detection, floating trigger, popup)
├── styles.css        → Self-contained scoped styles with dark-warm theme & animations
├── popup.html        → Extension toolbar action UI
├── popup.css         → Toolbar action popup stylesheet
├── popup.js          → Toolbar action popup logic
├── icons/
│   ├── icon16.png    → 16x16 icon for favicon & toolbar
│   ├── icon48.png    → 48x48 icon for extensions management
│   └── icon128.png   → 128x128 high-res icon for Chrome Web Store
└── README.md         → Extension documentation & Chrome Web Store submission guide
```

---

## 🚀 How to Test Locally in Chrome

1. Open Chrome and navigate to: `chrome://extensions`
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **"Load unpacked"**.
4. Select the `accessai-extension` folder.
5. The extension is now loaded and ready.

---

## 🎯 Features

1. **Text Selection Trigger**: Select any text on any webpage to reveal the floating AccessAI trigger.
2. **AI Text Tools**:
   - **Simplify**: Transforms dense or technical language into friendly, easy-to-read sentences.
   - **Explain**: Breaks down complex concepts with clear analogies and step-by-step points.
   - **Summarize**: Condenses large articles into scannable bullet points.
3. **Multi-Language Translation**: Instant translation into 90+ languages with search filtering and persistent language preference.
4. **Natural Text-to-Speech (TTS)**: High-quality voice playback with speed and pitch optimization.
5. **Ask This Page (Voice Assistant)**: Real-time speech recognition allowing users to ask questions about the active webpage's context.
6. **Authentication & Session Persistence**: Seamless token synchronization with the AccessAI platform via `chrome.storage`.

---

## 🔒 Chrome Web Store Permissions Justification

| Permission | Scope | Justification |
|---|---|---|
| `storage` | Browser Storage | Persists user language preferences and optional authentication session across browser restarts. |
| `host_permissions: https://accessai-backend-lx57.onrender.com/*` | API Calls | Enables secure HTTPS communication with the production AccessAI backend for AI inference. |

---

## 📦 Chrome Web Store Submission Checklist

- [x] **Manifest V3 Compliant**: Uses standard MV3 service worker, declarative content scripts, and action popup.
- [x] **Zero Localhost References**: All API calls point to the production HTTPS backend.
- [x] **Minimum Privilege Principle**: Only requests `storage` permission and production backend host permission.
- [x] **Self-Contained Offline Assets**: Zero remote CDN font or script references.
- [x] **Strict CSP Compliant**: No `eval()`, inline scripts, or remote code execution.
- [x] **Full DOM Sanitization**: Complete XSS prevention across all UI elements.
- [x] **Icons Provided**: Valid 16x16, 48x48, and 128x128 PNG icons.

---

## 🌐 Production API Endpoints

- **Health Check**: `GET https://accessai-backend-lx57.onrender.com/`
- **Simplify**: `POST https://accessai-backend-lx57.onrender.com/api/simplify`
- **Explain**: `POST https://accessai-backend-lx57.onrender.com/api/explain`
- **Summarize**: `POST https://accessai-backend-lx57.onrender.com/api/summarize`
- **Translate**: `POST https://accessai-backend-lx57.onrender.com/api/translate`
- **Ask Page**: `POST https://accessai-backend-lx57.onrender.com/api/ask-page`
- **Auth Login**: `POST https://accessai-backend-lx57.onrender.com/api/auth/login`
- **Auth Signup**: `POST https://accessai-backend-lx57.onrender.com/api/auth/signup`
- **Auth Session**: `GET https://accessai-backend-lx57.onrender.com/api/auth/me`
