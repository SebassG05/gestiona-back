import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';

const authService = {
  register: async ({ username, email, password }) => {
    const existingUser = await userRepository.findByEmailOrUsername(email, username);

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'nombre de usuario';
      const error = new Error(`El ${field} ya está en uso`);
      error.statusCode = 409;
      throw error;
    }

    const user = await userRepository.create({ username, email, password });

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      const error = new Error('Credenciales incorrectas');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('La cuenta está desactivada');
      error.statusCode = 403;
      throw error;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      const error = new Error('Credenciales incorrectas');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  },
};

export default authService;
