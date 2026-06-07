import { z } from 'zod';

const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordValidationSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .nonempty('Password is required'),
});

const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const authValidation = {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  refreshTokenValidationSchema,
};
