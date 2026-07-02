import mongoose from 'mongoose';
import OpportunityWorkbook from '../models/OpportunityWorkbook.js';
import OpportunityWorkbookRow from '../models/OpportunityWorkbookRow.js';

const CONTACT_WORKBOOK_REGEX = /contact/i;

const categoryWorkbookFilter = (category) => {
  if (category === 'contacts') {
    return {
      $or: [
        { category: 'contacts' },
        {
          $and: [
            { category: { $exists: false } },
            {
              $or: [
                { name: CONTACT_WORKBOOK_REGEX },
                { sourceFileName: CONTACT_WORKBOOK_REGEX },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    $and: [
      {
        $or: [{ category: 'opportunities' }, { category: { $exists: false } }],
      },
      {
        $nor: [
          {
            $and: [
              { category: { $exists: false } },
              { name: CONTACT_WORKBOOK_REGEX },
            ],
          },
          {
            $and: [
              { category: { $exists: false } },
              { sourceFileName: CONTACT_WORKBOOK_REGEX },
            ],
          },
        ],
      },
    ],
  };
};

const categoryAggregateMatch = (category) => {
  if (category === 'contacts') {
    return {
      $or: [
        { 'workbook.category': 'contacts' },
        {
          $and: [
            { 'workbook.category': { $exists: false } },
            {
              $or: [
                { 'workbook.name': CONTACT_WORKBOOK_REGEX },
                { 'workbook.sourceFileName': CONTACT_WORKBOOK_REGEX },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    $and: [
      {
        $or: [
          { 'workbook.category': 'opportunities' },
          { 'workbook.category': { $exists: false } },
        ],
      },
      {
        $nor: [
          {
            $and: [
              { 'workbook.category': { $exists: false } },
              { 'workbook.name': CONTACT_WORKBOOK_REGEX },
            ],
          },
          {
            $and: [
              { 'workbook.category': { $exists: false } },
              { 'workbook.sourceFileName': CONTACT_WORKBOOK_REGEX },
            ],
          },
        ],
      },
    ],
  };
};

const opportunityWorkbookRepository = {
  createWorkbook: (data) => OpportunityWorkbook.create(data),
  createRows: (rows) => OpportunityWorkbookRow.insertMany(rows, { ordered: true }),
  listByPortal: (portalId, category = 'opportunities') =>
    OpportunityWorkbook.find({ portal: portalId, ...categoryWorkbookFilter(category) })
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
  searchRows: ({ portalId, term, category = 'opportunities', limit = 50 }) =>
    OpportunityWorkbookRow.aggregate([
      {
        $match: {
          portal: new mongoose.Types.ObjectId(portalId),
        },
      },
      {
        $lookup: {
          from: 'opportunityworkbooks',
          localField: 'workbook',
          foreignField: '_id',
          as: 'workbook',
        },
      },
      { $unwind: '$workbook' },
      { $match: categoryAggregateMatch(category) },
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
