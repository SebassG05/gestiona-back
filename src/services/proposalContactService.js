import portalRepository from '../repositories/portalRepository.js';
import proposalContactRepository from '../repositories/proposalContactRepository.js';
import proposalRepository from '../repositories/proposalRepository.js';

const nullableDate = (value) => {
  if (!value) return null;
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const buildContactData = (data) => ({
  name: data.name?.trim(),
  organization: data.organization,
  position: data.position,
  email: data.email,
  phone: data.phone,
  relationshipStatus: data.relationshipStatus || 'Por contactar',
  lastContactAt: nullableDate(data.lastContactAt),
  nextAction: data.nextAction,
  notes: data.notes,
});

const assertProposalAccess = async ({ portalId, proposalId, userId }) => {
  const portal = await portalRepository.findById(portalId);

  if (!portal) {
    const error = new Error('El portal no existe');
    error.statusCode = 404;
    throw error;
  }

  if (!portal.members.some((member) => member.equals(userId))) {
    const error = new Error('No tienes acceso a este portal');
    error.statusCode = 403;
    throw error;
  }

  const proposal = await proposalRepository.findByIdAndPortal(proposalId, portalId);

  if (!proposal) {
    const error = new Error('La propuesta no existe');
    error.statusCode = 404;
    throw error;
  }

  return proposal;
};

const proposalContactService = {
  list: async ({ portalId, proposalId, userId }) => {
    const proposal = await assertProposalAccess({ portalId, proposalId, userId });
    const contacts = await proposalContactRepository.findByProposal(proposalId, portalId);

    return { proposal, contacts };
  },

  create: async ({ portalId, proposalId, userId, data }) => {
    await assertProposalAccess({ portalId, proposalId, userId });

    return proposalContactRepository.create({
      portal: portalId,
      proposal: proposalId,
      createdBy: userId,
      ...buildContactData(data),
    });
  },

  update: async ({ portalId, proposalId, contactId, userId, data }) => {
    await assertProposalAccess({ portalId, proposalId, userId });
    const contact = await proposalContactRepository.updateByIdAndProposal(
      contactId,
      proposalId,
      portalId,
      buildContactData(data)
    );

    if (!contact) {
      const error = new Error('El contacto no existe');
      error.statusCode = 404;
      throw error;
    }

    return contact;
  },

  remove: async ({ portalId, proposalId, contactId, userId }) => {
    await assertProposalAccess({ portalId, proposalId, userId });
    const contact = await proposalContactRepository.deleteByIdAndProposal(
      contactId,
      proposalId,
      portalId
    );

    if (!contact) {
      const error = new Error('El contacto no existe');
      error.statusCode = 404;
      throw error;
    }

    return contact;
  },
};

export default proposalContactService;
