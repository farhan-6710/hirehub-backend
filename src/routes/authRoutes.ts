import express from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  googleAuthInit,
  googleAuthCallback,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

const disableAuthCache: express.RequestHandler = (_req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'private, no-cache, no-store, max-age=0, must-revalidate',
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Vary', 'Cookie, Authorization');
  next();
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', disableAuthCache, protect, getMe);

router.get('/google', googleAuthInit);
router.get('/google/callback', googleAuthCallback);

export default router;
