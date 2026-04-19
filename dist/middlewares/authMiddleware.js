"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const generateToken_1 = require("../utils/generateToken");
const protect = async (req, res, next) => {
    try {
        let token;
        // 1. Check Authorization header for Bearer token
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // 2. Fallback to HttpOnly cookie
        else if (req.cookies?.[generateToken_1.AUTH_COOKIE_NAME]) {
            token = req.cookies[generateToken_1.AUTH_COOKIE_NAME];
        }
        if (!token) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, name: true, picture: true, role: true },
        });
        if (!user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};
exports.protect = protect;
