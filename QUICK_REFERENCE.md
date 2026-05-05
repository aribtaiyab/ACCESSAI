# AccessAI - Quick Reference Guide

## 🚀 Start Development

```bash
# From project root
npm run dev

# Or separately
npm run dev:backend   # Terminal 1, Port 5000
npm run dev:frontend  # Terminal 2, Port 3000
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Base**: http://localhost:5000/api

## 📝 API Endpoints

### AI Operations

```
POST /api/ai/simplify    - Simplify text
POST /api/ai/explain     - Explain text
POST /api/ai/summarize   - Summarize text
POST /api/ai/alt-text    - Generate alt text
```

### Authentication

```
POST /api/auth/signup           - Register
POST /api/auth/login            - Login
POST /api/auth/forgot-password  - Password reset
POST /api/auth/reset-password   - Confirm reset
```

### User Data

```
GET    /api/history       - Get history (auth required)
DELETE /api/history/:id   - Delete entry (auth required)
GET    /api/settings      - Get settings (auth required)
PUT    /api/settings      - Update settings (auth required)
```

## 🔑 Environment Variables

**Backend**: `accessai-backend/.env`

```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
HF_API_KEY=your_hugging_face_key
PORT=5000
```

**Frontend**: `accessai-frontend/.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 🧪 Test AI Feature

### Using curl

```bash
curl -X POST http://localhost:5000/api/ai/simplify \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here"}'
```

### Using frontend

1. Go to http://localhost:3000/login
2. Create account
3. Navigate to /dashboard/text
4. Enter text and click "Process Text"

## 📦 Project Structure

```
AccessAI/
├── accessai-backend/
│   ├── services/aiService.js      ← Hugging Face API
│   ├── controllers/               ← API logic
│   ├── routes/                    ← API endpoints
│   ├── middleware/                ← Auth, errors
│   └── server.js                  ← Main entry
├── accessai-frontend/
│   ├── app/                       ← Pages
│   ├── utils/supabase.js          ← DB client
│   └── next.config.mjs
└── package.json                   ← Dependencies
```

## 🔧 Common Commands

```bash
# Install all dependencies
npm run install-all

# Run both dev servers
npm run dev

# Run individual servers
npm run dev:backend
npm run dev:frontend

# Build frontend for production
npm run build

# Start production build
npm start
```

## ⚠️ Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm run install-all
```

### Environment Variables Not Found

- Check `.env` file exists
- Verify variable names are correct
- Restart dev server after changes
- Backend needs: SUPABASE_URL, SUPABASE_ANON_KEY, HF_API_KEY

### Database Connection Error

- Verify Supabase credentials
- Check internet connection
- Ensure Supabase project is active

## 📚 Key Files

| File                           | Purpose                |
| ------------------------------ | ---------------------- |
| `server.js`                    | Backend entry point    |
| `services/aiService.js`        | Hugging Face API calls |
| `controllers/aiController.js`  | AI endpoints logic     |
| `config/supabaseClient.js`     | Database connection    |
| `middleware/authMiddleware.js` | Token validation       |
| `app/page.js`                  | Frontend home page     |
| `app/login/page.js`            | Login page             |
| `app/dashboard/text/page.js`   | AI tools interface     |
| `utils/supabase.js`            | Frontend DB client     |

## 🔐 Authentication Flow

1. User signs up → Creates account in Supabase
2. User logs in → Gets JWT token
3. Token stored in browser
4. Token sent in API calls via `Authorization: Bearer <token>`
5. authMiddleware validates token
6. Request proceeds if valid

## 💾 Database Schema

**texts** table (for AI operation history)

- id, user_id, original_text, simplified_text, created_at

**settings** table (user preferences)

- id, user_id, theme, language, created_at

**users** (managed by Supabase Auth)

- id, email, password (hashed)

## 🌟 Features

✅ User authentication (signup/login)  
✅ Text simplification  
✅ Text explanation  
✅ Text summarization  
✅ Alt text generation  
✅ History tracking  
✅ User settings  
✅ Responsive design  
✅ Error handling  
✅ Rate limiting

## 🚨 Common Issues & Solutions

| Issue                     | Solution                             |
| ------------------------- | ------------------------------------ |
| Backend won't start       | Check if port 5000 is free           |
| Can't connect to Supabase | Verify URL and key in `.env`         |
| Frontend gives blank page | Check browser console for errors     |
| API returns 401           | Ensure token is valid and being sent |
| "Module not found" error  | Run `npm run install-all`            |

## 📊 Status Check

```bash
# Backend running?
curl http://localhost:5000

# Frontend running?
curl http://localhost:3000

# API working?
curl -X POST http://localhost:5000/api/ai/simplify \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}'
```

## 🚀 Deploy to Production

**Frontend (Vercel)**

```bash
cd accessai-frontend
npm run build
```

**Backend** (Choose provider: Heroku/Railway/Render)

- Set environment variables in provider dashboard
- Deploy `accessai-backend` folder
- Point frontend to production backend URL

## 📞 Get Help

1. Check `PRODUCTION_GUIDE.md` for detailed docs
2. Review `COMPLETION_REPORT.md` for what was changed
3. Check browser console for error messages
4. Check backend logs: `npm run dev:backend`

---

**AccessAI v1.0.0** | Production Ready ✅
