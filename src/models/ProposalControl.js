import mongoose from 'mongoose';

const controlItemSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    section: { type: String, required: true, trim: true },
    indicator: { type: String, trim: true, default: '' },
    weight: { type: Number, min: 0, max: 100, default: null },
    status: {
      type: String,
      enum: ['No iniciado', 'En progreso', 'En revision', 'Listo', 'No aplica'],
      default: 'No iniciado',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    responsible: { type: String, trim: true, default: '' },
    pendingAction: { type: String, trim: true, default: '' },
    lastReview: { type: Date, default: null },
    versions: {
      type: [{ type: Number, min: 0, max: 5, default: null }],
      default: () => Array(9).fill(null),
      validate: {
        validator: (values) => values.length === 9,
        message: 'Deben existir exactamente nueve versiones',
      },
    },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const proposalControlSchema = new mongoose.Schema(
  {
    portal: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true, index: true },
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, unique: true },
    items: { type: [controlItemSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    templateVersion: { type: Number, default: 3 },
  },
  { timestamps: true }
);

proposalControlSchema.index({ portal: 1, proposal: 1 }, { unique: true });

export default mongoose.model('ProposalControl', proposalControlSchema);
