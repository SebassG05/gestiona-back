import { Router } from 'express';
import portalController from '../controllers/portalController.js';
import authenticate from '../middlewares/authenticate.js';
import validateRequest from '../middlewares/validateRequest.js';
import { respondInvitationValidation } from '../validations/invitationValidation.js';
import { createPortalValidation } from '../validations/portalValidation.js';

const router = Router();

router.get('/mine', authenticate, portalController.listMine);
router.get('/invitations/:code', authenticate, portalController.getInvitationByCode);
router.post(
  '/invitations/:code/respond',
  authenticate,
  respondInvitationValidation,
  validateRequest,
  portalController.respondToInvitation
);
router.delete('/:portalId', authenticate, portalController.deleteOwnedPortal);
router.post('/', authenticate, createPortalValidation, validateRequest, portalController.create);

export default router;
