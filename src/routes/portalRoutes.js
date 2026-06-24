import { Router } from 'express';
import portalController from '../controllers/portalController.js';
import proposalContactController from '../controllers/proposalContactController.js';
import proposalController from '../controllers/proposalController.js';
import authenticate from '../middlewares/authenticate.js';
import validateRequest from '../middlewares/validateRequest.js';
import { respondInvitationValidation } from '../validations/invitationValidation.js';
import { createPortalValidation } from '../validations/portalValidation.js';
import { proposalContactValidation } from '../validations/proposalContactValidation.js';
import {
  createProposalValidation,
  importProposalsValidation,
  updateProposalValidation,
} from '../validations/proposalValidation.js';

const router = Router();

router.get('/mine', authenticate, portalController.listMine);
router.get('/invitations/:code', authenticate, portalController.getInvitationByCode);
router.get('/:portalId/members', authenticate, portalController.listMembers);
router.get('/:portalId/proposals', authenticate, proposalController.listByPortal);
router.get(
  '/:portalId/proposals/:proposalId/contacts',
  authenticate,
  proposalContactController.list
);
router.post(
  '/:portalId/proposals/:proposalId/contacts',
  authenticate,
  proposalContactValidation,
  validateRequest,
  proposalContactController.create
);
router.patch(
  '/:portalId/proposals/:proposalId/contacts/:contactId',
  authenticate,
  proposalContactValidation,
  validateRequest,
  proposalContactController.update
);
router.delete(
  '/:portalId/proposals/:proposalId/contacts/:contactId',
  authenticate,
  proposalContactController.remove
);
router.get('/:portalId/proposals/:proposalId', authenticate, proposalController.getById);
router.post(
  '/:portalId/proposals/import',
  authenticate,
  importProposalsValidation,
  validateRequest,
  proposalController.createMany
);
router.post(
  '/:portalId/proposals',
  authenticate,
  createProposalValidation,
  validateRequest,
  proposalController.create
);
router.patch(
  '/:portalId/proposals/:proposalId',
  authenticate,
  updateProposalValidation,
  validateRequest,
  proposalController.update
);
router.delete('/:portalId/proposals/:proposalId', authenticate, proposalController.remove);
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
