import portalService from '../services/portalService.js';

const portalController = {
  create: async (req, res, next) => {
    try {
      const { name, tags, invites } = req.body;

      const portal = await portalService.create({
        name,
        tags,
        invites,
        ownerId: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Portal creado correctamente',
        data: portal,
      });
    } catch (error) {
      next(error);
    }
  },

  listMine: async (req, res, next) => {
    try {
      const portals = await portalService.listMine({
        userId: req.user.id,
        email: req.user.email,
      });

      return res.status(200).json({
        success: true,
        message: 'Portales recuperados correctamente',
        data: portals,
      });
    } catch (error) {
      next(error);
    }
  },

  listMembers: async (req, res, next) => {
    try {
      const members = await portalService.listMembers({
        portalId: req.params.portalId,
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Miembros recuperados correctamente',
        data: members,
      });
    } catch (error) {
      next(error);
    }
  },

  getInvitationByCode: async (req, res, next) => {
    try {
      const invitation = await portalService.getInvitationByCode({
        code: req.params.code,
        email: req.user.email,
      });

      return res.status(200).json({
        success: true,
        message: 'Invitacion recuperada correctamente',
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  },

  respondToInvitation: async (req, res, next) => {
    try {
      const result = await portalService.respondToInvitation({
        code: req.params.code,
        email: req.user.email,
        userId: req.user.id,
        action: req.body.action,
      });

      return res.status(200).json({
        success: true,
        message: req.body.action === 'accept' ? 'Invitacion aceptada' : 'Invitacion rechazada',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteOwnedPortal: async (req, res, next) => {
    try {
      const result = await portalService.deleteOwnedPortal({
        portalId: req.params.portalId,
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Portal eliminado correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default portalController;
