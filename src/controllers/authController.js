import authService from '../services/authService.js';

const authController = {
  register: async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      const user = await authService.register({ username, email, password });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
