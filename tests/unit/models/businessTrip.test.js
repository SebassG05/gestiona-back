import { describe, expect, test } from '@jest/globals';
import BusinessTrip from '../../../src/models/BusinessTrip.js';

const userId = '507f1f77bcf86cd799439011';

const createTrip = (overrides = {}) =>
  new BusinessTrip({
    portal: userId,
    title: 'Reunion de proyecto',
    destination: 'Madrid',
    startDate: new Date('2026-07-28T12:00:00.000Z'),
    endDate: new Date('2026-07-29T12:00:00.000Z'),
    assignedTo: userId,
    createdBy: userId,
    ...overrides,
  });

describe('BusinessTrip model', () => {
  test('validates a complete business trip', async () => {
    await expect(createTrip().validate()).resolves.toBeUndefined();
  });

  test('rejects an end date before the start date', async () => {
    const trip = createTrip({
      endDate: new Date('2026-07-27T12:00:00.000Z'),
    });

    await expect(trip.validate()).rejects.toThrow(
      'La fecha de vuelta no puede ser anterior a la salida'
    );
  });
});
