# AccessAI Chrome Extension

A minimal, beautiful Chrome Extension that lets users select any text on any website
and instantly get AI-powered Simplify, Explain, or Summarize results — powered by
your local AccessAI backend.

---

## 📁 File Structure

```
accessai-extension/
├── manifest.json     → Extension config (MV3)
├── background.js     → Service worker — calls AccessAI backend APIs
├── content.js        → Injected into all pages — floating button + popup UI
├── styles.css        → Scoped styles for floating button & popup
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

---

## 🚀 How to Load the Extension in Chrome

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `accessai-extension/` folder
5. The extension will appear in your toolbar

---

## ⚙️ Requirements

- Your **AccessAI backend must be running** on `http://localhost:5000`
- Start it with: `npm run dev` (from the root `AccessAI/` folder)

---

## 🎯 How to Use

1. Go to **any website** (e.g., Wikipedia, news articles)
2. **Select any text** with your mouse
3. A small yellow **⚡ AccessAI** button appears near your cursor
4. **Click the button**
5. A clean popup appears with the **Simplified** result
6. Switch tabs: **Simplify → Explain → Summary**
7. Click **🔊 Speak** to hear the result read aloud
8. Click **🌐 Translate** to translate result into Hindi
9. Click **✕** or anywhere outside to close

---

## 🔌 API Endpoints Used

| Feature   | Method | Endpoint         | Body                        |
|-----------|--------|------------------|-----------------------------|
| Simplify  | POST   | /api/chat        | `{ text, type: "simplify" }`|
| Explain   | POST   | /api/chat        | `{ text, type: "explain" }` |
| Summarize | POST   | /api/chat        | `{ text, type: "summarize"}`|
| Translate | POST   | /api/translate   | `{ text, targetLanguage }`  |

---

## 🛑 Troubleshooting

| Problem                        | Fix                                                   |
|-------------------------------|-------------------------------------------------------|
| Button doesn't appear         | Make sure you selected 3+ characters of text          |
| "Cannot reach backend"        | Start the backend: `npm run dev`                      |
| Extension not loading         | Check Developer Mode is ON in chrome://extensions     |
| Icons broken                  | Ignored in dev mode — doesn't affect functionality    |
