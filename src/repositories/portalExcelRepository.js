import LinkedExcelProposal from '../models/LinkedExcelProposal.js';
import PortalExcelLink from '../models/PortalExcelLink.js';

const portalExcelRepository = {
  findLinkByPortal: (portalId) => PortalExcelLink.findOne({ portal: portalId }),
  upsertConnection: (portalId, data) =>
    PortalExcelLink.findOneAndUpdate(
      { portal: portalId },
      { $set: data, $setOnInsert: { portal: portalId } },
      { new: true, upsert: true, runValidators: true }
    ),
  updateLink: (portalId, data) =>
    PortalExcelLink.findOneAndUpdate({ portal: portalId }, { $set: data }, { new: true }),
  deleteLink: (portalId) => PortalExcelLink.findOneAndDelete({ portal: portalId }),
  listRows: (portalId) =>
    LinkedExcelProposal.find({ portal: portalId }).sort({ rowNumber: 1 }).lean(),
  syncRows: async ({ portalId, excelLinkId, rows }) => {
    const externalIds = rows.map((row) => row.externalId);
    const operations = rows.map((row) => ({
      updateOne: {
        filter: { portal: portalId, excelLink: excelLinkId, externalId: row.externalId },
        update: { $set: { ...row, portal: portalId, excelLink: excelLinkId } },
        upsert: true,
      },
    }));

    if (operations.length) {
      await LinkedExcelProposal.bulkWrite(operations, { ordered: false });
    }

    await LinkedExcelProposal.deleteMany({
      portal: portalId,
      excelLink: excelLinkId,
      externalId: { $nin: externalIds },
    });
  },
  deleteRows: (portalId) => LinkedExcelProposal.deleteMany({ portal: portalId }),
};

export default portalExcelRepository;
