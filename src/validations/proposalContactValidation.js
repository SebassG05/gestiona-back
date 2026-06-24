import { body } from 'express-validator';

const relationshipStatuses = [
  'Por contactar',
  'Contactado',
  'En seguimiento',
  'Confirmado',
  'Descartado',
];

export const proposalContactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('El nombre debe tener entre 2 y 120 caracteres'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('El email no es valido')
    .normalizeEmail(),
  body('relationshipStatus')
    .optional()
    .isIn(relationshipStatuses)
    .withMessage('El estado de relacion no es valido'),
  body('lastContactAt')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('La fecha del ultimo contacto no es valida'),
];
