import mongoose from 'mongoose';
import OpportunityContactLink from '../models/OpportunityContactLink.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const opportunityContactLinkRepository = {
  findExisting: ({ portalId, opportunityRowId, contactRowIds }) =>
    OpportunityContactLink.find({
      portal: portalId,
      opportunityRow: opportunityRowId,
      contactRow: { $in: contactRowIds },
    })
      .select('contactRow')
      .lean(),

  createMany: (links) => OpportunityContactLink.insertMany(links, { ordered: false }),

  countByOpportunityRows: (portalId, opportunityRowIds) =>
    OpportunityContactLink.aggregate([
      {
        $match: {
          portal: toObjectId(portalId),
          opportunityRow: { $in: opportunityRowIds.map(toObjectId) },
        },
      },
      {
        $group: {
          _id: '$opportunityRow',
          count: { $sum: 1 },
        },
      },
    ]),

  findByOpportunityRows: ({ portalId, opportunityRowIds }) =>
    OpportunityContactLink.find({
      portal: portalId,
      opportunityRow: { $in: opportunityRowIds },
    })
      .populate({
        path: 'contactWorkbook',
        select: 'name sourceFileName sheetName headerRow headers category',
      })
      .populate({
        path: 'contactRow',
        select: 'rowNumber values',
      })
      .sort({ createdAt: 1 })
      .lean(),

  deleteById: ({ portalId, workbookId, linkId }) =>
    OpportunityContactLink.findOneAndDelete({
      _id: linkId,
      portal: portalId,
      opportunityWorkbook: workbookId,
    }).lean(),

  deleteByWorkbook: (workbookId, portalId) =>
    OpportunityContactLink.deleteMany({
      portal: portalId,
      $or: [{ opportunityWorkbook: workbookId }, { contactWorkbook: workbookId }],
    }),

  deleteByRow: (rowId, portalId) =>
    OpportunityContactLink.deleteMany({
      portal: portalId,
      $or: [{ opportunityRow: rowId }, { contactRow: rowId }],
    }),
};

export default opportunityContactLinkRepository;
