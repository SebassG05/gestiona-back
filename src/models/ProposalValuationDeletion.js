import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  portal: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true },
  rowId: { type: String, required: true },
}, { timestamps: true });

schema.index({ portal: 1, rowId: 1 }, { unique: true });

export default mongoose.model('ProposalValuationDeletion', schema);
