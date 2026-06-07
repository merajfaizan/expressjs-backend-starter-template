import { z } from 'zod';

const CreateUserValidationSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(1, 'Username is required'),
  phone: z.string().min(1, 'Phone is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .nonempty('Password is required'),
});

const UserLoginValidationSchema = z.object({
  email: z.string().email().nonempty('Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .nonempty('Password is required'),
  rememberMe: z.boolean().optional(),
});

const userUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
});

const updateUserValidationSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'USER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
});

export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema,
  userUpdateSchema,
  updateUserValidationSchema,
};
