const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

// Tạo payload token chỉ gồm thông tin cần thiết.
// Không nên để quá nhiều dữ liệu nhạy cảm vào token.
const createTokenPayload = (user) => ({
  user_id: user.user_id,
  email: user.email,
  role: user.role,
});

const signToken = (user) =>
  jwt.sign(
    createTokenPayload(user),
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// Kiểm tra trạng thái user - dùng chung cho cả Email và Google
const checkUserStatus = (user) => {
  if (user.status === 'inactive') {
    throw new AppError('Account has been deactivated. Please contact support', 403);
  }
  if (user.status === 'suspended') {
    throw new AppError('Account is temporarily suspended due to violation', 403);
  }
  if (user.status === 'banned') {
    throw new AppError('Account has been permanently banned', 403);
  }
};

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

// Đăng nhập bằng Email - Kiểm tra mật khẩu trước, sau đó mới kiểm tra trạng thái
const login = async ({ email, password }) => {
  // Bước 1: Tìm user trong database theo email.
  // Nếu không tìm thấy thì không thể đăng nhập.
  const user = await usersRepo.findByEmail(email);

  // Bước 2: Nếu user tồn tại thì so sánh mật khẩu.
  // Đây là bước quan trọng vì mật khẩu trên database là hash, không phải text.
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Bước 3: Mật khẩu ĐÚNG rồi mới kiểm tra trạng thái
  checkUserStatus(user);

  const { password: _pw, ...safeUser } = user;
  const token = signToken(safeUser);
  return { token, user: safeUser };
};

// Đăng nhập bằng Google
const loginWithGoogle = async ({ email, googleId, name }) => {
  let user = await usersRepo.findByEmail(email);

  // Nếu chưa có tài khoản -> Tạo mới với trạng thái active
  if (!user) {
    user = await usersRepo.create({
      email,
      username: email.split('@')[0],
      password: null, // Đăng nhập Google không cần mật khẩu
      name,
      google_id: googleId,
      role: 'user',
      status: 'active'
    });
  }

  // PHẢI KIỂM TRA TRẠNG THÁI - Điều này không được bỏ qua dù là Google hay Email
  checkUserStatus(user);

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

module.exports = { register, login, loginWithGoogle, getMe, changePassword };
