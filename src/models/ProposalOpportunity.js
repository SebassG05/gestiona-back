import mongoose from 'mongoose';

const optionalString = {
  type: String,
  trim: true,
  default: '',
};

const proposalOpportunitySchema = new mongoose.Schema(
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
    destination: optionalString,
    subDestination: optionalString,
    topicId: optionalString,
    opening: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    company: optionalString,
    project: optionalString,
    role: optionalString,
    email: {
      ...optionalString,
      lowercase: true,
    },
    typeOfAction: optionalString,
    linkCall: optionalString,
    announcement: {
      type: String,
      enum: ['', 'Y', 'N'],
      default: '',
    },
    potentialMessage: optionalString,
  },
  { timestamps: true }
);

proposalOpportunitySchema.index({ proposal: 1, topicId: 1 });

const ProposalOpportunity = mongoose.model(
  'ProposalOpportunity',
  proposalOpportunitySchema
);

export default ProposalOpportunity;
