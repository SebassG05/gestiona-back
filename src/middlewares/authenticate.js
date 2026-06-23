import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import userRepository from '../repositories/userRepository.js';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Token de autenticación no proporcionado');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      const error = new Error('Usuario no encontrado o desactivado');
      error.statusCode = 401;
      return next(error);
    }

    req.user = { id: user._id, email: user.email, role: user.role };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.message = 'Token inválido o expirado';
      error.statusCode = 401;
    }
    next(error);
  }
};

export default authenticate;
