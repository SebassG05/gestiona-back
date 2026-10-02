import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const portalId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';
const repository = { list: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), listDeleted: jest.fn(), markDeleted: jest.fn() };
const portalRepository = { findById: jest.fn() };
jest.unstable_mockModule('../../../src/repositories/proposalValuationRepository.js', () => ({ default: repository }));
jest.unstable_mockModule('../../../src/repositories/portalRepository.js', () => ({ default: portalRepository }));
const { default: service, normalizeValuation } = await import('../../../src/services/proposalValuationService.js');
const { default: ProposalValuation } = await import('../../../src/models/ProposalValuation.js');
const context = { portalId, userId };
const input = { proposal: 'Nueva propuesta', year: 2026, excellence: 3.33, impact: 3.5, quality: 4.33 };

beforeEach(() => {
  jest.resetAllMocks();
  portalRepository.findById.mockResolvedValue({ _id: portalId, members: [userId] });
  repository.list.mockResolvedValue([]);
  repository.listDeleted.mockResolvedValue([]);
  repository.find.mockResolvedValue(null);
  repository.create.mockImplementation(async (data) => data);
  repository.save.mockImplementation(async (portal, rowId, data) => ({ ...data, portal, rowId }));
  repository.markDeleted.mockResolvedValue({});
});

describe('Proposal valuations', () => {
  test('preserves all 85 spreadsheet records, exact scores and notes', async () => {
    const data = await service.list(context);
    expect(data.rows).toHaveLength(85);
    expect(data.notes).toHaveLength(8);
    expect(data.rows.filter((row) => row.total === null)).toHaveLength(11);
    expect(data.rows.find((row) => row.proposal === 'HPV-VAC')).toMatchObject({ excellence: 2.5, impact: 2.5, quality: null, total: 5 });
    expect(data.rows.find((row) => row.proposal === 'BIOSEEDER').total).toBe(11.16);
    for (const row of data.rows) {
      await expect(new ProposalValuation({ ...row, rowId: row.id, portal: portalId }).validate()).resolves.toBeUndefined();
    }
  });

  test('calculates totals, ignores a client-supplied total and preserves real zero scores', () => {
    expect(normalizeValuation({ ...input, total: 99 }).total).toBe(11.16);
    expect(normalizeValuation({ ...input, excellence: 0, impact: '', quality: null })).toMatchObject({ excellence: 0, impact: null, quality: null, total: 0 });
    expect(normalizeValuation({ ...input, excellence: '', impact: '', quality: '' }).total).toBeNull();
    expect(normalizeValuation({ ...input, excellence: '2,5', impact: 3, quality: '' }).total).toBe(5.5);
  });

  test.each([-1, 5.01, 'invalid', true, [], {}, Infinity])('rejects invalid score %p', (score) => {
    expect(() => normalizeValuation({ ...input, excellence: score })).toThrow();
  });

  test.each([{ proposal: ' ' }, { year: 2026.5 }, { year: null }, { year: 2101 }, { summary: {} }])('rejects invalid fields %p', (fields) => {
    expect(() => normalizeValuation({ ...input, ...fields })).toThrow();
  });

  test('creates a row scoped to the portal and returns it on the next load', async () => {
    const created = await service.create(context, { ...input, portal: 'another-portal', rowId: 'excel-2' });
    const stored = repository.create.mock.calls[0][0];
    expect(stored.portal).toBe(portalId);
    expect(created.id).not.toBe('excel-2');
    repository.list.mockResolvedValue([stored]);
    expect((await service.list(context)).rows).toContainEqual(created);
  });

  test('edits a spreadsheet row without duplicating it or changing the source', async () => {
    const updated = await service.update(context, 'excel-2', { quality: 5 });
    expect(updated.total).toBe(12);
    repository.list.mockResolvedValue([{ ...updated, rowId: updated.id }]);
    const data = await service.list(context);
    expect(data.rows).toHaveLength(85);
    expect(data.rows[0].quality).toBe(5);
    repository.list.mockResolvedValue([]);
    expect((await service.list(context)).rows[0].quality).toBe(3.5);
    expect(repository.save).toHaveBeenCalledWith(portalId, 'excel-2', expect.objectContaining({ quality: 5 }));
  });

  test('rejects a row belonging to a different portal', async () => {
    await expect(service.update(context, 'other-portal-row', input)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.find).toHaveBeenCalledWith(portalId, 'other-portal-row');
    expect(repository.save).not.toHaveBeenCalled();
  });

  test('blocks reading, adding and editing for non-members', async () => {
    portalRepository.findById.mockResolvedValue({ members: [] });
    await expect(service.list(context)).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.create(context, input)).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.update(context, 'excel-2', input)).rejects.toMatchObject({ statusCode: 403 });
    expect(repository.list).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  test('deletes both imported and newly added rows for this portal', async () => {
    await expect(service.remove(context, 'excel-2')).resolves.toEqual({ id: 'excel-2' });
    await expect(service.remove(context, 'not-found')).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.markDeleted).toHaveBeenCalledWith(portalId, 'excel-2');
  });
});
