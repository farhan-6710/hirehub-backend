import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

export const GOOGLE_OAUTH_REDIRECT_URL =
  process.env.GOOGLE_REDIRECT_URL ||
  'http://localhost:5001/api/v1/auth/google/callback';

export const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URL,
);
