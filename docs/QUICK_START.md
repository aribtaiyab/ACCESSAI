# Quick Start Guide - AccessAI

## 🎯 5-Minute Setup

### Prerequisites

- Node.js 18+
- Supabase account (FREE at supabase.com)
- Windows/Mac/Linux

---

## Step 1: Get Supabase Credentials (2 min)

1. Go to https://supabase.com/dashboard
2. Create new project (or use existing)
3. Go to **Settings → API**
4. Copy **Project URL** and **Anon Key**
5. They're already in .env files if using provided project

---

## Step 2: Create Database Tables (1 min)

In Supabase **SQL Editor**, paste this:

```sql
CREATE TABLE texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_text TEXT NOT NULL,
  simplified_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  font_size INTEGER DEFAULT 16,
  font_family TEXT DEFAULT 'Inter',
  language TEXT DEFAULT 'en',
  dyslexia_mode BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  speech_rate FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own texts" ON texts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own texts" ON texts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own texts" ON texts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own texts" ON texts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Step 3: Start Backend (1 min)

**Option A: Using batch script (Windows)**

```
Double-click: START_BACKEND.bat
```

**Option B: Manual**

```bash
cd accessai-backend
npm install
npm start
```

Expected: ✓ Server running on http://localhost:5000

---

## Step 4: Start Frontend (1 min)

**Option A: Using batch script (Windows)**

```
Double-click: START_FRONTEND.bat
```

**Option B: Manual**

```bash
cd accessai-frontend
npm install
npm run dev
```

Expected: ✓ Frontend running on http://localhost:3000

---

## ✅ You're Done!

Open http://localhost:3000 in your browser

### Test Flows:

1. **Sign up** → Create account
2. **Log in** → Use credentials
3. **Text page** → Try simplifying text
4. **Settings** → Update preferences
5. **Profile** → View your account

---

## 🔧 Common Issues

### Port 5000 in use?

```bash
PORT=5001 npm start
```

### Supabase connection failed?

- Check .env file has correct URL and key
- Verify project is active in dashboard
- Restart both services

### Frontend won't load?

- Verify .env.local has Supabase credentials
- Clear browser cache
- Restart frontend: Ctrl+C and npm run dev

### Login returns 401?

- Ensure user email exists in Supabase Auth
- Check Authorization header in API calls
- Verify token format: `Bearer <token>`

---

## 📚 Useful Commands

```bash
# Build frontend for production
cd accessai-frontend
npm run build

# Run frontend in production mode
npm start

# Lint frontend
npm run lint

# Check backend environment
cd accessai-backend
npm start 2>&1 | head -10

# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 🧪 API Testing

### Health Check

```bash
curl http://localhost:5000/
```

### Test Signup

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!"}'
```

### Test AI (no auth needed)

```bash
curl -X POST http://localhost:5000/api/ai/simplify \
  -H "Content-Type: application/json" \
  -d '{"text":"Complex text here"}'
```

---

## 🎨 Project Structure

```
AccessAI/
├── accessai-backend/
│   ├── config/supabaseClient.js (Supabase setup)
│   ├── controllers/ (business logic)
│   ├── middleware/ (auth, errors, limits)
│   ├── routes/ (API endpoints)
│   ├── .env (configuration)
│   └── server.js (main entry)
│
├── accessai-frontend/
│   ├── app/ (pages)
│   ├── utils/supabase.js (Supabase client)
│   ├── .env.local (configuration)
│   └── next.config.mjs (Next.js config)
│
├── SETUP_GUIDE.md (detailed setup)
├── PROJECT_STATUS.md (status report)
├── START_BACKEND.bat (quick start)
└── START_FRONTEND.bat (quick start)
```

---

## 📞 Need Help?

1. Check SETUP_GUIDE.md for detailed instructions
2. Check PROJECT_STATUS.md for status
3. Check backend logs: `npm start` output
4. Check browser console: F12 in Chrome
5. Verify Supabase project in dashboard

---

**Last Updated**: May 2, 2026
**Status**: ✅ Ready to Use
