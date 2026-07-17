import mongoose from 'mongoose';

const businessTripSchema = new mongoose.Schema(
  {
    portal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'El nombre del viaje es obligatorio'],
      trim: true,
      minlength: 2,
      maxlength: 140,
    },
    destination: {
      type: String,
      required: [true, 'El destino es obligatorio'],
      trim: true,
      maxlength: 180,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transport: {
      type: String,
      enum: ['Avion', 'Tren', 'Coche', 'Otro'],
      default: 'Otro',
    },
    status: {
      type: String,
      enum: ['Planificado', 'En curso', 'Finalizado', 'Cancelado'],
      default: 'Planificado',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

businessTripSchema.index({ portal: 1, startDate: 1 });
businessTripSchema.index({ portal: 1, assignedTo: 1, startDate: 1 });

businessTripSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(new Error('La fecha de vuelta no puede ser anterior a la salida'));
  }

  return next();
});

const BusinessTrip = mongoose.model('BusinessTrip', businessTripSchema);

export default BusinessTrip;
