import { body } from 'express-validator';

export const importOpportunityWorkbookValidation = [
  body('category')
    .optional()
    .isIn(['opportunities', 'contacts'])
    .withMessage('La categoria del Excel no es valida'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('El nombre de la página es obligatorio'),
  body('sourceFileName')
    .trim()
    .isLength({ min: 1, max: 180 })
    .withMessage('El nombre del archivo no es válido'),
  body('sheetName')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('El nombre de la hoja no es válido'),
  body('headerRow')
    .isInt({ min: 1, max: 100 })
    .withMessage('La fila de cabeceras no es válida'),
  body('headers')
    .isArray({ min: 1, max: 100 })
    .withMessage('El Excel debe incluir entre 1 y 100 columnas'),
  body('rows')
    .isArray({ min: 1, max: 3000 })
    .withMessage('El Excel debe incluir entre 1 y 3000 filas'),
  body('rows.*')
    .isArray({ min: 1, max: 100 })
    .withMessage('Cada fila debe contener entre 1 y 100 celdas'),
];
