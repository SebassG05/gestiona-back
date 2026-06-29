import { Router } from 'express';
import portalController from '../controllers/portalController.js';
import portalExcelController from '../controllers/portalExcelController.js';
import opportunityWorkbookController from '../controllers/opportunityWorkbookController.js';
import proposalContactController from '../controllers/proposalContactController.js';
import proposalController from '../controllers/proposalController.js';
import proposalRelationController from '../controllers/proposalRelationController.js';
import authenticate from '../middlewares/authenticate.js';
import validateRequest from '../middlewares/validateRequest.js';
import { respondInvitationValidation } from '../validations/invitationValidation.js';
import { importOpportunityWorkbookValidation } from '../validations/opportunityWorkbookValidation.js';
import { createPortalValidation } from '../validations/portalValidation.js';
import {
  selectWorkbookValidation,
  worksheetsValidation,
} from '../validations/portalExcelValidation.js';
import { proposalContactValidation } from '../validations/proposalContactValidation.js';
import {
  proposalRelationResourceValidation,
  proposalRelationValidation,
} from '../validations/proposalRelationValidation.js';
import {
  createProposalValidation,
  importProposalsValidation,
  updateProposalValidation,
} from '../validations/proposalValidation.js';

const router = Router();

router.get('/microsoft/callback', portalExcelController.callback);
router.get('/mine', authenticate, portalController.listMine);
router.get('/invitations/:code', authenticate, portalController.getInvitationByCode);
router.get('/:portalId/members', authenticate, portalController.listMembers);
router.get(
  '/:portalId/opportunity-workbooks',
  authenticate,
  opportunityWorkbookController.list
);
router.get(
  '/:portalId/opportunity-workbooks/search',
  authenticate,
  opportunityWorkbookController.search
);
router.get(
  '/:portalId/opportunity-workbooks/:workbookId',
  authenticate,
  opportunityWorkbookController.getById
);
router.post(
  '/:portalId/opportunity-workbooks/import',
  authenticate,
  importOpportunityWorkbookValidation,
  validateRequest,
  opportunityWorkbookController.import
);
router.delete(
  '/:portalId/opportunity-workbooks/:workbookId',
  authenticate,
  opportunityWorkbookController.remove
);
router.get('/:portalId/excel-link/status', authenticate, portalExcelController.status);
router.get('/:portalId/excel-link/connect-url', authenticate, portalExcelController.connectUrl);
router.get('/:portalId/excel-link/files', authenticate, portalExcelController.files);
router.post(
  '/:portalId/excel-link/worksheets',
  authenticate,
  worksheetsValidation,
  validateRequest,
  portalExcelController.worksheets
);
router.post(
  '/:portalId/excel-link/select',
  authenticate,
  selectWorkbookValidation,
  validateRequest,
  portalExcelController.select
);
router.post('/:portalId/excel-link/sync', authenticate, portalExcelController.sync);
router.get('/:portalId/excel-link/rows', authenticate, portalExcelController.rows);
router.delete('/:portalId/excel-link', authenticate, portalExcelController.disconnect);
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
router.get(
  '/:portalId/proposals/:proposalId/:resource',
  authenticate,
  proposalRelationResourceValidation,
  validateRequest,
  proposalRelationController.list
);
router.post(
  '/:portalId/proposals/:proposalId/:resource',
  authenticate,
  proposalRelationValidation,
  validateRequest,
  proposalRelationController.create
);
router.patch(
  '/:portalId/proposals/:proposalId/:resource/:itemId',
  authenticate,
  proposalRelationValidation,
  validateRequest,
  proposalRelationController.update
);
router.delete(
  '/:portalId/proposals/:proposalId/:resource/:itemId',
  authenticate,
  proposalRelationResourceValidation,
  validateRequest,
  proposalRelationController.remove
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
router.delete('/:portalId/proposals', authenticate, proposalController.removeAll);
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
