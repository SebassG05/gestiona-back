import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import portalRepository from '../repositories/portalRepository.js';
import repository from '../repositories/proposalValuationRepository.js';

const workbook = JSON.parse(readFileSync(new URL('../data/proposalValuations.json', import.meta.url), 'utf8'));
const seeds = new Map(workbook.rows.map((row) => [row.id, { expectedEvaluation: '', ...row }]));
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const idOf = (value) => String(value?._id || value);

const authorize = async ({ portalId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(portalId)) throw fail('Portal no válido');
  const portal = await portalRepository.findById(portalId);
  if (!portal) throw fail('Portal no encontrado', 404);
  if (!portal.members.some((member) => idOf(member) === idOf(userId))) {
    throw fail('No tienes acceso a este portal', 403);
  }
};

export const normalizeValuation = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail('Valoración no válida');
  const result = {};
  for (const [field, max] of Object.entries({ proposal: 250, summary: 10000, expectedEvaluation: 1000, call: 500, folder: 250, notes: 10000 })) {
    const value = data[field] ?? '';
    if (typeof value !== 'string' || value.length > max) throw fail(`El campo ${field} no es válido`);
    result[field] = value.trim();
  }
  if (!result.proposal) throw fail('El nombre de la propuesta es obligatorio');
  if (!['string', 'number'].includes(typeof data.year) || !/^\d{4}$/.test(String(data.year))) {
    throw fail('Introduce un año válido');
  }
  result.year = Number(data.year);
  if (result.year < 1900 || result.year > 2100) throw fail('El año debe estar entre 1900 y 2100');
  for (const field of ['excellence', 'impact', 'quality']) {
    const value = data[field];
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      result[field] = null;
      continue;
    }
    if (!['number', 'string'].includes(typeof value)) throw fail('Las puntuaciones deben ser números entre 0 y 5');
    const number = Number(typeof value === 'string' ? value.trim().replace(',', '.') : value);
    if (!Number.isFinite(number) || number < 0 || number > 5) throw fail('Las puntuaciones deben estar entre 0 y 5');
    result[field] = number;
  }
  const scores = [result.excellence, result.impact, result.quality].filter((value) => value !== null);
  result.total = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) * 100) / 100 : null;
  return result;
};

const mapRow = (row) => ({
  id: row.rowId,
  expectedEvaluation: row.expectedEvaluation ?? '',
  ...Object.fromEntries(['proposal', 'year', 'summary', 'excellence', 'impact', 'quality', 'total', 'call', 'folder', 'notes'].map((field) => [field, row[field]])),
});

export default {
  list: async (context) => {
    await authorize(context);
    // The spreadsheet is the starting point; portal-specific edits never alter it.
    const rows = new Map(seeds);
    for (const row of await repository.list(context.portalId)) rows.set(row.rowId, mapRow(row));
    const deleted = repository.listDeleted ? await repository.listDeleted(context.portalId) : [];
    deleted.forEach(({ rowId }) => rows.delete(rowId));
    return { rows: [...rows.values()], notes: workbook.notes, source: workbook.source };
  },
  create: async (context, data) => {
    await authorize(context);
    const row = await repository.create({ ...normalizeValuation(data), portal: context.portalId, rowId: randomUUID() });
    return mapRow(row);
  },
  update: async (context, rowId, data) => {
    await authorize(context);
    if (typeof rowId !== 'string' || rowId.length > 80) throw fail('Valoración no válida');
    const current = await repository.find(context.portalId, rowId) || seeds.get(rowId);
    if (!current) throw fail('Valoración no encontrada', 404);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail('Valoración no válida');
    const row = await repository.save(context.portalId, rowId, normalizeValuation({ ...current, ...data }));
    return mapRow(row);
  },
  remove: async (context, rowId) => {
    await authorize(context);
    if (typeof rowId !== 'string' || rowId.length > 80) throw fail('Valoración no válida');
    const current = await repository.find(context.portalId, rowId) || seeds.get(rowId);
    if (!current) throw fail('Valoración no encontrada', 404);
    await repository.markDeleted(context.portalId, rowId);
    return { id: rowId };
  },
};
