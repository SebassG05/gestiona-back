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

export const linkOpportunityContactsValidation = [
  body('contactRowIds')
    .isArray({ min: 1, max: 200 })
    .withMessage('Debes seleccionar entre 1 y 200 contactos'),
  body('contactRowIds.*')
    .isMongoId()
    .withMessage('Uno de los contactos seleccionados no es valido'),
];

export const linkedOpportunityContactsValidation = [
  body('rowIds')
    .isArray({ min: 1, max: 200 })
    .withMessage('Debes indicar entre 1 y 200 filas de oportunidad'),
  body('rowIds.*')
    .isMongoId()
    .withMessage('Una de las filas de oportunidad no es valida'),
];
