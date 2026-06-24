import { body } from 'express-validator';

export const createProposalValidation = [
  body('nombre')
    .trim()
    .custom((value, { req }) => {
      if (req.body.lifecycleStatus === 'draft') {
        if (!value) return true;
        if (value.length < 2 || value.length > 140) {
          throw new Error('El nombre de la propuesta debe tener entre 2 y 140 caracteres');
        }
        return true;
      }

      if (!value) {
        throw new Error('El nombre de la propuesta es obligatorio');
      }

      if (value.length < 2 || value.length > 140) {
        throw new Error('El nombre de la propuesta debe tener entre 2 y 140 caracteres');
      }

      return true;
    }),
  body('lifecycleStatus')
    .optional()
    .isIn(['active', 'draft', 'sent'])
    .withMessage('El estado interno de la propuesta no es valido'),
];

export const updateProposalValidation = createProposalValidation;

export const importProposalsValidation = [
  body('proposals')
    .isArray({ min: 1, max: 500 })
    .withMessage('Debes importar entre 1 y 500 propuestas'),
  body('proposals.*.nombre')
    .trim()
    .isLength({ min: 2, max: 140 })
    .withMessage('Cada propuesta debe tener un nombre de entre 2 y 140 caracteres'),
  body('proposals.*.lifecycleStatus')
    .optional()
    .isIn(['active', 'draft', 'sent'])
    .withMessage('El estado interno de una propuesta no es valido'),
];
