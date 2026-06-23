import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
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

  googleLogin: async ({ accessToken }) => {
    const googleClient = new OAuth2Client();
    const tokenInfo = await googleClient.getTokenInfo(accessToken);

    const { sub: googleId, email } = tokenInfo;

    if (!googleId || !email) {
      const error = new Error('Token de Google inválido');
      error.statusCode = 401;
      throw error;
    }

    // Obtener el nombre del usuario desde la userinfo API de Google
    const userInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );
    const { name } = await userInfoRes.json();

    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      // Si el email ya existe (cuenta creada manualmente), vinculamos el googleId
      user = await userRepository.findByEmail(email);
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        // Nuevo usuario — generamos un username único a partir del nombre de Google
        const baseName = (name || email.split('@')[0]);
        const baseUsername = baseName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        let username = baseUsername;
        let attempt = 1;
        while (await userRepository.findByUsername(username)) {
          username = `${baseUsername}_${attempt}`;
          attempt += 1;
        }
        user = await userRepository.create({ username, email, googleId });
      }
    }

    if (!user.isActive) {
      const error = new Error('La cuenta está desactivada');
      error.statusCode = 403;
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
