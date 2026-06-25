import microsoftGraphService from '../services/microsoftGraphService.js';
import portalExcelService from '../services/portalExcelService.js';

const portalExcelController = {
  callback: async (req, res) => {
    let portalId = '';
    try {
      const payload = microsoftGraphService.verifyState(req.query.state);
      portalId = payload.portalId;
      if (req.query.error) throw new Error(req.query.error_description || 'Autorización cancelada');
      await portalExcelService.completeAuthorization({
        code: req.query.code,
        state: req.query.state,
      });
      return res.redirect(microsoftGraphService.frontendRedirect({ portalId, status: 'connected' }));
    } catch (error) {
      return res.redirect(
        microsoftGraphService.frontendRedirect({
          portalId,
          status: 'error',
          message: error.message,
        })
      );
    }
  },

  status: async (req, res, next) => {
    try {
      const data = await portalExcelService.getStatus({
        portalId: req.params.portalId,
        userId: req.user.id,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  connectUrl: async (req, res, next) => {
    try {
      const url = await portalExcelService.getAuthorizationUrl({
        portalId: req.params.portalId,
        userId: req.user.id,
      });
      return res.json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  },

  files: async (req, res, next) => {
    try {
      const data = await portalExcelService.listFiles({
        portalId: req.params.portalId,
        userId: req.user.id,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  worksheets: async (req, res, next) => {
    try {
      const data = await portalExcelService.listWorksheets({
        portalId: req.params.portalId,
        userId: req.user.id,
        driveId: req.body.driveId,
        itemId: req.body.itemId,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  select: async (req, res, next) => {
    try {
      const data = await portalExcelService.selectWorkbook({
        portalId: req.params.portalId,
        userId: req.user.id,
        data: req.body,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  sync: async (req, res, next) => {
    try {
      const data = await portalExcelService.sync({
        portalId: req.params.portalId,
        userId: req.user.id,
      });
      return res.json({
        success: true,
        message: `${data.count} propuestas sincronizadas`,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  rows: async (req, res, next) => {
    try {
      const data = await portalExcelService.listRows({
        portalId: req.params.portalId,
        userId: req.user.id,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  disconnect: async (req, res, next) => {
    try {
      const data = await portalExcelService.disconnect({
        portalId: req.params.portalId,
        userId: req.user.id,
      });
      return res.json({ success: true, message: 'Excel desvinculado', data });
    } catch (error) {
      next(error);
    }
  },
};

export default portalExcelController;
