"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const employerController_1 = require("../controllers/employerController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/dashboard', employerController_1.getEmployerDashboard);
router.get('/profile', employerController_1.getEmployerProfile);
router.get('/my-jobs', employerController_1.getEmployerJobs);
router.delete('/jobs/:jobId', employerController_1.deleteEmployerJob);
router.get('/jobs/:jobId/applications', employerController_1.getJobApplicationsForEmployer);
router.patch('/applications/:applicationId/status', employerController_1.updateApplicationStatus);
exports.default = router;
