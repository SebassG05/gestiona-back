import mongoose from 'mongoose';

const teamVacationSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    days: {
      type: Number,
      required: true,
      min: 1,
    },
    color: {
      type: String,
      trim: true,
      default: '#ff5a1f',
      match: [/^#[0-9A-Fa-f]{6}$/, 'El color no es valido'],
    },
  },
  { timestamps: true }
);

teamVacationSchema.index({ portal: 1, startDate: 1, endDate: 1 });
teamVacationSchema.index({ portal: 1, user: 1, startDate: 1 });

const TeamVacation = mongoose.model('TeamVacation', teamVacationSchema);

export default TeamVacation;
