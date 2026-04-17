"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadResume_1 = require("../middlewares/uploadResume");
const router = express_1.default.Router();
router.get('/', jobController_1.getAllOpenJobs);
router.get('/:jobId', jobController_1.getJobById);
router.post('/:jobId/apply', authMiddleware_1.protect, uploadResume_1.uploadResume.single('resumeFile'), jobController_1.applyForJob);
router.post('/', authMiddleware_1.protect, jobController_1.createJob);
exports.default = router;
