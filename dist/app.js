"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../src/middlewares/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const employerRoutes_1 = __importDefault(require("./routes/employerRoutes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// API routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/jobs', jobRoutes_1.default);
app.use('/api/v1/employer', employerRoutes_1.default);
// Global error handler (should be after routes)
app.use(errorHandler_1.errorHandler);
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', message: 'server is running all fine' });
});
exports.default = app;
