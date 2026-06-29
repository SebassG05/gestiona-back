import mongoose from 'mongoose';

const optionalString = {
  type: String,
  trim: true,
  default: '',
};

const optionalNumber = {
  type: Number,
  default: null,
};

const proposalSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lifecycleStatus: {
      type: String,
      enum: ['active', 'draft', 'sent'],
      default: 'active',
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la propuesta es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre de la propuesta debe tener al menos 2 caracteres'],
      maxlength: [140, 'El nombre de la propuesta no puede superar 140 caracteres'],
    },
    proposalId: optionalString,
    programa: optionalString,
    convocatoria: optionalString,
    acronimo: optionalString,
    tipo: optionalString,
    deadlineApertura: {
      type: Date,
      default: null,
    },
    fase: optionalString,
    estado: optionalString,
    prioridad: optionalString,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    responsableName: optionalString,
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
  },
  {
    timestamps: true,
  }
);

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
