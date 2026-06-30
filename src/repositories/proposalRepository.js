import Proposal from '../models/Proposal.js';

const proposalRepository = {
  create: (proposalData) => Proposal.create(proposalData),
  createMany: (proposalsData) => Proposal.insertMany(proposalsData, { ordered: true }),
  findByIdAndPortal: (proposalId, portalId) =>
    Proposal.findOne({ _id: proposalId, portal: portalId })
      .populate('responsable', 'username email')
      .populate('createdBy', 'username email')
      .lean(),
  findByPortal: (portalId) =>
    Proposal.find({ portal: portalId })
      .populate('responsable', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .lean(),
  findByPortalPaginated: ({ portalId, skip, limit }) =>
    Proposal.find({ portal: portalId })
      .populate('responsable', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  countByPortal: (portalId) => Proposal.countDocuments({ portal: portalId }),
  updateByIdAndPortal: (proposalId, portalId, proposalData) =>
    Proposal.findOneAndUpdate(
      { _id: proposalId, portal: portalId },
      { $set: proposalData },
      { new: true, runValidators: true }
    )
      .populate('responsable', 'username email')
      .populate('createdBy', 'username email')
      .lean(),
  deleteByIdAndPortal: (proposalId, portalId) =>
    Proposal.findOneAndDelete({ _id: proposalId, portal: portalId }).lean(),
  deleteByPortal: (portalId) => Proposal.deleteMany({ portal: portalId }),
};

export default proposalRepository;
