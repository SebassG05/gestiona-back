import proposalService from '../services/proposalService.js';

const proposalController = {
  create: async (req, res, next) => {
    try {
      const proposal = await proposalService.create({
        portalId: req.params.portalId,
        userId: req.user.id,
        data: req.body,
      });

      return res.status(201).json({
        success: true,
        message: 'Propuesta creada correctamente',
        data: proposal,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default proposalController;
