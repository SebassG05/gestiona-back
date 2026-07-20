import mongoose from 'mongoose';

const portalFavoriteSchema = new mongoose.Schema(
  {
    portal: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, enum: ['proposal', 'opportunity'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

portalFavoriteSchema.index(
  { portal: 1, user: 1, entityType: 1, entityId: 1 },
  { unique: true }
);

const PortalFavorite = mongoose.model('PortalFavorite', portalFavoriteSchema);

export default PortalFavorite;
