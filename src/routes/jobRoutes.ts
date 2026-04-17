import express from 'express';
import {
  applyForJob,
  createJob,
  getAllOpenJobs,
  getJobById,
} from '../controllers/jobController';
import { protect } from '../middlewares/authMiddleware';
import { uploadResume } from '../middlewares/uploadResume';

const router = express.Router();

router.get('/', getAllOpenJobs);
router.get('/:jobId', getJobById);
router.post(
  '/:jobId/apply',
  protect,
  uploadResume.single('resumeFile'),
  applyForJob,
);
router.post('/', protect, createJob);

export default router;
