import proposalContactService from '../services/proposalContactService.js';

const proposalContactController = {
  list: async (req, res, next) => {
    try {
      const result = await proposalContactService.list({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        userId: req.user.id,
      });

      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const contact = await proposalContactService.create({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        userId: req.user.id,
        data: req.body,
      });

      return res.status(201).json({
        success: true,
        message: 'Contacto añadido correctamente',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const contact = await proposalContactService.update({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        contactId: req.params.contactId,
        userId: req.user.id,
        data: req.body,
      });

      return res.json({
        success: true,
        message: 'Contacto actualizado correctamente',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const contact = await proposalContactService.remove({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        contactId: req.params.contactId,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        message: 'Contacto eliminado correctamente',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default proposalContactController;
