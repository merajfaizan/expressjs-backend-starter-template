import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { sessionController } from './session.controller';
import { sessionValidation } from './session.validation';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  sessionController.getActiveSessions
);

router.delete(
  '/',
  auth(UserRole.SUPER_ADMIN),
  sessionController.revokeAllSessions
);

router.post(
  '/revoke-users',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(sessionValidation.revokeUsersValidationSchema),
  sessionController.revokeMultipleUsers
);

router.delete(
  '/user/:userId',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  sessionController.revokeUserSessions
);

router.get(
  '/:sessionId',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  sessionController.getSessionById
);

router.delete(
  '/:sessionId',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  sessionController.revokeSession
);

export const sessionRoutes = router;
