import mongoose from 'mongoose';

const portalExcelLinkSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      unique: true,
      index: true,
    },
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    encryptedAccessToken: { type: String, required: true },
    encryptedRefreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    microsoftAccount: { type: String, trim: true, default: '' },
    driveId: { type: String, trim: true, default: '' },
    itemId: { type: String, trim: true, default: '' },
    fileName: { type: String, trim: true, default: '' },
    webUrl: { type: String, trim: true, default: '' },
    worksheetId: { type: String, trim: true, default: '' },
    worksheetName: { type: String, trim: true, default: '' },
    lastSyncedAt: { type: Date, default: null },
    lastSyncCount: { type: Number, default: 0 },
    lastSyncError: { type: String, default: '' },
  },
  { timestamps: true }
);

const PortalExcelLink = mongoose.model('PortalExcelLink', portalExcelLinkSchema);

export default PortalExcelLink;
