import mongoose from 'mongoose';

const contactTrackingSchema = new mongoose.Schema(
  {
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    responseReceived: {
      type: Boolean,
      default: false,
    },
    responseReceivedAt: {
      type: Date,
      default: null,
    },
    responseNote: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    interestStatus: {
      type: String,
      enum: ['', 'interested', 'not_interested'],
      default: '',
    },
    meetingScheduled: {
      type: Boolean,
      default: false,
    },
    meetingAt: {
      type: Date,
      default: null,
    },
    meetingTitle: {
      type: String,
      trim: true,
      maxlength: 140,
      default: '',
    },
    meetingNote: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
    },
    meetingActivity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamActivity',
      default: null,
    },
  },
  { _id: false }
);

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
    contactTracking: {
      type: contactTrackingSchema,
      default: () => ({}),
    },
    trackingUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
