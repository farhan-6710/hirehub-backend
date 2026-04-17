import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeBase = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${safeBase}-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req: Request, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.pdf', '.doc', '.docx'];

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExt.includes(ext)) {
    cb(new Error('Only PDF, DOC, and DOCX resume files are allowed'));
    return;
  }

  cb(null, true);
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
