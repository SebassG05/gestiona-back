import portalRepository from '../repositories/portalRepository.js';
import proposalContactRepository from '../repositories/proposalContactRepository.js';
import proposalCompanyRepository from '../repositories/proposalCompanyRepository.js';
import proposalOpportunityRepository from '../repositories/proposalOpportunityRepository.js';
import proposalRepository from '../repositories/proposalRepository.js';
import ProposalControl from '../models/ProposalControl.js';

const nullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const nullableDate = (value) => {
  if (!value) return null;
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const optionalResponsable = (value) =>
  value && /^[a-f\d]{24}$/i.test(String(value)) ? value : null;

const buildPagination = ({ page, limit, total }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const currentPage = Math.min(safePage, totalPages);

  return {
    page: currentPage,
    limit: safeLimit,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

const normalizePriority = (value) => {
  const normalizedValue = String(value || '').trim().toUpperCase();
  const priorityMap = {
    A: 'Alta',
    ALTA: 'Alta',
    B: 'Media',
    MEDIA: 'Media',
    C: 'Baja',
    BAJA: 'Baja',
  };

  return priorityMap[normalizedValue] || value;
};

const buildProposalData = (data) => {
  const lifecycleStatus = data.lifecycleStatus || 'active';

  return {
    lifecycleStatus,
    nombre: data.nombre?.trim() || (lifecycleStatus === 'draft' ? 'Borrador sin titulo' : ''),
    proposalId: data.id,
    programa: data.programa,
    convocatoria: data.convocatoria,
    acronimo: data.acronimo,
    tipo: data.tipo,
    deadlineApertura: nullableDate(data.deadlineApertura),
    fase: data.fase,
    estado: data.estado,
    prioridad: normalizePriority(data.prioridad),
    responsable: optionalResponsable(data.responsable),
    responsableName: data.responsableName?.trim() || '',
    rolEvenor: data.rolEvenor,
    coordinadorLead: data.coordinadorLead,
    presupuestoTotal: nullableNumber(data.presupuestoTotal),
    presupuestoEvenor: nullableNumber(data.presupuestoEvenor),
    probabilidad: nullableNumber(data.probabilidad),
    valorEsperado: nullableNumber(data.valorEsperado),
    proyectoEjecucionVinculado: data.proyectoEjecucionVinculado,
    pagosRecibidosVinculados: nullableNumber(data.pagosRecibidosVinculados),
    balancePendiente: nullableNumber(data.balancePendiente),
    proximaAccion: data.proximaAccion,
    fuenteUrl: data.fuenteUrl,
    notas: data.notas,
  };
};

const getAccessiblePortal = async ({ portalId, userId }) => {
  const portal = await portalRepository.findById(portalId);

  if (!portal) {
    const error = new Error('El portal no existe');
    error.statusCode = 404;
    throw error;
  }

  const canAccess = portal.members.some((member) => member.equals(userId));

  if (!canAccess) {
    const error = new Error('No tienes acceso a este portal');
    error.statusCode = 403;
    throw error;
  }

  return portal;
};

const proposalService = {
  listByPortal: async ({ portalId, userId, page, limit }) => {
    await getAccessiblePortal({ portalId, userId });
    const total = await proposalRepository.countByPortal(portalId);
    const pagination = buildPagination({ page, limit, total });
    const skip = (pagination.page - 1) * pagination.limit;
    const proposals = await proposalRepository.findByPortalPaginated({
      portalId,
      skip,
      limit: pagination.limit,
    });
    const contactCounts = proposals.length
      ? await proposalContactRepository.countByProposalIds(
          portalId,
          proposals.map((proposal) => proposal._id)
        )
      : [];
    const countByProposal = new Map(
      contactCounts.map((item) => [item._id.toString(), item.count])
    );

    return {
      items: proposals.map((proposal) => ({
        ...proposal,
        contactCount: countByProposal.get(proposal._id.toString()) || 0,
      })),
      pagination,
    };
  },

  getById: async ({ portalId, proposalId, userId }) => {
    await getAccessiblePortal({ portalId, userId });
    const proposal = await proposalRepository.findByIdAndPortal(proposalId, portalId);

    if (!proposal) {
      const error = new Error('La propuesta no existe');
      error.statusCode = 404;
      throw error;
    }

    return proposal;
  },

  create: async ({ portalId, userId, data }) => {
    await getAccessiblePortal({ portalId, userId });

    const proposal = await proposalRepository.create({
      portal: portalId,
      createdBy: userId,
      ...buildProposalData(data),
    });

    return {
      id: proposal._id.toString(),
      portal: proposal.portal,
      nombre: proposal.nombre,
      lifecycleStatus: proposal.lifecycleStatus,
      createdAt: proposal.createdAt,
    };
  },

  createMany: async ({ portalId, userId, proposals }) => {
    await getAccessiblePortal({ portalId, userId });

    const proposalsData = proposals.map((data) => ({
      portal: portalId,
      createdBy: userId,
      ...buildProposalData({
        ...data,
        lifecycleStatus: data.lifecycleStatus || 'active',
      }),
    }));

    const createdProposals = await proposalRepository.createMany(proposalsData);

    return {
      count: createdProposals.length,
      ids: createdProposals.map((proposal) => proposal._id.toString()),
    };
  },

  update: async ({ portalId, proposalId, userId, data }) => {
    await getAccessiblePortal({ portalId, userId });
    const proposal = await proposalRepository.updateByIdAndPortal(
      proposalId,
      portalId,
      buildProposalData(data)
    );

    if (!proposal) {
      const error = new Error('La propuesta no existe');
      error.statusCode = 404;
      throw error;
    }

    return proposal;
  },

  remove: async ({ portalId, proposalId, userId }) => {
    await getAccessiblePortal({ portalId, userId });
    const proposal = await proposalRepository.deleteByIdAndPortal(proposalId, portalId);

    if (!proposal) {
      const error = new Error('La propuesta no existe');
      error.statusCode = 404;
      throw error;
    }

    await Promise.all([
      proposalContactRepository.deleteByProposal(proposalId, portalId),
      proposalOpportunityRepository.deleteByProposal(proposalId, portalId),
      proposalCompanyRepository.deleteByProposal(proposalId, portalId),
      ProposalControl.deleteOne({ proposal: proposalId, portal: portalId }),
    ]);

    return {
      id: proposal._id.toString(),
      nombre: proposal.nombre,
      lifecycleStatus: proposal.lifecycleStatus,
    };
  },

  removeAll: async ({ portalId, userId }) => {
    await getAccessiblePortal({ portalId, userId });

    const [proposalResult, contactResult, opportunityResult, companyResult] = await Promise.all([
      proposalRepository.deleteByPortal(portalId),
      proposalContactRepository.deleteByPortal(portalId),
      proposalOpportunityRepository.deleteByPortal(portalId),
      proposalCompanyRepository.deleteByPortal(portalId),
      ProposalControl.deleteMany({ portal: portalId }),
    ]);

    return {
      deletedProposals: proposalResult.deletedCount || 0,
      deletedContacts: contactResult.deletedCount || 0,
      deletedOpportunities: opportunityResult.deletedCount || 0,
      deletedCompanies: companyResult.deletedCount || 0,
    };
  },
};

export default proposalService;
