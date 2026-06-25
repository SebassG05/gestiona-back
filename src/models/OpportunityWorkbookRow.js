import mongoose from 'mongoose';

const opportunityWorkbookRowSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    workbook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpportunityWorkbook',
      required: true,
      index: true,
    },
    rowNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    values: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },
  },
  { timestamps: true }
);

opportunityWorkbookRowSchema.index({ workbook: 1, rowNumber: 1 }, { unique: true });

const OpportunityWorkbookRow = mongoose.model(
  'OpportunityWorkbookRow',
  opportunityWorkbookRowSchema
);

export default OpportunityWorkbookRow;
