const bcrypt = require("bcryptjs");
const usersRepo = require("./users.repository");
const notificationsRepo = require("../notifications/notifications.repository");
const supabase = require("../../config/supabase");
const AppError = require("../../utils/appError");

const listUsers = async (filters) => {
  return usersRepo.findAll(filters);
};

const getUserById = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const requestRole = async (userId, requestedRole) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.role === requestedRole || user.role === "admin") {
    throw new AppError(`You already have the ${user.role} role`, 400);
  }

  // 1. Spam Prevention: Check if requested within last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentRequests } = await supabase
    .from("notification")
    .select("notification_id")
    .eq("type", "ROLE_UPGRADE_REQUEST")
    .ilike("content", `%"requester_id":"${userId}"%`)
    .gte("created_at", oneDayAgo);

  if (recentRequests && recentRequests.length > 0) {
    throw new AppError("You have already submitted a request recently. Please wait for an admin to review.", 429);
  }

  // 2. Find all admins
  const { data: admins } = await usersRepo.findAll({
    role: "admin",
    page: 1,
    limit: 100,
    offset: 0,
  });

  if (!admins || admins.length === 0) {
    throw new AppError("No admins found to process the request", 500);
  }

  // 3. Create JSON-based Notifications for admins
  const notificationPromises = admins.map((admin) => {
    return notificationsRepo.create({
      user_id: admin.user_id,
      title: "Yêu cầu cấp quyền",
      type: "ROLE_UPGRADE_REQUEST",
      content: JSON.stringify({
        message: `Người dùng @${user.username} (${user.email}) muốn xin cấp quyền làm ${requestedRole}.`,
        action_url: `/admin/users/${user.user_id}`,
        requester_id: user.user_id,
        requested_role: requestedRole,
      }),
    });
  });

  await Promise.all(notificationPromises);

  return null;
};

const createUser = async (payload) => {
  const existingEmail = await usersRepo.findByEmail(payload.email);
  if (existingEmail) throw new AppError('Email already in use', 409);

  const existingUsername = await usersRepo.findByUsername(payload.username);
  if (existingUsername) throw new AppError('Username already in use', 409);

  const hashed = await bcrypt.hash(payload.password, 10);
  return usersRepo.create({ ...payload, password: hashed });
};

const updateUser = async (userId, payload) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (payload.email && payload.email !== user.email) {
    const existing = await usersRepo.findByEmail(payload.email);
    if (existing) throw new AppError('Email already in use', 409);
  }

  return usersRepo.update(userId, payload);
};

const updateUserStatus = async (userId, status) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return usersRepo.update(userId, { status });
};

const deleteUser = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  await usersRepo.deleteById(userId);
};

module.exports = {
  listUsers,
  getUserById,
  requestRole,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
