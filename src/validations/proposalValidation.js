import { body } from 'express-validator';

export const createProposalValidation = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre de la propuesta es obligatorio')
    .isLength({ min: 2, max: 140 }).withMessage('El nombre de la propuesta debe tener entre 2 y 140 caracteres'),
];
