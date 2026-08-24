import { describe, expect, test } from '@jest/globals';
import OpportunityContactLink from '../../../src/models/OpportunityContactLink.js';

const objectId = '507f1f77bcf86cd799439011';

const createLink = (overrides = {}) =>
  new OpportunityContactLink({
    portal: objectId,
    opportunityWorkbook: objectId,
    opportunityRow: objectId,
    contactWorkbook: objectId,
    contactRow: objectId,
    createdBy: objectId,
    ...overrides,
  });

describe('OpportunityContactLink contact tracking', () => {
  test('validates email, response and meeting tracking', async () => {
    const link = createLink({
      contactTracking: {
        emailSent: true,
        emailSentAt: new Date('2026-08-24T09:30:00.000Z'),
        responseReceived: true,
        responseNote: 'Quiere recibir mas informacion.',
        meetingScheduled: true,
        meetingAt: new Date('2026-08-26T10:00:00.000Z'),
        meetingTitle: 'Reunion con el investigador',
      },
    });

    await expect(link.validate()).resolves.toBeUndefined();
  });

  test('uses empty tracking defaults', async () => {
    const link = createLink();

    await expect(link.validate()).resolves.toBeUndefined();
    expect(link.contactTracking.emailSent).toBe(false);
    expect(link.contactTracking.responseReceived).toBe(false);
    expect(link.contactTracking.meetingScheduled).toBe(false);
  });

  test('rejects an excessively long response note', async () => {
    const link = createLink({
      contactTracking: {
        responseReceived: true,
        responseNote: 'a'.repeat(4001),
      },
    });

    await expect(link.validate()).rejects.toThrow();
  });
});
