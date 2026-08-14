import mongoose from 'mongoose';

const opportunityConceptNoteVersionSchema = new mongoose.Schema(
  {
    portal: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true, index: true },
    conceptNote: { type: mongoose.Schema.Types.ObjectId, ref: 'OpportunityConceptNote', required: true, index: true },
    opportunityRow: { type: mongoose.Schema.Types.ObjectId, ref: 'OpportunityWorkbookRow', required: true, index: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true, default: '' },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true, select: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalUploadedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('OpportunityConceptNoteVersion', opportunityConceptNoteVersionSchema);
