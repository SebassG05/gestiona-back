import portalRepository from '../repositories/portalRepository.js';
import proposalCompanyRepository from '../repositories/proposalCompanyRepository.js';
import proposalOpportunityRepository from '../repositories/proposalOpportunityRepository.js';
import proposalRepository from '../repositories/proposalRepository.js';

const repositories = {
  opportunities: proposalOpportunityRepository,
  companies: proposalCompanyRepository,
};

const nullableDate = (value) => {
  if (!value) return null;
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const builders = {
  opportunities: (data) => ({
    destination: data.destination,
    subDestination: data.subDestination,
    topicId: data.topicId,
    opening: nullableDate(data.opening),
    deadline: nullableDate(data.deadline),
    company: data.company,
    project: data.project,
    role: data.role,
    email: data.email,
    typeOfAction: data.typeOfAction,
    linkCall: data.linkCall,
    announcement: data.announcement || '',
    potentialMessage: data.potentialMessage,
  }),
  companies: (data) => ({
    acronym: data.acronym,
    entities: data.entities,
    countries: data.countries,
    pilots: data.pilots,
    nda: data.nda || '',
    emailList: data.emailList,
    partA: data.partA,
    participantPortalInvitation: data.participantPortalInvitation,
  }),
};

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

const getResource = (resource) => {
  const repository = repositories[resource];
  const buildData = builders[resource];

  if (!repository || !buildData) {
    const error = new Error('El tipo de relacion no es valido');
    error.statusCode = 400;
    throw error;
  }

  return { repository, buildData };
};

const proposalRelationService = {
  list: async ({ resource, portalId, proposalId, userId }) => {
    const proposal = await assertProposalAccess({ portalId, proposalId, userId });
    const { repository } = getResource(resource);
    const items = await repository.findByProposal(proposalId, portalId);

    return { proposal, items };
  },

  create: async ({ resource, portalId, proposalId, userId, data }) => {
    await assertProposalAccess({ portalId, proposalId, userId });
    const { repository, buildData } = getResource(resource);

    return repository.create({
      portal: portalId,
      proposal: proposalId,
      createdBy: userId,
      ...buildData(data),
    });
  },

  update: async ({ resource, portalId, proposalId, itemId, userId, data }) => {
    await assertProposalAccess({ portalId, proposalId, userId });
    const { repository, buildData } = getResource(resource);
    const item = await repository.updateByIdAndProposal(
      itemId,
      proposalId,
      portalId,
      buildData(data)
    );

    if (!item) {
      const error = new Error('El registro no existe');
      error.statusCode = 404;
      throw error;
    }

    return item;
  },

  remove: async ({ resource, portalId, proposalId, itemId, userId }) => {
    await assertProposalAccess({ portalId, proposalId, userId });
    const { repository } = getResource(resource);
    const item = await repository.deleteByIdAndProposal(itemId, proposalId, portalId);

    if (!item) {
      const error = new Error('El registro no existe');
      error.statusCode = 404;
      throw error;
    }

    return item;
  },
};

export default proposalRelationService;
