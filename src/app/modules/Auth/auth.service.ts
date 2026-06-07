import { Secret } from 'jsonwebtoken';
import { Request } from 'express';
import config from '../../../config';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import prisma from '../../../shared/prisma';
import * as bcrypt from 'bcrypt';
import ApiError from '../../../errors/ApiErrors';
import emailSender from './emailSender';
import httpStatus from 'http-status';
import { LoginPayload, LoginResponse } from '../../../interfaces/auth';
import { sessionHelper } from '../../../helpers/sessionHelper';
import { tokenHasher } from '../../../helpers/tokenHasher';
import { sessionService } from '../Session/session.service';

const userProfileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  profileImage: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

const issueTokens = async (
  user: { id: string; email: string; role: string },
  req: Request,
  rememberMe = false
): Promise<LoginResponse> => {
  const refreshToken = tokenHasher.generateRefreshToken();
  const meta = sessionHelper.extractSessionMeta(req);
  const sessionExpiresIn = rememberMe
    ? config.jwt.remember_me_expires_in
    : config.jwt.refresh_token_expires_in;

  const sessionId = await sessionService.createSession(
    user.id,
    refreshToken,
    meta,
    rememberMe
  );

  const accessToken = jwtHelpers.generateAccessToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in
  );

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresIn: config.jwt.expires_in,
    rememberMe,
    sessionExpiresIn,
  };
};

const loginUser = async (
  payload: LoginPayload,
  req: Request
): Promise<LoginResponse> => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData?.email) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found! with this email ' + payload.email
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password incorrect!');
  }

  if (userData.status === 'BLOCKED') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
  }

  return issueTokens(userData, req, payload.rememberMe ?? false);
};

const refreshToken = async (
  refreshTokenValue: string,
  req: Request
): Promise<LoginResponse> => {
  const meta = sessionHelper.extractSessionMeta(req);

  const rotated = await sessionService.rotateRefreshToken(
    refreshTokenValue,
    meta
  );

  const accessToken = jwtHelpers.generateAccessToken(
    {
      id: rotated.userId,
      email: rotated.email,
      role: rotated.role,
      sessionId: rotated.sessionId,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in
  );

  return {
    accessToken,
    refreshToken: rotated.refreshToken,
    sessionId: rotated.sessionId,
    expiresIn: config.jwt.expires_in,
    rememberMe: rotated.rememberMe,
    sessionExpiresIn: rotated.sessionExpiresIn,
  };
};

const logoutCurrentSession = async (sessionId: string) => {
  return sessionService.revokeSession(sessionId);
};

const logoutAllSessions = async (userId: string, currentSessionId: string) => {
  return sessionService.revokeAllUserSessions(userId, currentSessionId);
};

const getMySessions = async (userId: string) => {
  return sessionService.getMySessions(userId);
};

const getMyProfile = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const userProfile = await prisma.user.findUnique({
    where: { id: decodedToken.id },
    select: userProfileSelect,
  });

  return userProfile;
};

const changePassword = async (
  userToken: string,
  newPassword: string,
  oldPassword: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken?.id },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Incorrect old password');
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await prisma.user.update({
    where: { id: decodedToken.id },
    data: { password: hashedPassword },
  });

  if (decodedToken.sessionId) {
    await sessionService.revokeAllUserSessions(
      decodedToken.id,
      decodedToken.sessionId
    );
  }

  return { message: 'Password changed successfully' };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: payload.email },
  });

  const resetPassToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role, id: userData.id },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in
  );

  const resetPassLink = `${config.reset_pass_link}?userId=${userData.id}&token=${encodeURIComponent(resetPassToken)}`;

  await emailSender(
    'Reset Your Password',
    userData.email,
    `
     <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${userData.firstName} ${userData.lastName},</p>
          <p>We received a request to reset your password. Click the button below to reset your password:</p>
          <a href="${resetPassLink}" style="text-decoration: none;">
            <button style="background-color: #007BFF; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
              Reset Password
            </button>
          </a>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you,<br>Express Backend Starter</p>
</div>
      `
  );

  return { message: 'Reset password link sent via your email successfully' };
};

const resetPassword = async (token: string, payload: { password: string }) => {
  const isValidToken = jwtHelpers.verifyToken(
    token,
    config.jwt.reset_pass_secret as Secret
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden!');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: isValidToken.id },
  });

  const password = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );

  await prisma.user.update({
    where: { id: userData.id },
    data: { password },
  });

  await sessionService.revokeAllUserSessions(userData.id);

  return { message: 'Password reset successfully' };
};

export const AuthServices = {
  loginUser,
  refreshToken,
  logoutCurrentSession,
  logoutAllSessions,
  getMySessions,
  getMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
