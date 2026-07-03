import { Router } from 'express';
import userController from '../controllers/userController.js';
import authenticate from '../middlewares/authenticate.js';

const router = Router();

router.patch('/me', authenticate, userController.updateMe);
router.delete('/:id', authenticate, userController.deleteUser);

export default router;
