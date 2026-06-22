import userRepository from '../repositories/userRepository.js';

const userController = {
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
