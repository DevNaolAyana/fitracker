import express from 'express';
import { signup, login, logout, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
