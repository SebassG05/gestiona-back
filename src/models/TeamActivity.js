import mongoose from 'mongoose';

const teamActivitySchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'La tarea es obligatoria'],
      trim: true,
      maxlength: [140, 'La tarea no puede superar 140 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1200, 'La descripcion no puede superar 1200 caracteres'],
    },
    workDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'blocked', 'done'],
      default: 'in_progress',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

teamActivitySchema.index({ portal: 1, workDate: 1 });
teamActivitySchema.index({ portal: 1, assignedTo: 1, workDate: 1 });

const TeamActivity = mongoose.model('TeamActivity', teamActivitySchema);

export default TeamActivity;
