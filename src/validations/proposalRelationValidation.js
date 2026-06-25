import { body, param } from 'express-validator';

export const proposalRelationResourceValidation = [
  param('resource')
    .isIn(['opportunities', 'companies'])
    .withMessage('El tipo de relacion no es valido'),
];

export const proposalRelationValidation = [
  ...proposalRelationResourceValidation,
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('El email no es valido')
    .normalizeEmail(),
  body('opening')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('La fecha de apertura no es valida'),
  body('deadline')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('La fecha limite no es valida'),
  body('announcement')
    .optional()
    .isIn(['', 'Y', 'N'])
    .withMessage('El anuncio debe ser Y o N'),
  body('nda')
    .optional()
    .isIn(['', 'Y', 'N'])
    .withMessage('El NDA debe ser Y o N'),
];
