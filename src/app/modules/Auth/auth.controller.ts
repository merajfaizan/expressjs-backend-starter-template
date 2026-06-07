import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { AuthServices } from './auth.service';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { LoginResponse } from '../../../interfaces/auth';
import { sessionHelper } from '../../../helpers/sessionHelper';

const extractBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader) return '';

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme?.toLowerCase() === 'bearer' && token) {
    return token;
  }

  return authorizationHeader;
};

const setAuthCookies = (res: Response, tokens: LoginResponse) => {
  const baseCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  res.cookie('accessToken', tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: sessionHelper.expiryToMs(tokens.expiresIn),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: sessionHelper.expiryToMs(tokens.sessionExpiresIn),
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body, req);
  setAuthCookies(res, result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.refreshToken(req.body.refreshToken, req);
  setAuthCookies(res, result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  if (req.sessionId) {
    await AuthServices.logoutCurrentSession(req.sessionId);
  }
  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged out',
    data: null,
  });
});

const logoutAllSessions = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.id && req.sessionId) {
    await AuthServices.logoutAllSessions(req.user.id, req.sessionId);
  }
  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged out from all devices except current session',
    data: null,
  });
});

const getMySessions = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.getMySessions(req.user!.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active sessions retrieved successfully',
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = extractBearerToken(req.headers.authorization);
  const result = await AuthServices.getMyProfile(userToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userToken = extractBearerToken(req.headers.authorization);
  const { oldPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(
    userToken,
    newPassword,
    oldPassword
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Check your email!',
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password Reset!',
    data: null,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  logoutUser,
  logoutAllSessions,
  getMySessions,
  getMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
