import User from '../models/User.js';

const userRepository = {
  findByEmail: (email) => User.findOne({ email }).select('+password'),

  findByUsername: (username) => User.findOne({ username }),

  findByEmailOrUsername: (email, username) =>
    User.findOne({ $or: [{ email }, { username }] }),

  create: (userData) => User.create(userData),

  findById: (id) => User.findById(id),
};

export default userRepository;
