import userRepository from '../repositories/userRepository.js';

const userController = {
  updateMe: async (req, res, next) => {
    try {
      const username = req.body.username?.trim();

      if (!username) {
        const error = new Error('El nombre de usuario es obligatorio');
        error.statusCode = 400;
        return next(error);
      }

      if (username.length < 3 || username.length > 30) {
        const error = new Error('El nombre de usuario debe tener entre 3 y 30 caracteres');
        error.statusCode = 400;
        return next(error);
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        const error = new Error('El nombre de usuario solo puede contener letras, numeros y guiones bajos');
        error.statusCode = 400;
        return next(error);
      }

      const existingUser = await userRepository.findByUsername(username);

      if (existingUser && existingUser._id.toString() !== req.user.id.toString()) {
        const error = new Error('Ese nombre de usuario ya esta en uso');
        error.statusCode = 409;
        return next(error);
      }

      const updatedUser = await userRepository.updateById(req.user.id, { username });

      return res.status(200).json({
        success: true,
        message: 'Nombre de usuario actualizado correctamente',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Un usuario solo puede eliminarse a sí mismo, salvo que sea admin
      if (req.user.role !== 'admin' && req.user.id.toString() !== id) {
        const error = new Error('No tienes permiso para eliminar este usuario');
        error.statusCode = 403;
        return next(error);
      }

      const deleted = await userRepository.deleteById(id);

      if (!deleted) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        return next(error);
      }

      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
