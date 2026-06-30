import { body } from 'express-validator';

export const createPortalValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del portal es obligatorio')
    .isLength({ min: 2, max: 80 }).withMessage('El nombre del portal debe tener entre 2 y 80 caracteres'),

  body('tags')
    .optional()
    .isArray({ max: 12 }).withMessage('Los tags deben enviarse como una lista de máximo 12 elementos'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 }).withMessage('Cada tag debe tener entre 1 y 30 caracteres'),

  body('invites')
    .optional()
    .isArray({ max: 25 }).withMessage('Las invitaciones deben enviarse como una lista de máximo 25 emails'),

  body('invites.*')
    .optional()
    .trim()
    .isEmail().withMessage('Cada invitación debe ser un email válido')
    .normalizeEmail(),
];

export const invitePortalMembersValidation = [
  body('invites')
    .isArray({ min: 1, max: 25 }).withMessage('Debes enviar entre 1 y 25 emails'),

  body('invites.*')
    .trim()
    .isEmail().withMessage('Cada invitacion debe ser un email valido')
    .normalizeEmail(),
];
