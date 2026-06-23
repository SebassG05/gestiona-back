import { body } from 'express-validator';

export const respondInvitationValidation = [
  body('action')
    .trim()
    .notEmpty().withMessage('La accion es obligatoria')
    .isIn(['accept', 'reject']).withMessage('La accion debe ser accept o reject'),
];
