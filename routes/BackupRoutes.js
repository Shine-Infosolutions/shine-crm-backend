import express from 'express';
import { backupData } from '../controllers/BackupController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/export', adminAuth, backupData);

export default router;