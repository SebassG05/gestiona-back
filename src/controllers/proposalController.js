import proposalService from '../services/proposalService.js';

const proposalController = {
  listByPortal: async (req, res, next) => {
    try {
      const proposals = await proposalService.listByPortal({
        portalId: req.params.portalId,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        data: proposals,
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const proposal = await proposalService.getById({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        data: proposal,
      });
    } catch (error) {
      next(error);
    }
  },

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

  update: async (req, res, next) => {
    try {
      const proposal = await proposalService.update({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        userId: req.user.id,
        data: req.body,
      });

      return res.json({
        success: true,
        message: 'Propuesta actualizada correctamente',
        data: proposal,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default proposalController;
