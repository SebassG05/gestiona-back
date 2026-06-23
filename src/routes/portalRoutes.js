import { Router } from 'express';
import portalController from '../controllers/portalController.js';
import authenticate from '../middlewares/authenticate.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createPortalValidation } from '../validations/portalValidation.js';

const router = Router();

router.get('/mine', authenticate, portalController.listMine);
router.post('/', authenticate, createPortalValidation, validateRequest, portalController.create);

export default router;
