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
  body: z
    .object({
      idToken: z.string().min(1).optional(),
      code: z.string().min(1).optional(),
      redirectUri: z.string().url().optional(),
    })
    .refine((data) => data.idToken || data.code, {
      message: "Either idToken or code is required",
    }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const verifyPasswordOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/),
  }),
});

const resetPasswordSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      otp: z.string().regex(/^\d{6}$/),
      newPassword: z.string().min(6),
      confirmPassword: z.string().min(6),
    })
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }),
});

const changePasswordSchema = z.object({
  body: z.object({
    old_password: z.string().min(1),
    new_password: z.string().min(6),
  }),
});

const verifyRegisterOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/),
  }),
});
module.exports = {
  registerSchema,
  loginSchema,
  loginGoogleSchema,
  forgotPasswordSchema,
  verifyPasswordOtpSchema,
  verifyRegisterOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
