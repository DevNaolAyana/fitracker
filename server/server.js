import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import dailyLogRoutes from './routes/dailyLogRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import recommendationsRoutes from './routes/recommendationsRoutes.js';
import todoRoutes from './routes/todoRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// CORS configuration - explicit origin matching client
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// General rate limiter — 100 req / 15 min per IP across all /api/* routes
// Auth endpoints have their own stricter 20/15min limit on top of this.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/logs', dailyLogRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/todos', todoRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fitraker API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
