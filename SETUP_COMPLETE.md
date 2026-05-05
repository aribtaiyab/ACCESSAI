# AccessAI - Complete Setup Instructions

## PHASE 1: SET UP SUPABASE PROJECT

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project Name: `accessai`
   - Database Password: Create a strong password
   - Region: Choose closest to you
5. Click "Create new project" and wait for it to initialize (5-10 minutes)

### Step 2: Get Your API Keys

1. After project is created, go to **Settings → API** (left sidebar)
2. Copy these values - you'll need them:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` (frontend only)
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (backend only, keep secret!)

### Step 3: Run the SQL Migration

1. Go to **SQL Editor** in left sidebar
2. Click "New Query"
3. Copy the entire contents of `accessai-backend/supabase-migration.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Verify all tables are created: Go to **Tables** and you should see:
   - `history`
   - `settings`
   - `org_audits`

### Step 4: Verify Row Level Security (RLS)

1. Go to **Authentication → Row Level Security**
2. Verify all three tables have RLS enabled
3. Check policies are set correctly for each table

---

## PHASE 2: GET HUGGING FACE API KEY

1. Go to [https://huggingface.co](https://huggingface.co)
2. Sign up or log in
3. Click your profile → Settings → Access Tokens
4. Click "New token"
5. Choose "Read" permission
6. Copy the token - looks like: `hf_xxxxxxxxxxxxxxxxxxxx`

---

## PHASE 3: CONFIGURE BACKEND

### File: `accessai-backend/.env`

Replace all placeholder values with your actual keys:

```env
# Supabase Configuration
SUPABASE_URL=https://ovirshsrqaazrtycjnyp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aXJzaHNycWFhenJ0eWNqbnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDA4ODYsImV4cCI6MjA5MzI3Njg4Nn0.9a63AOcNYx_vR-lPyvtxGQ1z_oPyh6oj_HI1c_bAM_0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aXJzaHNycWFhenJ0eWNqbnlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcwMDg4NiwiZXhwIjoyMDkzMjc2ODg2fQ.your_service_role_key_here

# HuggingFace API
HF_API_KEY=hf_your_huggingface_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional - for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Replace:

- `SUPABASE_URL` with your Project URL
- `SUPABASE_ANON_KEY` with your anon public key
- `SUPABASE_SERVICE_ROLE_KEY` with your service_role secret
- `HF_API_KEY` with your HuggingFace token

### Install Dependencies

```bash
cd accessai-backend
npm install
```

---

## PHASE 4: CONFIGURE FRONTEND

### File: `accessai-frontend/.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ovirshsrqaazrtycjnyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aXJzaHNycWFhenJ0eWNqbnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDA4ODYsImV4cCI6MjA5MzI3Njg4Nn0.9a63AOcNYx_vR-lPyvtxGQ1z_oPyh6oj_HI1c_bAM_0

# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Replace:

