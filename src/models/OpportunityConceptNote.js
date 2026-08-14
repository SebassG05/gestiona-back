import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpportunityConceptNoteVersion', default: null },
    status: { type: String, enum: ['draft', 'completed'], default: 'draft' },
    sections: { type: [sectionSchema], default: [] },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    savedAt: { type: Date, default: Date.now },
    fileName: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    fileSize: { type: Number, default: 0 },
  },
  { _id: false }
);

const opportunityConceptNoteSchema = new mongoose.Schema(
  {
    portal: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true, index: true },
    workbook: { type: mongoose.Schema.Types.ObjectId, ref: 'OpportunityWorkbook', required: true },
    opportunityRow: { type: mongoose.Schema.Types.ObjectId, ref: 'OpportunityWorkbookRow', required: true },
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'completed'], default: 'draft' },
    sections: { type: [sectionSchema], default: [] },
    fileName: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    fileSize: { type: Number, default: 0 },
    fileData: { type: Buffer, default: null, select: false },
    versions: { type: [versionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

opportunityConceptNoteSchema.index({ portal: 1, opportunityRow: 1 }, { unique: true });

export default mongoose.model('OpportunityConceptNote', opportunityConceptNoteSchema);
