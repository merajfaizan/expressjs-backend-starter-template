import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { UserValidation } from '../User/user.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { authValidation } from './auth.validation';

const router = express.Router();

router.post(
  '/login',
  validateRequest(UserValidation.UserLoginValidationSchema),
  AuthController.loginUser
);

router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshTokenValidationSchema),
  AuthController.refreshToken
);

router.post('/logout', auth(), AuthController.logoutUser);

router.post('/logout-all', auth(), AuthController.logoutAllSessions);

router.get('/sessions', auth(), AuthController.getMySessions);

router.get(
  '/profile',
  auth(UserRole.ADMIN, UserRole.USER, UserRole.SUPER_ADMIN),
  AuthController.getMyProfile
);

router.put(
  '/change-password',
  auth(),
  validateRequest(authValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  validateRequest(authValidation.resetPasswordValidationSchema),
  AuthController.resetPassword
);

export const AuthRoutes = router;
