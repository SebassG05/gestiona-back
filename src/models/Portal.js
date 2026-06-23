import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'El email no es válido'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
    },
  },
  { _id: false }
);

const portalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del portal es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre del portal debe tener al menos 2 caracteres'],
      maxlength: [80, 'El nombre del portal no puede superar 80 caracteres'],
    },
    tags: {
      type: [String],
      default: [],
    },
    invites: {
      type: [inviteSchema],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

portalSchema.pre('save', function () {
  this.tags = [...new Set(this.tags.map((tag) => tag.trim()).filter(Boolean))];

  const uniqueInvites = new Map();
  this.invites.forEach((invite) => {
    if (invite.email) {
      uniqueInvites.set(invite.email.toLowerCase(), invite);
    }
  });
  this.invites = [...uniqueInvites.values()];

  if (!this.members.some((member) => member.equals(this.owner))) {
    this.members.unshift(this.owner);
  }
});

const Portal = mongoose.model('Portal', portalSchema);

export default Portal;
