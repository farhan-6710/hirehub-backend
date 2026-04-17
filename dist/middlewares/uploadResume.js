"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResume = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'resumes');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const safeBase = file.originalname
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 50);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${safeBase}-${Date.now()}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const allowedExt = ['.pdf', '.doc', '.docx'];
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExt.includes(ext)) {
        cb(new Error('Only PDF, DOC, and DOCX resume files are allowed'));
        return;
    }
    cb(null, true);
};
exports.uploadResume = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
