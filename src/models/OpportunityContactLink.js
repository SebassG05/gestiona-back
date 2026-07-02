import mongoose from 'mongoose';

const opportunityContactLinkSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    opportunityWorkbook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpportunityWorkbook',
      required: true,
      index: true,
    },
    opportunityRow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpportunityWorkbookRow',
      required: true,
      index: true,
    },
    contactWorkbook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpportunityWorkbook',
      required: true,
      index: true,
    },
    contactRow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpportunityWorkbookRow',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    opportunitySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    contactSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

opportunityContactLinkSchema.index(
  { portal: 1, opportunityRow: 1, contactRow: 1 },
  { unique: true }
);

const OpportunityContactLink = mongoose.model(
  'OpportunityContactLink',
  opportunityContactLinkSchema
);

export default OpportunityContactLink;
