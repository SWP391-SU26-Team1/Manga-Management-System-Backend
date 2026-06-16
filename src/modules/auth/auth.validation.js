const { z } = require("zod");
const { SELF_REGISTER_ROLES } = require("../../constants/status");

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().max(150).optional(),
    // Only unprivileged roles can be self-assigned; admin/editor/board assigned by admin
    role: z.enum(SELF_REGISTER_ROLES).default("mangaka"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const loginGoogleSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    old_password: z.string().min(1),
    new_password: z.string().min(6),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  loginGoogleSchema,
  changePasswordSchema,
};
