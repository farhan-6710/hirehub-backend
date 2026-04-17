"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
const disableAuthCache = (_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', 'Cookie, Authorization');
    next();
};
router.post('/signup', authController_1.signup);
router.post('/login', authController_1.login);
router.post('/logout', authController_1.logout);
router.get('/me', disableAuthCache, authMiddleware_1.protect, authController_1.getMe);
router.get('/google', authController_1.googleAuthInit);
router.get('/google/callback', authController_1.googleAuthCallback);
exports.default = router;
