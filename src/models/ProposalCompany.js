import mongoose from 'mongoose';

const optionalString = {
  type: String,
  trim: true,
  default: '',
};

const proposalCompanySchema = new mongoose.Schema(
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
    acronym: optionalString,
    entities: optionalString,
    countries: optionalString,
    pilots: optionalString,
    nda: {
      type: String,
      enum: ['', 'Y', 'N'],
      default: '',
    },
    emailList: optionalString,
    partA: optionalString,
    participantPortalInvitation: optionalString,
  },
  { timestamps: true }
);

proposalCompanySchema.index({ proposal: 1, acronym: 1 });

const ProposalCompany = mongoose.model('ProposalCompany', proposalCompanySchema);

export default ProposalCompany;
