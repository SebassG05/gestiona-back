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

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión correcto',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
