"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleClient = exports.GOOGLE_OAUTH_REDIRECT_URL = void 0;
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.GOOGLE_OAUTH_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL ||
    'http://localhost:5001/api/v1/auth/google/callback';
exports.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, exports.GOOGLE_OAUTH_REDIRECT_URL);
