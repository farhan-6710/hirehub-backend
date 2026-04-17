import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
  getEmployerDashboard,
  getEmployerProfile,
  getEmployerJobs,
  deleteEmployerJob,
  getJobApplicationsForEmployer,
  updateApplicationStatus,
} from '../controllers/employerController';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getEmployerDashboard);
router.get('/profile', getEmployerProfile);
router.get('/my-jobs', getEmployerJobs);
router.delete('/jobs/:jobId', deleteEmployerJob);
router.get('/jobs/:jobId/applications', getJobApplicationsForEmployer);
router.patch('/applications/:applicationId/status', updateApplicationStatus);

export default router;
