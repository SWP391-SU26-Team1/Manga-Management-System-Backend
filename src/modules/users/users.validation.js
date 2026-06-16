const { z } = require("zod");
const { USER_STATUS, USER_ROLES } = require("../../constants/status");

const uuidParam = z.string().uuid({ message: "Invalid UUID" });

const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(USER_ROLES),
    name: z.string().max(150).optional(),
    avatar_url: z.string().url().optional(),
    bio: z.string().optional(),
    gender: z.string().max(20).optional(),
    date_of_birth: z.string().optional(),
    status: z.enum(USER_STATUS).default("active"),
  }),
});

const updateUserSchema = z.object({
  params: z.object({ userId: uuidParam }),
  body: z.object({
    username: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    name: z.string().max(150).optional(),
    avatar_url: z.string().url().optional(),
    bio: z.string().optional(),
    gender: z.string().max(20).optional(),
    date_of_birth: z.string().optional(),
    // role allowed in schema so it passes through to the controller for ownership check
    role: z.enum(USER_ROLES).optional(),
  }),
});

const updateUserStatusSchema = z.object({
  params: z.object({ userId: uuidParam }),
  body: z.object({ status: z.enum(USER_STATUS) }),
});

const updateUserRoleSchema = z.object({
  params: z.object({ userId: uuidParam }),
  body: z.object({ role: z.enum(USER_ROLES) }),
});

const userIdParamSchema = z.object({
  params: z.object({ userId: uuidParam }),
});

const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUS).optional(),
    keyword: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  listUsersSchema,
};
