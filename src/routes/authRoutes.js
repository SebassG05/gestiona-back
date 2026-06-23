import { Router } from 'express';
import authController from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validations/authValidation.js';
import validateRequest from '../middlewares/validateRequest.js';

const router = Router();

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/google', authController.googleLogin);

export default router;
