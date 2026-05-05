# AccessAI - Complete Setup Guide

## Project Overview
- **Frontend**: Next.js 14 with React 18
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL with Auth)
- **Migration**: From MongoDB to Supabase (COMPLETED)

---

## 🔧 Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free at supabase.com)
- Git (optional)

---

## 📦 Supabase Setup (CRITICAL)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details (name, database password, region)
4. Wait for project to initialize (~2 minutes)

### Step 2: Get API Keys
1. Go to **Settings → API** (in left sidebar)
2. Copy the following:
   - **Project URL** (e.g., https://xxxx.supabase.co)
   - **Anon Key** (labeled as "anon public")
3. These are already in your `.env` files if using the provided credentials

### Step 3: Create Database Tables

In Supabase **SQL Editor**, run this SQL:

```sql
-- Create users table (managed by Supabase Auth)
-- This is created automatically by Supabase Auth

-- Create texts table for storing text history
CREATE TABLE texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_text TEXT NOT NULL,
  simplified_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table for user preferences
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

-- Enable Row Level Security (RLS)
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for texts
CREATE POLICY "Users can view their own texts" ON texts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own texts" ON texts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own texts" ON texts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own texts" ON texts
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for settings
CREATE POLICY "Users can view their own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🚀 Running the Project

### Backend Setup

```bash
# Navigate to backend directory
cd accessai-backend

# Verify .env file has correct values
cat .env

# Expected output:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=eyJhbGc...
# GEMINI_API_KEY=AIzaSy...
# PORT=5000

# Install dependencies (if not done)
npm install

# Start the backend server
npm start
```

**Expected output**:
```
✓ All environment variables loaded
✓ Gemini API Key: LOADED
✓ Supabase Client: Ready
✓ Supabase client initialized
==================================================
✓ Server running on http://localhost:5000
✓ Database: Supabase
✓ Frontend: http://localhost:3000
==================================================
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd accessai-frontend

# Verify .env.local file
cat .env.local

# Expected output:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Install dependencies (if not done)
npm install

# Start the frontend development server
npm run dev
```

**Expected output**:
```
> accessai-frontend@1.0.0 dev
> next dev

  ▲ Next.js 14.2.3
  - Local: http://localhost:3000
```

### Access the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)
- Backend Health Check: [http://localhost:5000/](http://localhost:5000/)

---

## 🧪 Testing the Application

### 1. Test Backend API Health
```bash
curl http://localhost:5000/
```

Expected response:
```json
{ "success": true, "message": "AccessAI Backend API is running" }
```

### 2. Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

Expected response includes `access_token` and `user` object.

### 4. Test AI Endpoint (without auth)
```bash
curl -X POST http://localhost:5000/api/ai/simplify \
  -H "Content-Type: application/json" \
  -d '{"text":"The quick brown fox jumps over the lazy dog"}'
```

---

## 🔑 Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSy...
PORT=5000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Note**: Frontend variables must start with `NEXT_PUBLIC_` to be accessible in the browser.

---

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### AI Tools
- `POST /api/ai/simplify` - Simplify text (optional auth)
- `POST /api/ai/explain` - Explain text (optional auth)
- `POST /api/ai/summarize` - Summarize text (optional auth)
- `POST /api/ai/alt-text` - Generate alt text (optional auth)

### History (requires authentication)
- `GET /api/history` - Get user's text history
- `POST /api/history/save` - Save to history
- `DELETE /api/history/:id` - Delete history item
- `DELETE /api/history/all` - Clear all history

### Settings (requires authentication)
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### User (requires authentication)
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

---

## 🛠️ Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm start
```

### Supabase Connection Error
- Check `.env` file has correct URL and key
- Verify Supabase project is active in dashboard
- Check internet connection

### Frontend Build Errors
```bash
# Clear build cache
rm -rf .next
npm run build
```

### Token Errors on Protected Routes
- Ensure Authorization header: `Authorization: Bearer <token>`
- Token comes from login response as `access_token`
- Make sure user is authenticated before accessing protected routes

### Database Queries Return Empty
- Verify Row Level Security (RLS) policies are set correctly
- Ensure user_id matches authenticated user
- Check tables exist in Supabase SQL Editor

---

## 📁 Project Structure

```
AccessAI/
├── accessai-backend/
│   ├── config/
│   │   └── supabaseClient.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── aiController.js
│   │   ├── historyController.js
│   │   ├── settingsController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   ├── models/ (deprecated - now using Supabase)
│   ├── utils/
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── accessai-frontend/
│   ├── app/
│   │   ├── login/page.js
│   │   ├── signup/page.js
│   │   ├── dashboard/
│   │   │   ├── text/page.js
│   │   │   ├── settings/page.js
│   │   │   └── ...
│   │   └── layout.js
│   ├── utils/
│   │   └── supabase.js
│   ├── .env.local
│   ├── package.json
│   └── next.config.mjs
```

---

## ✅ Migration Checklist

- ✅ Removed MongoDB and Mongoose from backend
- ✅ Integrated Supabase client with proper error handling
- ✅ Converted all controllers to use Supabase queries
- ✅ Fixed authentication middleware for Supabase tokens
- ✅ Updated frontend to use Supabase auth client
- ✅ Fixed TypeScript syntax issues (removed `!` operators)
- ✅ Configured environment variables correctly
- ✅ Removed deprecated model files
- ✅ Added proper logging and error handling
- ✅ Tested build process (no errors)

---

## 📚 Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth JS Client](https://supabase.com/docs/reference/javascript/auth)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/intro)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in the terminal
2. Verify environment variables are set correctly
3. Ensure Supabase project is created and tables exist
4. Try clearing caches: `rm -rf node_modules .next && npm install`
5. Restart both frontend and backend servers

---

**Last Updated**: May 2, 2026
**Project Status**: ✅ Ready for Development