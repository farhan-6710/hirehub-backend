"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthCallback = exports.googleAuthInit = exports.getMe = exports.logout = exports.login = exports.signup = void 0;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const generateToken_1 = require("../utils/generateToken");
const googleAuth_1 = require("../utils/googleAuth");
const signup = async (req, res) => {
    try {
        const { name, email, password, role, } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'name, email and password are required',
            });
        }
        const normalizedRole = role ?? 'candidate';
        if (normalizedRole !== 'candidate' && normalizedRole !== 'employer') {
            return res.status(400).json({
                error: "role must be either 'candidate' or 'employer'",
            });
        }
        const normalizedEmail = email.toLowerCase();
        // check if user already exists
        const userExists = await db_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (userExists) {
            return res.status(400).json({
                error: 'user already exists with the email entered',
            });
        }
        // hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const createdUserData = await db_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    password: hashedPassword,
                    role: normalizedRole,
                },
            });
            return { user };
        });
        // generate JWT
        const token = (0, generateToken_1.generateToken)(createdUserData.user.id, res);
        return res.status(201).json({
            status: 'success',
            user: {
                id: createdUserData.user.id,
                name: createdUserData.user.name,
                email: createdUserData.user.email,
                picture: createdUserData.user.picture,
                role: normalizedRole,
            },
            employerProfile: null,
            token,
        });
    }
    catch (error) {
        console.error('Error in signup:', error);
        return res.status(500).json({
            error: 'internal server error',
        });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // check all fields entered
        if (!email || !password) {
            return res.status(400).json({
                error: 'email and password are required',
            });
        }
        const normalizedEmail = email.toLowerCase();
        // check if user exists in the table
        const user = await db_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                employerProfile: true,
            },
        });
        if (!user) {
            return res.status(401).json({
                error: 'invalid email or password',
            });
        }
        // verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'invalid email or password',
            });
        }
        // generate JWT
        const token = (0, generateToken_1.generateToken)(user.id, res);
        return res.status(200).json({
            status: 'success',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
            },
            employerProfile: user.employerProfile,
            token,
        });
    }
    catch (error) {
        console.error('Error in login:', error);
        return res.status(500).json({
            error: 'internal server error',
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    // remove the jwt from cookies
    res.cookie(generateToken_1.AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
    });
    return res.status(200).json({
        status: 'success',
        message: 'logged out successfully',
    });
};
exports.logout = logout;
const getMe = async (req, res) => {
    // req.user is populated by the protect middleware
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            status: 'error',
            error: 'Not authorized',
        });
    }
    const employerProfile = await db_1.prisma.employerProfile.findUnique({
        where: { userId: user.id },
    });
    return res.status(200).json({
        status: 'success',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            role: user.role,
        },
        employerProfile,
    });
};
exports.getMe = getMe;
const googleAuthInit = async (req, res) => {
    console.log('DEBUG_OAUTH_ENV', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        client: googleAuth_1.googleClient._clientId,
    });
    const url = googleAuth_1.googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'consent',
    });
    res.redirect(url);
};
exports.googleAuthInit = googleAuthInit;
const googleAuthCallback = async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            return res.status(400).json({ error: 'OAuth code missing' });
        }
        const { tokens } = await googleAuth_1.googleClient.getToken(code);
        googleAuth_1.googleClient.setCredentials(tokens);
        const ticket = await googleAuth_1.googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res
                .status(400)
                .json({ error: 'Failed to retrieve email from Google' });
        }
        const email = payload.email.toLowerCase();
        const name = payload.name || 'Google User';
        const picture = payload.picture || '';
        let user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPassword = crypto_1.default.randomBytes(16).toString('hex');
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(randomPassword, salt);
            user = await db_1.prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    picture,
                    role: 'candidate',
                },
            });
        }
        (0, generateToken_1.generateToken)(user.id, res);
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(frontendUrl);
    }
    catch (error) {
        console.error('Error in Google OAuth:', error);
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/?error=oauth_failed`);
    }
};
exports.googleAuthCallback = googleAuthCallback;
