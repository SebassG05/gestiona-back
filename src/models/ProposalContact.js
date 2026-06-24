import mongoose from 'mongoose';

const optionalString = {
  type: String,
  trim: true,
  default: '',
};

const proposalContactSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del contacto es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [120, 'El nombre no puede superar 120 caracteres'],
    },
    organization: optionalString,
    position: optionalString,
    email: {
      ...optionalString,
      lowercase: true,
    },
    phone: optionalString,
    relationshipStatus: {
      type: String,
      enum: ['Por contactar', 'Contactado', 'En seguimiento', 'Confirmado', 'Descartado'],
      default: 'Por contactar',
    },
    lastContactAt: {
      type: Date,
      default: null,
    },
    nextAction: optionalString,
    notes: optionalString,
  },
  {
    timestamps: true,
  }
);

proposalContactSchema.index({ proposal: 1, email: 1 });

const ProposalContact = mongoose.model('ProposalContact', proposalContactSchema);

export default ProposalContact;
