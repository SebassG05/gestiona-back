import ProposalOpportunity from '../models/ProposalOpportunity.js';

const proposalOpportunityRepository = {
  create: (data) => ProposalOpportunity.create(data),
  findByProposal: (proposalId, portalId) =>
    ProposalOpportunity.find({ proposal: proposalId, portal: portalId })
      .sort({ updatedAt: -1 })
      .lean(),
  updateByIdAndProposal: (opportunityId, proposalId, portalId, data) =>
    ProposalOpportunity.findOneAndUpdate(
      { _id: opportunityId, proposal: proposalId, portal: portalId },
      { $set: data },
      { new: true, runValidators: true }
    ).lean(),
  deleteByIdAndProposal: (opportunityId, proposalId, portalId) =>
    ProposalOpportunity.findOneAndDelete({
      _id: opportunityId,
      proposal: proposalId,
      portal: portalId,
    }).lean(),
  deleteByProposal: (proposalId, portalId) =>
    ProposalOpportunity.deleteMany({ proposal: proposalId, portal: portalId }),
  deleteByPortal: (portalId) => ProposalOpportunity.deleteMany({ portal: portalId }),
};

export default proposalOpportunityRepository;
