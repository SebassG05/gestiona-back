import { body } from 'express-validator';

export const worksheetsValidation = [
  body('driveId').isString().trim().notEmpty().withMessage('El driveId es obligatorio'),
  body('itemId').isString().trim().notEmpty().withMessage('El itemId es obligatorio'),
];

export const selectWorkbookValidation = [
  body('driveId').isString().trim().notEmpty().withMessage('El driveId es obligatorio'),
  body('itemId').isString().trim().notEmpty().withMessage('El itemId es obligatorio'),
  body('fileName').isString().trim().notEmpty().withMessage('El nombre del archivo es obligatorio'),
  body('webUrl').optional({ checkFalsy: true }).isURL().withMessage('La URL del archivo no es válida'),
  body('worksheetId').isString().trim().notEmpty().withMessage('La hoja es obligatoria'),
  body('worksheetName').isString().trim().notEmpty().withMessage('El nombre de la hoja es obligatorio'),
];
