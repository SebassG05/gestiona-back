import mongoose from 'mongoose';

const score = { type: Number, min: 0, max: 5, default: null };
const schema = new mongoose.Schema({
  portal: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true },
  rowId: { type: String, required: true },
  proposal: { type: String, required: true, trim: true, maxlength: 250 },
  year: { type: Number, required: true, min: 1900, max: 2100 },
  summary: { type: String, default: '', maxlength: 10000 },
  excellence: score,
  impact: score,
  quality: score,
  total: { type: Number, default: null, min: 0, max: 15 },
  expectedEvaluation: { type: String, default: '', maxlength: 1000 },
  call: { type: String, default: '', maxlength: 500 },
  folder: { type: String, default: '', maxlength: 250 },
  notes: { type: String, default: '', maxlength: 10000 },
}, { timestamps: true });

schema.index({ portal: 1, rowId: 1 }, { unique: true });

export default mongoose.model('ProposalValuation', schema);
