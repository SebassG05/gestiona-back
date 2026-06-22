import { Router } from 'express';
import authController from '../controllers/authController.js';
import { registerValidation } from '../validations/authValidation.js';
import validateRequest from '../middlewares/validateRequest.js';

const router = Router();

router.post('/register', registerValidation, validateRequest, authController.register);

export default router;
