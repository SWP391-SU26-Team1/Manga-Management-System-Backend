const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const signToken = (user) =>
  jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async ({ username, email, password, name, role }) => {
  const existingEmail = await usersRepo.findByEmail(email);
  if (existingEmail) throw new AppError('Email already in use', 409);

  const existingUsername = await usersRepo.findByUsername(username);
  if (existingUsername) throw new AppError('Username already in use', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await usersRepo.create({ username, email, password: hashed, name, role, status: 'active' });
  const token = signToken(user);
  return { token, user };
};

const login = async ({ email, password }) => {
  const user = await usersRepo.findByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401);
  if (user.status !== 'active') throw new AppError('Account is not active', 403);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const { password: _pw, ...safeUser } = user;
  const token = signToken(safeUser);
  return { token, user: safeUser };
};

const getMe = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const changePassword = async (userId, { old_password, new_password }) => {
  const { data: user } = await require('../../config/supabase')
    .from('users')
    .select('password')
    .eq('user_id', userId)
    .single();

  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(old_password, user.password);
  if (!valid) throw new AppError('Old password is incorrect', 400);

  const hashed = await bcrypt.hash(new_password, 10);
  await usersRepo.update(userId, { password: hashed });
};

module.exports = { register, login, getMe, changePassword };
