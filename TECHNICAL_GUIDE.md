# AccessAI - Technical Architecture & Implementation Guide

**Version**: 2.0 (Supabase)
**Last Updated**: May 2, 2026

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Client                         │
│                    (http://localhost:3000)                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Next.js 14 Frontend (React)                   │ │
│  │  • Login/Signup pages                                   │ │
│  │  • Dashboard with text tools                            │ │
│  │  • User settings & profile                              │ │
│  │  • Supabase auth client                                 │ │
│  └──────────────────┬──────────────────────────────────────┘ │
└─────────────────────┼──────────────────────────────────────────┘
                      │
         HTTP/REST API (JSON)
         Authorization: Bearer Token
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│              Express.js Backend Server                          │
│           (http://localhost:5000)                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes & Controllers                                   │   │
│  │  • /api/auth (signup, login, password reset)            │   │
│  │  • /api/ai (simplify, explain, summarize, alt-text)     │   │
│  │  • /api/history (CRUD operations)                       │   │
│  │  • /api/settings (user preferences)                     │   │
│  │  • /api/user (profile management)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Middleware                                             │   │
│  │  • Auth Middleware (validates Supabase tokens)          │   │
│  │  • Error Handler (consistent error responses)           │   │
│  │  • Rate Limiter (prevent abuse)                         │   │
│  │  • CORS (allow localhost:3000)                          │   │
│  │  • Helmet (security headers)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  External Services                                      │   │
│  │  • Supabase Client (PostgreSQL, Auth)                   │   │
│  │  • Google Gemini API (text generation)                  │   │
│  │  • Nodemailer (password reset emails)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────────────┘
                      │
        Supabase API HTTP Calls
        Authorization: Anon Key
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│           Supabase (PostgreSQL Database)                       │
│     (https://ovirshsrqaazrtycjnyp.supabase.co)                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Authentication (Built-in)                              │   │
│  │  • auth.users table                                     │   │
│  │  • JWT token management                                 │   │
│  │  • Email verification                                   │   │
│  │  • Password reset                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Tables                                            │   │
│  │  • public.texts (user history)                          │   │
│  │  • public.settings (user preferences)                   │   │
│  │  • Row-level security (RLS) enabled                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. Signup Flow

```
Client (Signup Page)
    │
    ├─► Validate email & password locally
    │
    ├─► POST /api/auth/signup
    │        {email, password}
    │
    ▼ Backend (Express)
    │
    ├─► supabase.auth.signUp({email, password})
    │
    ▼ Supabase Auth
    │
    ├─► Hash password (bcrypt, internal)
    ├─► Create user in auth.users
    ├─► Send confirmation email
    │
    ▼ Response
    │
    └─► 201 Created
        {success: true, data: {user: {...}}}
```

### 2. Login Flow

```
Client (Login Page)
    │
    ├─► Validate email & password locally
    │
    ├─► POST /api/auth/login
    │        {email, password}
    │
    ▼ Backend (Express)
    │
    ├─► supabase.auth.signInWithPassword({email, password})
    │
    ▼ Supabase Auth
    │
    ├─► Find user by email
    ├─► Verify password hash
    ├─► Generate JWT access_token
    ├─► Generate refresh_token
    │
    ▼ Response
    │
    ├─► 200 OK
    │   {
    │     success: true,
    │     data: {
    │       user: {...},
    │       session: {
    │         access_token: "eyJhbGc...",
    │         refresh_token: "...",
    │         expires_in: 3600
    │       }
    │     }
    │   }
    │
    ▼ Client
    │
    └─► Store access_token
        Use in subsequent API calls:
        Authorization: Bearer eyJhbGc...
```

### 3. Protected API Call Flow

```
Client Browser
    │
    ├─► Retrieve stored access_token
    │
    ├─► POST /api/history
    │   Headers: {
    │     Authorization: "Bearer eyJhbGc...",
    │     Content-Type: "application/json"
    │   }
    │
    ▼ Backend Auth Middleware
    │
    ├─► Extract token from Authorization header
    ├─► Call supabase.auth.getUser(token)
    │
    ▼ Supabase
    │
    ├─► Verify JWT signature
    ├─► Check token expiration
    ├─► Return user data
    │
    ▼ Backend
    │
    ├─► Middleware sets req.user = user
    ├─► Middleware calls next()
    │
    ▼ Route Handler
    │
    ├─► Access req.user.id
    ├─► Query user's data from Supabase
    │   WHERE user_id = req.user.id
    │
    ▼ Response
    │
    └─► 200 OK
        {
          success: true,
          data: [
            {id: "...", original_text: "...", ...},
            ...
          ]
        }
```

---

## Database Schema

### Users Table (Managed by Supabase Auth)

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- ... other fields
);
```

### Texts Table (User History)

```sql
CREATE TABLE public.texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  simplified_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own texts"
  ON public.texts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own texts"
  ON public.texts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own texts"
  ON public.texts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own texts"
  ON public.texts FOR DELETE
  USING (auth.uid() = user_id);
```

### Settings Table (User Preferences)

```sql
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  font_size INTEGER DEFAULT 16,
  font_family TEXT DEFAULT 'Inter',
  language TEXT DEFAULT 'en',
  dyslexia_mode BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  speech_rate FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own settings"
  ON public.settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.settings FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## API Endpoints Reference

### Authentication Routes

```
POST /api/auth/signup
  Request: {email, password}
  Response: {success, data: {user}}
  Status: 201

POST /api/auth/login
  Request: {email, password}
  Response: {success, data: {user, session}}
  Status: 200

POST /api/auth/forgot-password
  Request: {email}
  Response: {success, message}
  Status: 200

POST /api/auth/reset-password
  Request: {token, password}
  Response: {success, message}
  Status: 200
```

### AI Routes (Optional Auth)

```
POST /api/ai/simplify
  Request: {text}
  Optional Auth: Authorization: Bearer <token>
  Response: {success, result}
  Status: 200

POST /api/ai/explain
  Request: {text}
  Optional Auth: Authorization: Bearer <token>
  Response: {success, result}
  Status: 200

POST /api/ai/summarize
  Request: {text}
  Optional Auth: Authorization: Bearer <token>
  Response: {success, result}
  Status: 200

POST /api/ai/alt-text
  Request: {text}
  Optional Auth: Authorization: Bearer <token>
  Response: {success, result}
  Status: 200
```

### History Routes (Requires Auth)

```
GET /api/history
  Headers: Authorization: Bearer <token>
  Response: {success, data: [{id, original_text, simplified_text, ...}]}
  Status: 200

POST /api/history/save
  Headers: Authorization: Bearer <token>
  Request: {original_text, simplified_text}
  Response: {success, data}
  Status: 200

DELETE /api/history/:id
  Headers: Authorization: Bearer <token>
  Response: {success}
  Status: 200

DELETE /api/history/all
  Headers: Authorization: Bearer <token>
  Response: {success}
  Status: 200
```

### Settings Routes (Requires Auth)

```
GET /api/settings
  Headers: Authorization: Bearer <token>
  Response: {success, data: {font_size, font_family, ...}}
  Status: 200

PUT /api/settings
  Headers: Authorization: Bearer <token>
  Request: {font_size, high_contrast, ...}
  Response: {success, data}
  Status: 200
```

### User Routes (Requires Auth)

```
GET /api/user/profile
  Headers: Authorization: Bearer <token>
  Response: {success, data: {id, email, ...}}
  Status: 200

PUT /api/user/profile
  Headers: Authorization: Bearer <token>
  Request: {email}
  Response: {success, data}
  Status: 200

PUT /api/user/password
  Headers: Authorization: Bearer <token>
  Request: {password}
  Response: {success}
  Status: 200

DELETE /api/user/account
  Headers: Authorization: Bearer <token>
  Response: {success}
  Status: 200
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

```
200 OK - Successful request
201 Created - Resource created
400 Bad Request - Invalid input
401 Unauthorized - Missing/invalid token
404 Not Found - Resource doesn't exist
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
```

### Common Error Cases

```javascript
// Missing required fields
{ "success": false, "error": "Email and password are required" }

// Invalid credentials
{ "success": false, "error": "Invalid credentials" }

// Unauthorized access
{ "success": false, "error": "Invalid or expired token" }

// Database error
{ "success": false, "error": "Failed to save history" }

// Validation error
{ "success": false, "error": "User ID, original text, and simplified text are required" }
```

---

## Environment Variables

### Backend (.env)

```
# Supabase Configuration
SUPABASE_URL=https://ovirshsrqaazrtycjnyp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Configuration
GEMINI_API_KEY=AIzaSyCI3kA53j9q4yfK0bhCyqGto-26UEGbSUU

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Frontend (.env.local)

```
# Supabase Configuration (public - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://ovirshsrqaazrtycjnyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Sequence Diagrams

### Complete Signup & Login Flow

```
User          Frontend          Backend          Supabase
 │                │                │                  │
 ├─ Enter email ──>│                │                  │
 │ & password      │                │                  │
 │                 │                │                  │
 │                 ├─ POST /signup ─>│                  │
 │                 │                 │                  │
 │                 │                 ├─ auth.signUp ───>│
 │                 │                 │                  │
 │                 │                 │ Hash password    │
 │                 │                 │ Create user      │
 │                 │                 │                  │
 │                 │                 │<─ User created ──│
 │                 │                 │                  │
 │                 │<── 201 Created ─|                  │
 │                 │                  │                  │
 │ Sign up complete│                  │                  │
 │                 │                  │                  │
 │ ├─ Click login ─>│                  │                  │
 │                 │                  │                  │
 │                 ├─ POST /login ───>│                  │
 │                 │                  │                  │
 │                 │                  ├─ signInWithPassword ──>│
 │                 │                  │                       │
 │                 │                  │ Verify password       │
 │                 │                  │ Generate tokens       │
 │                 │                  │                       │
 │                 │                  │<─ Session & tokens ──│
 │                 │                  │                       │
 │                 │<── {token} ──────│                       │
 │                 │                  │                       │
 │ Store token     │                  │                       │
 │                 │                  │                       │
 │ ├─ Navigate to  │                  │                       │
 │ │ dashboard     │                  │                       │
 │ │               ├─ GET /history ──>│                       │
 │ │               │ Bearer: token    │                       │
 │ │               │                  ├─ Verify token ──>│
 │ │               │                  │                  │
 │ │               │                  │ Query user data  │
 │ │               │                  │ WHERE user_id=X  │
 │ │               │                  │                  │
 │ │               │                  │<─ User data ────│
 │ │               │                  │                  │
 │ │               │<─ {history} ────│                  │
 │ │               │                  │                  │
 │ └─ See history  │                  │                  │
```

---

## Performance Considerations

### Optimization Strategies

1. **Database Queries**
   - Use indexes on frequently queried columns
   - Limit results with pagination
   - Use SELECT specific columns (not SELECT \*)

2. **Caching**
   - Cache user settings on frontend
   - Use localStorage for tokens
   - Cache API responses with short TTL

3. **API Optimization**
   - Batch multiple requests when possible
   - Use compression (gzip)
   - Minimize payload size

4. **Frontend Performance**
   - Next.js automatic code splitting
   - Image optimization
   - Lazy loading components

---

## Security Best Practices

### Implemented

✅ Row-level security on database tables
✅ JWT token expiration (3600 seconds)
✅ Password hashing (Supabase managed)
✅ CORS restricted to localhost:3000
✅ Rate limiting (10 requests per minute)
✅ Helmet security headers
✅ No hardcoded secrets in code

### Recommended for Production

- [ ] Enable HTTPS everywhere
- [ ] Use HTTPS for Supabase connection
- [ ] Implement API rate limiting per user/IP
- [ ] Add request signing
- [ ] Implement audit logging
- [ ] Use service role key for sensitive operations (separate endpoint)
- [ ] Add request validation and sanitization
- [ ] Implement CSRF protection

---

## Monitoring & Logging

### Backend Logs

- Environment variable validation
- Server startup/shutdown
- Auth middleware token validation
- Database query errors
- API request/response logging
- Unhandled exceptions

### Frontend Logs

- Component lifecycle
- API call debugging
- Supabase auth state changes
- Error boundaries
- Performance metrics

### Recommended Monitoring

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Log aggregation (ELK Stack)
- [ ] Real-time alerting
- [ ] Uptime monitoring

---

## Deployment Guide

### Prerequisites

- Node.js 18+ on server
- Supabase project (production)
- Domain name (optional)
- SSL certificate (required for production)

### Backend Deployment

```bash
# Build
cd accessai-backend
npm install --production

# Run with process manager (PM2)
pm2 start server.js --name "accessai-api"

# Monitor
pm2 monit
```

### Frontend Deployment

```bash
# Build
cd accessai-frontend
npm run build

# Deploy built files to CDN or static host
# Or run Next.js server
npm start
```

---

## Troubleshooting Guide

### Issue: Supabase Connection Error

**Symptoms**: Backend won't start
**Solution**:

1. Verify SUPABASE_URL in .env
2. Verify SUPABASE_ANON_KEY in .env
3. Check Supabase project is active
4. Check internet connection

### Issue: 401 Unauthorized on Protected Routes

**Symptoms**: API returns 401 even with login
**Solution**:

1. Verify token is in Authorization header
2. Verify token format: "Bearer <token>"
3. Verify token is not expired
4. Check user exists in Supabase

### Issue: Frontend Can't Connect to Backend

**Symptoms**: API calls fail with CORS error
**Solution**:

1. Verify backend is running on port 5000
2. Verify CORS is enabled in Express
3. Check browser console for error
4. Verify frontend uses correct API URL

### Issue: Database Queries Return Empty

**Symptoms**: API returns empty array
**Solution**:

1. Verify row-level security policies
2. Verify user_id matches authenticated user
3. Check tables exist in Supabase
4. Verify data was inserted correctly

---

## Summary

AccessAI now uses a modern, scalable architecture:

- ✅ **Frontend**: Next.js 14 with React 18
- ✅ **Backend**: Express.js with Node.js
- ✅ **Database**: Supabase (PostgreSQL)
- ✅ **Authentication**: Supabase Auth with JWT
- ✅ **Error Handling**: Comprehensive try/catch blocks
- ✅ **Security**: Row-level security, CORS, rate limiting
- ✅ **Monitoring**: Detailed logging throughout
- ✅ **Documentation**: Complete and comprehensive

---

**Document Version**: 2.0
**Last Updated**: May 2, 2026
**Status**: Production Ready
