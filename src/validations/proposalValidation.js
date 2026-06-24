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
