import { Router } from 'express';
import portalController from '../controllers/portalController.js';
import proposalController from '../controllers/proposalController.js';
import authenticate from '../middlewares/authenticate.js';
import validateRequest from '../middlewares/validateRequest.js';
import { respondInvitationValidation } from '../validations/invitationValidation.js';
import { createPortalValidation } from '../validations/portalValidation.js';
import { createProposalValidation } from '../validations/proposalValidation.js';

const router = Router();

router.get('/mine', authenticate, portalController.listMine);
router.get('/invitations/:code', authenticate, portalController.getInvitationByCode);
router.get('/:portalId/members', authenticate, portalController.listMembers);
router.post(
  '/:portalId/proposals',
  authenticate,
  createProposalValidation,
  validateRequest,
  proposalController.create
);
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
