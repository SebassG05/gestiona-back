import mongoose from 'mongoose';
import OpportunityWorkbookRow from '../models/OpportunityWorkbookRow.js';
import PortalFavorite from '../models/PortalFavorite.js';
import Proposal from '../models/Proposal.js';
import portalRepository from '../repositories/portalRepository.js';

const entityModels = {
  proposal: Proposal,
  opportunity: OpportunityWorkbookRow,
};

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const assertPortalAccess = async (portalId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(portalId)) fail('Portal no valido', 400);
  const portal = await portalRepository.findById(portalId).select('owner members');
  if (!portal) fail('Portal no encontrado', 404);
  const allowedIds = [portal.owner, ...(portal.members || [])].map(String);
  if (!allowedIds.includes(String(userId))) fail('No tienes acceso a este portal', 403);
};

const list = async ({ portalId, userId }) => {
  await assertPortalAccess(portalId, userId);
  const favorites = await PortalFavorite.find({ portal: portalId }).lean();
  return {
    proposals: [...new Set(favorites.filter((item) => item.entityType === 'proposal').map((item) => String(item.entityId)))],
    opportunities: [...new Set(favorites.filter((item) => item.entityType === 'opportunity').map((item) => String(item.entityId)))],
  };
};

const set = async ({ portalId, userId, entityType, entityId, favorite }) => {
  await assertPortalAccess(portalId, userId);
  const Model = entityModels[entityType];
  if (!Model || !mongoose.Types.ObjectId.isValid(entityId)) fail('Favorito no valido', 400);

  if (favorite) {
    const exists = await Model.exists({ _id: entityId, portal: portalId });
    if (!exists) fail('El elemento ya no existe en este portal', 404);
    const alreadyFavorite = await PortalFavorite.exists({ portal: portalId, entityType, entityId });
    if (!alreadyFavorite) {
      await PortalFavorite.create({ portal: portalId, user: userId, entityType, entityId });
    }
  } else {
    await PortalFavorite.deleteMany({ portal: portalId, entityType, entityId });
  }

  return { entityType, entityId, favorite: Boolean(favorite) };
};

export default { list, set };
