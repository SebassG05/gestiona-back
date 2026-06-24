import portalRepository from '../repositories/portalRepository.js';
import proposalRepository from '../repositories/proposalRepository.js';

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

const optionalResponsable = (value) => (value ? value : null);

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
    prioridad: data.prioridad,
    responsable: optionalResponsable(data.responsable),
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
  listByPortal: async ({ portalId, userId }) => {
    await getAccessiblePortal({ portalId, userId });
    return proposalRepository.findByPortal(portalId);
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

    return {
      id: proposal._id.toString(),
      nombre: proposal.nombre,
      lifecycleStatus: proposal.lifecycleStatus,
    };
  },
};

export default proposalService;
