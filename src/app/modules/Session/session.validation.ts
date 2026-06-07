import { z } from 'zod';

const revokeUsersValidationSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, 'At least one userId is required'),
});

const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const sessionValidation = {
  revokeUsersValidationSchema,
  refreshTokenValidationSchema,
};
