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
  deleteWorkbook: (workbookId, portalId) =>
    OpportunityWorkbook.findOneAndDelete({ _id: workbookId, portal: portalId }).lean(),
  deleteRows: (workbookId, portalId) =>
    OpportunityWorkbookRow.deleteMany({ workbook: workbookId, portal: portalId }),
};

export default opportunityWorkbookRepository;
