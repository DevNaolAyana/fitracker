# Fitraker

A MERN-stack gym and nutrition tracker with Ethiopian/Gregorian calendar toggle, macro logging, stats, and recommendations.

## Status

Phase 1: Foundation and Auth (v0.1.0) - Complete
Phase 2: Profile and Calendar core (v0.2.0) - Coming soon

## Tech Stack

- Frontend: React + Vite + Tailwind CSS v4 (deployed on Vercel)
- Backend: Express + Node.js (deployed on Render)
- Database: MongoDB Atlas (free tier)
- Auth: JWT in HTTP-only cookies, bcrypt
- Email: Resend HTTP API
- Security: helmet, express-rate-limit, CORS

## Project Structure

`
fitraker/
    package.json              # root - concurrently dev script
    client/                   # Vite React app (Vercel)
        src/
            context/          # AuthContext, ThemeContext
            pages/            # Login, Signup, ForgotPassword, ResetPassword, Dashboard
            components/       # Button, Input, ProtectedRoute
        .env.example
    server/                   # Express API (Render)
        config/db.js
        models/User.js
        controllers/authController.js
        routes/authRoutes.js
        middleware/auth.js
        .env.example
`

## Local Development Setup

### 1. Install Dependencies

`ash
git clone https://github.com/DevNaolAyana/fitracker.git
cd fitracker
npm install
npm install --prefix client
npm install --prefix server
`

### 2. Environment Variables

Create server/.env:

`
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/fitraker
JWT_SECRET=your_super_secret_jwt_key_here
RESEND_API_KEY=re_your_resend_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
`

Create client/.env.local:

`
VITE_API_URL=http://localhost:5000
`

### 3. Run

`ash
npm run dev
`

- Client: http://localhost:5173
- Server: http://localhost:5000/api/health

Note: If RESEND_API_KEY is not set, the reset link is logged to the server console.

## API Routes

All routes are prefixed with /api/auth:

- POST /signup - Register user
- POST /login - Login user
- POST /logout - Clear cookie
- GET /me - Get current user (protected)
- POST /forgot-password - Send reset email via Resend
- POST /reset-password/:token - Reset password

Rate limited (5 req / 15 min per IP): signup, login, forgot-password

## Deployment

### Server to Render

1. Create a Web Service, root directory: server
2. Build: npm install, Start: npm start
3. Set all env vars from server/.env.example

### Client to Vercel

1. Import repo, root directory: client, framework: Vite
2. Set VITE_API_URL to your Render URL

### After Deployment

Update CLIENT_URL on Render to your Vercel URL (no trailing slash).
Update VITE_API_URL on Vercel to your Render URL.
Redeploy both services.

IMPORTANT: Cookie uses secure:true, sameSite:none in production for cross-domain Vercel/Render auth.

Live URLs:
- Frontend: (add after deployment)
- Backend: (add after deployment)

## Phase 1 Testing Checklist

- npm run dev from root starts both services
- Sign up - redirected to dashboard showing your name
- Refresh - still logged in
- Log out - redirected to login, /me returns 401
- Wrong password - clear error, no crash
- Forgot password - email sent via Resend with working reset link
- Reset password - new password works, old does not
- 6+ rapid login attempts - rate limiter returns 429
- Dark/light toggle works and persists
- Full flow works on live Vercel + Render URLs

## License

MIT
