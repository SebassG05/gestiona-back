import mongoose from 'mongoose';
import OpportunityWorkbook from '../models/OpportunityWorkbook.js';
import OpportunityWorkbookRow from '../models/OpportunityWorkbookRow.js';

const opportunityWorkbookRepository = {
  createWorkbook: (data) => OpportunityWorkbook.create(data),
  createRows: (rows) => OpportunityWorkbookRow.insertMany(rows, { ordered: true }),
  listByPortal: (portalId) =>
    OpportunityWorkbook.find({ portal: portalId })
      .sort({ createdAt: 1 })
      .select('-__v')
      .lean(),
  findByIdAndPortal: (workbookId, portalId) =>
    OpportunityWorkbook.findOne({ _id: workbookId, portal: portalId }).lean(),
  listRows: (workbookId, portalId) =>
    OpportunityWorkbookRow.find({ workbook: workbookId, portal: portalId })
      .sort({ rowNumber: 1 })
      .select('-__v')
      .lean(),
  listRowsPaginated: ({ workbookId, portalId, skip, limit }) =>
    OpportunityWorkbookRow.find({ workbook: workbookId, portal: portalId })
      .sort({ rowNumber: 1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean(),
  countRows: (workbookId, portalId) =>
    OpportunityWorkbookRow.countDocuments({ workbook: workbookId, portal: portalId }),
  searchRows: ({ portalId, term, limit = 50 }) =>
    OpportunityWorkbookRow.aggregate([
      {
        $match: {
          portal: new mongoose.Types.ObjectId(portalId),
        },
      },
      {
        $addFields: {
          matchesSearch: {
            $anyElementTrue: {
              $map: {
                input: '$values',
                as: 'value',
                in: {
                  $regexMatch: {
                    input: { $toString: { $ifNull: ['$$value', ''] } },
                    regex: term,
                    options: 'i',
                  },
                },
              },
            },
          },
        },
      },
      { $match: { matchesSearch: true } },
      { $sort: { rowNumber: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'opportunityworkbooks',
          localField: 'workbook',
          foreignField: '_id',
          as: 'workbook',
        },
      },
      { $unwind: '$workbook' },
      {
        $project: {
          _id: 1,
          rowNumber: 1,
          values: 1,
          workbook: {
            _id: '$workbook._id',
            name: '$workbook.name',
            sourceFileName: '$workbook.sourceFileName',
            sheetName: '$workbook.sheetName',
            headerRow: '$workbook.headerRow',
            headers: '$workbook.headers',
          },
        },
      },
    ]),
  deleteWorkbook: (workbookId, portalId) =>
    OpportunityWorkbook.findOneAndDelete({ _id: workbookId, portal: portalId }).lean(),
  deleteRows: (workbookId, portalId) =>
    OpportunityWorkbookRow.deleteMany({ workbook: workbookId, portal: portalId }),
};

export default opportunityWorkbookRepository;
