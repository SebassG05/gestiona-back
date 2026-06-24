import mongoose from 'mongoose';
import ProposalContact from '../models/ProposalContact.js';

const proposalContactRepository = {
  create: (contactData) => ProposalContact.create(contactData),
  findByProposal: (proposalId, portalId) =>
    ProposalContact.find({ proposal: proposalId, portal: portalId })
      .sort({ updatedAt: -1 })
      .lean(),
  findByIdAndProposal: (contactId, proposalId, portalId) =>
    ProposalContact.findOne({
      _id: contactId,
      proposal: proposalId,
      portal: portalId,
    }).lean(),
  updateByIdAndProposal: (contactId, proposalId, portalId, contactData) =>
    ProposalContact.findOneAndUpdate(
      {
        _id: contactId,
        proposal: proposalId,
        portal: portalId,
      },
      { $set: contactData },
      { new: true, runValidators: true }
    ).lean(),
  deleteByIdAndProposal: (contactId, proposalId, portalId) =>
    ProposalContact.findOneAndDelete({
      _id: contactId,
      proposal: proposalId,
      portal: portalId,
    }).lean(),
  deleteByProposal: (proposalId, portalId) =>
    ProposalContact.deleteMany({ proposal: proposalId, portal: portalId }),
  countByPortal: (portalId) =>
    ProposalContact.aggregate([
      { $match: { portal: new mongoose.Types.ObjectId(portalId) } },
      { $group: { _id: '$proposal', count: { $sum: 1 } } },
    ]),
};

export default proposalContactRepository;
