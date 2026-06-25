import mongoose from 'mongoose';

const optionalString = { type: String, trim: true, default: '' };
const optionalNumber = { type: Number, default: null };

const linkedExcelProposalSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    excelLink: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PortalExcelLink',
      required: true,
      index: true,
    },
    externalId: { type: String, required: true, trim: true },
    rowNumber: { type: Number, required: true },
    nombre: { type: String, required: true, trim: true },
    programa: optionalString,
    convocatoria: optionalString,
    acronimo: optionalString,
    tipo: optionalString,
    deadlineApertura: { type: Date, default: null },
    fase: optionalString,
    estado: optionalString,
    prioridad: optionalString,
    responsable: optionalString,
    rolEvenor: optionalString,
    coordinadorLead: optionalString,
    presupuestoTotal: optionalNumber,
    presupuestoEvenor: optionalNumber,
    probabilidad: optionalNumber,
    valorEsperado: optionalNumber,
    proyectoEjecucionVinculado: optionalString,
    pagosRecibidosVinculados: optionalNumber,
    balancePendiente: optionalNumber,
    proximaAccion: optionalString,
    fuenteUrl: optionalString,
    notas: optionalString,
    sourceHash: { type: String, required: true },
  },
  { timestamps: true }
);

linkedExcelProposalSchema.index({ portal: 1, excelLink: 1, externalId: 1 }, { unique: true });

const LinkedExcelProposal = mongoose.model('LinkedExcelProposal', linkedExcelProposalSchema);

export default LinkedExcelProposal;
