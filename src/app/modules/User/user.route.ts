import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';
import { userController } from './user.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
  '/register',
  validateRequest(UserValidation.CreateUserValidationSchema),
  userController.createUser
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userController.getUsers
);

router.put(
  '/profile',
  auth(UserRole.ADMIN, UserRole.USER),
  validateRequest(UserValidation.userUpdateSchema),
  userController.updateProfile
);

router.put(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(UserValidation.updateUserValidationSchema),
  userController.updateUser
);

export const userRoutes = router;
