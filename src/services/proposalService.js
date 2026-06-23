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

const proposalService = {
  create: async ({ portalId, userId, data }) => {
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

    const proposal = await proposalRepository.create({
      portal: portalId,
      createdBy: userId,
      nombre: data.nombre?.trim(),
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
    });

    return {
      id: proposal._id,
      portal: proposal.portal,
      nombre: proposal.nombre,
      createdAt: proposal.createdAt,
    };
  },
};

export default proposalService;
