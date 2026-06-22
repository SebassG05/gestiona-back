import userRepository from '../repositories/userRepository.js';

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
};

export default authService;
