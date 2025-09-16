import multer from 'multer';
import path from 'path';
import type { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});