- `NEXT_PUBLIC_SUPABASE_URL` with your Project URL (same as backend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon public key (same as backend)

### Install Dependencies

```bash
cd accessai-frontend
npm install
```

---

## PHASE 5: START THE APPLICATIONS

### Terminal 1: Start Backend Server

```bash
cd accessai-backend
npm run dev
```

You should see:

```
✓ Server running on http://localhost:5000
✓ Database: Supabase
✓ Frontend: http://localhost:3000
```

### Terminal 2: Start Frontend Development Server

```bash
cd accessai-frontend
npm run dev
```

You should see:

```
> accessai-frontend@1.0.0 dev
> next dev

Local:        http://localhost:3000
```

---

## PHASE 6: TEST EVERYTHING

### Test 1: Sign Up

1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter test email: `test@example.com`
4. Enter password: `password123`
5. Click "Sign Up"
6. ✅ Should redirect to /dashboard

### Test 2: Access Dashboard

1. You should see dashboard with tool cards
2. Click on "Text Tools"
3. ✅ You should see the text input interface

### Test 3: Test AI Processing

1. Enter text: `The quick brown fox jumps over the lazy dog`
2. Click "Process Text"
3. ✅ Should receive simplified version from HuggingFace
4. Note: First request may take 30 seconds as HuggingFace loads the model
   - If you get "currently loading" error, wait 30 seconds and try again

### Test 4: History

1. Process another text
2. Go back to dashboard
3. ✅ History should be saved in Supabase

### Test 5: Logout

1. Click "Logout" in sidebar
2. ✅ Should redirect to /login

---

## TROUBLESHOOTING

### Backend won't start

- Check port 5000 is not in use: `netstat -tuln | grep 5000`
- Check .env file has all required variables
- Run `npm install` again

### Frontend won't start

- Check port 3000 is not in use
- Delete `node_modules` and `.next` folder
- Run `npm install && npm run dev` again

### 404 Error on /api/ai/simplify

- Backend server must be running on http://localhost:5000
- Check CORS_ORIGIN in backend `.env` is `http://localhost:3000`
- Restart backend server

### "Model is loading" error

- This is normal on first request
- HuggingFace AI model takes 30 seconds to load
- Wait 30 seconds and try again

### Supabase authentication fails

- Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env files
- Check Supabase project is active (not paused)
- Verify tables exist: Go to Supabase SQL Editor and run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

### HuggingFace API fails

- Verify HF_API_KEY is correct
- Check API key has "Read" permission
- Get new key from https://huggingface.co/settings/tokens

---

## PRODUCTION DEPLOYMENT

### Backend (Node.js)

1. Use service like Heroku, Railway, or DigitalOcean
2. Set environment variables in hosting platform
3. Command: `npm start`

### Frontend (Next.js)

1. Use service like Vercel (recommended), Netlify, or DigitalOcean
2. Connect GitHub repo
3. Set environment variables
4. Deploy

---

## API ENDPOINTS

### Auth Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Sign in user
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/session` - Get current session (protected)

### AI Endpoints (protected)

- `POST /api/ai/simplify` - Simplify text
- `POST /api/ai/explain` - Explain text
- `POST /api/ai/summarize` - Summarize text
- `POST /api/ai/alt-text` - Generate alt text

### History Endpoints (protected)

- `GET /api/history` - Get user history
- `POST /api/history/save` - Save history
- `DELETE /api/history/:id` - Delete history item
- `DELETE /api/history/all` - Clear all history

### Settings Endpoints (protected)

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### User Endpoints (protected)

- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

### Org Endpoints (protected)

- `POST /api/org/audit` - Run website audit
- `GET /api/org/audits` - Get audit history

---

## DATABASE SCHEMA

### history table

```sql
- id (UUID) - Primary key
- user_id (UUID) - References auth.users
- type (TEXT) - 'simplify', 'explain', 'summarize', 'altText'
- input_text (TEXT) - Original text
- output_text (TEXT) - AI-processed result
- created_at (TIMESTAMP) - Creation time
- updated_at (TIMESTAMP) - Last update
```

### settings table

```sql
- id (UUID) - Primary key
- user_id (UUID) - References auth.users (unique)
- font_size (INT) - Pixels (default: 16)
- font_family (TEXT) - Font name (default: 'sans-serif')
- language (TEXT) - Language code (default: 'en')
- dyslexia_mode (BOOLEAN) - Enable dyslexia font (default: false)
- high_contrast (BOOLEAN) - Enable high contrast (default: false)
- speech_rate (FLOAT) - Speech rate multiplier (default: 1.0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### org_audits table

```sql
- id (UUID) - Primary key
- user_id (UUID) - References auth.users
- url (TEXT) - Website URL audited
- score (INT) - Accessibility score 0-100
- recommendations (TEXT[]) - Array of recommendations
- audited_at (TIMESTAMP) - When audit was run
- created_at (TIMESTAMP)
```

---

## SUPPORT

For issues or questions:

1. Check the troubleshooting section above
2. Check terminal logs for error messages
3. Verify .env files have all required variables
4. Restart both backend and frontend servers
