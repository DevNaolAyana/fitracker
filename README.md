# Fitraker

A MERN-stack gym and nutrition tracker with Ethiopian/Gregorian calendar toggle, macro logging, stats, and recommendations.

## Status
 
Phase 1: Foundation and Auth (v0.1.0) - Complete
Phase 2: Profile & Calendar core (v0.2.0) - Complete
Phase 3: Food & Nutrition Logging (v0.3.0) - Complete
Phase 4: Stats, Dashboard & Recommendations (v0.4.0) - Complete
Phase 5: Todos, Export, PWA & Final Polish (v1.0.0) - Complete


## Tech Stack

- Frontend: React + Vite + Tailwind CSS v4 + Recharts (deployed on Vercel)
- Backend: Express + Node.js (deployed on Render)
- Database: MongoDB Atlas (free tier)
- Auth: JWT in HTTP-only cookies, bcrypt
- Email: Resend HTTP API
- Security: helmet, express-rate-limit, CORS

## Project Structure

```
fitraker/
    package.json              # root - concurrently dev script
    client/                   # Vite React app (Vercel)
        src/
            context/          # AuthContext, ThemeContext, CalendarContext
            pages/            # Login, Signup, ForgotPassword, ResetPassword, Dashboard, Profile, Calendar, Todos, NotFound
            components/       # Button, Input, ProtectedRoute, ErrorBoundary, Navbar, FoodSearchDropdown, MuscleGroupSelector
            utils/            # exportCsv.js
        .env.example
    server/                   # Express API (Render)
        config/db.js
        models/               # User, Log, Food, Todo
        routes/               # authRoutes, profileRoutes, logRoutes, foodRoutes, calendarRoutes, statsRoutes, recommendationsRoutes, todoRoutes
        middleware/auth.js
        .env.example
```


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
 
### Auth Routes (`/api/auth`)
- POST `/signup` - Register user (Rate limited: 20 req / 15 min)
- POST `/login` - Login user (Rate limited: 20 req / 15 min)
- POST `/logout` - Clear cookie
- GET `/me` - Get current user (protected)
- POST `/forgot-password` - Send reset email (Rate limited: 20 req / 15 min)
- POST `/reset-password/:token` - Reset password
 
### Profile Routes (`/api/profile`, protected)
- GET `/` - Get user profile settings & calculated macro targets
- PUT `/` - Update user height, age, gender, activity level, goal, and overrides
- POST `/weight` - Upsert a weight entry for a date
- GET `/weight-history` - Get all logged weigh-ins sorted by date ascending
 
### Daily Log Routes (`/api/logs`, protected)
- GET `/:date` - Get gym log for Gregorian date (returns default if not found)
- PUT `/:date` - Upsert gym checkbox, muscle groups, and workout notes for a date
- POST `/:date/food` - Add or combine food logs on the given date (snapshotting macros)
- DELETE `/:date/food/:entryId` - Delete logged food entry by ID and recalculate totals

### Foods Library Routes (`/api/foods`, protected)
- GET `/` - Retrieve merged global foods and user's custom foods sorted alphabetically
- POST `/custom` - Save a new custom food to the user's library
- DELETE `/custom/:id` - Delete a custom food (req.userId ownership check)
 
### Calendar Routes (`/api/calendar`, protected)
- GET `/today` - Get today's Gregorian date and translated Ethiopian date (cached 60s)
- GET `/convert?date=YYYY-MM-DD&from=gregorian|ethiopian` - Convert between calendar systems

### Stats Routes (`/api/stats`, protected)
- GET `/weekly?date=YYYY-MM-DD` - Stats for the Mon–Sun week containing the given date (defaults to current week). Returns gymDaysCount, total/avg macros, and dailyBreakdown.
- GET `/monthly?year=YYYY&month=MM` - Same shape aggregated over the calendar month.
- GET `/heatmap` - Last 30 days: [{ date, gym, totalCalories }] for the activity heatmap.
- GET `/consistency` - { currentWeekGymDays, weeklyGoal, metGoalThisWeek, consecutiveWeeksMetGoal }

### Recommendations Routes (`/api/recommendations`, protected)
- GET `/today` - { macroMessage, hintWeightLog, gymMessage, quote, todayTotals, targets } — rule-based insights comparing logged data to user targets. Quote sourced from ZenQuotes.io (cached 1 hour).
 
### Todo Routes (`/api/todos`, protected)
- GET `/` - Retrieve active (done: false) todos sorted by date asc, time asc
- GET `/history` - Retrieve completed (done: true) todos sorted by completedAt desc
- POST `/` - Create a new todo { title, date, time? }
- PUT `/:id` - Edit todo details (title, date, time)
- PATCH `/:id/toggle` - Toggle done status (sets/clears completedAt)
- DELETE `/:id` - Delete todo item

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
