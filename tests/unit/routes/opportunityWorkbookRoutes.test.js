import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';

const NOTE_URL =
  '/api/portals/507f1f77bcf86cd799439011/opportunity-workbooks/507f1f77bcf86cd799439012/rows/507f1f77bcf86cd799439013/note';

describe('opportunity workbook note route', () => {
  it('registers the PATCH note endpoint', async () => {
    const response = await request(app).patch(NOTE_URL).send({ note: 'test' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token de autenticación no proporcionado');
  });
});
