import ProposalCompany from '../models/ProposalCompany.js';

const proposalCompanyRepository = {
  create: (data) => ProposalCompany.create(data),
  findByProposal: (proposalId, portalId) =>
    ProposalCompany.find({ proposal: proposalId, portal: portalId })
      .sort({ updatedAt: -1 })
      .lean(),
  updateByIdAndProposal: (companyId, proposalId, portalId, data) =>
    ProposalCompany.findOneAndUpdate(
      { _id: companyId, proposal: proposalId, portal: portalId },
      { $set: data },
      { new: true, runValidators: true }
    ).lean(),
  deleteByIdAndProposal: (companyId, proposalId, portalId) =>
    ProposalCompany.findOneAndDelete({
      _id: companyId,
      proposal: proposalId,
      portal: portalId,
    }).lean(),
  deleteByProposal: (proposalId, portalId) =>
    ProposalCompany.deleteMany({ proposal: proposalId, portal: portalId }),
  deleteByPortal: (portalId) => ProposalCompany.deleteMany({ portal: portalId }),
};

export default proposalCompanyRepository;
