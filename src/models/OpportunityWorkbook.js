import mongoose from 'mongoose';

const opportunityWorkbookSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    sourceFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    sheetName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    headerRow: {
      type: Number,
      required: true,
      min: 1,
    },
    headers: {
      type: [String],
      required: true,
      validate: {
        validator: (headers) => headers.length > 0 && headers.length <= 100,
        message: 'El Excel debe tener entre 1 y 100 columnas',
      },
    },
    rowCount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

opportunityWorkbookSchema.index({ portal: 1, createdAt: -1 });

const OpportunityWorkbook = mongoose.model(
  'OpportunityWorkbook',
  opportunityWorkbookSchema
);

export default OpportunityWorkbook;
