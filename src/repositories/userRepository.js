import User from '../models/User.js';

const userRepository = {
  findByEmail: (email) => User.findOne({ email }).select('+password'),

  findByUsername: (username) => User.findOne({ username }),

  findByEmailOrUsername: (email, username) =>
    User.findOne({ $or: [{ email }, { username }] }),

  findByGoogleId: (googleId) => User.findOne({ googleId }),

  create: (userData) => User.create(userData),

  findById: (id) => User.findById(id),

  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: (id) => User.findByIdAndDelete(id),
};

export default userRepository;
