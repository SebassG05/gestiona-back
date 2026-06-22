import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../src/app.js';
import User from '../../../src/models/User.js';

const REGISTER_URL = '/api/auth/register';

const TEST_USER = {
  username: 'e2e_testuser',
  email: 'e2e_test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
};

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI no está definida en el .env');
  }
  await mongoose.connect(process.env.MONGO_URI);
  // Limpia antes de empezar para que los tests sean repetibles
  await User.deleteMany({ username: TEST_USER.username });
  await User.deleteMany({ email: TEST_USER.email });
  await User.deleteMany({ email: 'otro@example.com' });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/auth/register – E2E (MongoDB real)', () => {
  it('debería crear el usuario en la base de datos y devolver 201', async () => {
    const response = await request(app).post(REGISTER_URL).send(TEST_USER);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Usuario registrado correctamente');
    expect(response.body.data).toMatchObject({
      username: TEST_USER.username,
      email: TEST_USER.email,
      role: 'user',
    });
    expect(response.body.data.password).toBeUndefined();

    // Verificar que realmente existe en MongoDB
    const userInDB = await User.findOne({ email: TEST_USER.email }).select('+password');
    expect(userInDB).not.toBeNull();
    expect(userInDB.username).toBe(TEST_USER.username);
    expect(userInDB.role).toBe('user');
    expect(userInDB.isActive).toBe(true);
  });

  it('la contraseña debe estar hasheada en la base de datos', async () => {
    await request(app).post(REGISTER_URL).send(TEST_USER);

    const userInDB = await User.findOne({ email: TEST_USER.email }).select('+password');
    expect(userInDB.password).not.toBe(TEST_USER.password);
    expect(userInDB.password).toMatch(/^\$2[ab]\$\d+\$/); // formato bcrypt
  });

  it('debería devolver 409 si se intenta registrar el mismo email dos veces', async () => {
    await request(app).post(REGISTER_URL).send(TEST_USER);

    const response = await request(app).post(REGISTER_URL).send(TEST_USER);
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('debería devolver 409 si se intenta registrar el mismo username con diferente email', async () => {
    await request(app).post(REGISTER_URL).send(TEST_USER);

    const response = await request(app).post(REGISTER_URL).send({
      ...TEST_USER,
      email: 'otro@example.com',
    });
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('nombre de usuario');
  });

  it('debería devolver 422 y NO crear el usuario si la validación falla', async () => {
    const invalidUser = {
      username: 'e2e_invalid_user',
      email: 'e2e_invalid@example.com',
      password: '123',
      confirmPassword: '123',
    };

    const response = await request(app).post(REGISTER_URL).send(invalidUser);

    expect(response.status).toBe(422);

    const userInDB = await User.findOne({ email: invalidUser.email });
    expect(userInDB).toBeNull();
  });
});
