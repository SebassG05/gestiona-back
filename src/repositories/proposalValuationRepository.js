import ProposalValuation from '../models/ProposalValuation.js';
import ProposalValuationDeletion from '../models/ProposalValuationDeletion.js';

export default {
  list: (portal) => ProposalValuation.find({ portal }).sort({ createdAt: 1 }).lean(),
  find: (portal, rowId) => ProposalValuation.findOne({ portal, rowId }).lean(),
  create: (data) => ProposalValuation.create(data),
  save: (portal, rowId, data) => ProposalValuation.findOneAndUpdate(
    { portal, rowId }, { $set: data }, { upsert: true, new: true, runValidators: true }
  ).lean(),
  listDeleted: (portal) => ProposalValuationDeletion.find({ portal }).select({ rowId: 1, _id: 0 }).lean(),
  markDeleted: (portal, rowId) => ProposalValuationDeletion.findOneAndUpdate(
    { portal, rowId }, { $set: { portal, rowId } }, { upsert: true, new: true }
  ).lean(),
};
