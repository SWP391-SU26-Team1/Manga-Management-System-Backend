const bcrypt = require("bcryptjs");
const usersRepo = require("./users.repository");
const AppError = require("../../utils/appError");

const listUsers = async (filters) => {
  return usersRepo.findAll(filters);
};

const getUserById = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const createUser = async (payload) => {
  const existingEmail = await usersRepo.findByEmail(payload.email);
  if (existingEmail) throw new AppError("Email already in use", 409);

  const existingUsername = await usersRepo.findByUsername(payload.username);
  if (existingUsername) throw new AppError("Username already in use", 409);

  const hashed = await bcrypt.hash(payload.password, 10);
  return usersRepo.create({ ...payload, password: hashed });
};

const updateUser = async (userId, payload) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (payload.email && payload.email !== user.email) {
    const existing = await usersRepo.findByEmail(payload.email);
    if (existing) throw new AppError("Email already in use", 409);
  }

  return usersRepo.update(userId, payload);
};

const updateUserStatus = async (userId, status) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return usersRepo.update(userId, { status });
};

const deleteUser = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  await usersRepo.deleteById(userId);
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
