import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import config from '../../../config';
import ApiError from '../../../errors/ApiErrors';
import { SessionFilterRequest } from '../../../interfaces/auth';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { sessionHelper, SessionMeta } from '../../../helpers/sessionHelper';
import { tokenHasher } from '../../../helpers/tokenHasher';
import prisma from '../../../shared/prisma';

const activeSessionWhere = {
  isRevoked: false,
  expiresAt: { gt: new Date() },
};

const getSessionExpiryDuration = (rememberMe: boolean): string => {
  return rememberMe
    ? config.jwt.remember_me_expires_in
    : config.jwt.refresh_token_expires_in;
};

const sessionSelect = {
  id: true,
  userId: true,
  deviceInfo: true,
  ipAddress: true,
  userAgent: true,
  rememberMe: true,
  isRevoked: true,
  revokedAt: true,
  revokedBy: true,
  expiresAt: true,
  lastActiveAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      username: true,
      role: true,
    },
  },
} as const;

const createSession = async (
  userId: string,
  refreshToken: string,
  meta: SessionMeta,
  rememberMe = false
) => {
  const expiresAt = sessionHelper.parseRefreshExpiry(
    getSessionExpiryDuration(rememberMe)
  );

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: tokenHasher.hashToken(refreshToken),
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      rememberMe,
      expiresAt,
    },
    select: { id: true },
  });

  return session.id;
};

const validateSession = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { id: true, status: true, role: true, email: true },
      },
    },
  });

  if (!session) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session not found!');
  }

  if (session.isRevoked) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session has been revoked!');
  }

  if (session.expiresAt < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session has expired!');
  }

  if (session.user.status === 'BLOCKED') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
  }

  return session;
};

const touchSession = (sessionId: string) => {
  prisma.session
    .update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});
};

const rotateRefreshToken = async (
  oldRefreshToken: string,
  meta: SessionMeta
) => {
  const hash = tokenHasher.hashToken(oldRefreshToken);

  const existingSession = await prisma.session.findUnique({
    where: { refreshTokenHash: hash },
    include: {
      user: {
        select: { id: true, email: true, role: true, status: true },
      },
    },
  });

  if (!existingSession) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token!');
  }

  if (existingSession.isRevoked) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session has been revoked!');
  }

  if (existingSession.expiresAt < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session has expired!');
  }

  if (existingSession.user.status === 'BLOCKED') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
  }

  const newRefreshToken = tokenHasher.generateRefreshToken();
  const rememberMe = existingSession.rememberMe;
  const expiresAt = sessionHelper.parseRefreshExpiry(
    getSessionExpiryDuration(rememberMe)
  );

  await prisma.session.update({
    where: { id: existingSession.id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  const newSession = await prisma.session.create({
    data: {
      userId: existingSession.userId,
      refreshTokenHash: tokenHasher.hashToken(newRefreshToken),
      deviceInfo: meta.deviceInfo ?? existingSession.deviceInfo,
      ipAddress: meta.ipAddress ?? existingSession.ipAddress,
      userAgent: meta.userAgent ?? existingSession.userAgent,
      rememberMe,
      expiresAt,
    },
    select: { id: true },
  });

  return {
    userId: existingSession.userId,
    email: existingSession.user.email,
    role: existingSession.user.role,
    sessionId: newSession.id,
    refreshToken: newRefreshToken,
    rememberMe,
    sessionExpiresIn: getSessionExpiryDuration(rememberMe),
  };
};

const revokeSession = async (sessionId: string, revokedBy?: string) => {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Session not found!');
  }

  if (session.isRevoked) {
    return { message: 'Session already revoked' };
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy: revokedBy ?? null,
    },
  });

  return { message: 'Session revoked successfully' };
};

const revokeAllUserSessions = async (
  userId: string,
  exceptSessionId?: string,
  revokedBy?: string
) => {
  const where: Prisma.SessionWhereInput = {
    userId,
    isRevoked: false,
    ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
  };

  const result = await prisma.session.updateMany({
    where,
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy: revokedBy ?? null,
    },
  });

  return {
    message: 'All user sessions revoked successfully',
    count: result.count,
  };
};

const revokeMultipleUsersSessions = async (
  userIds: string[],
  revokedBy: string
) => {
  const result = await prisma.session.updateMany({
    where: {
      userId: { in: userIds },
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
    },
  });

  return {
    message: 'Sessions revoked for selected users',
    count: result.count,
  };
};

const revokeAllSessions = async (revokedBy: string) => {
  const result = await prisma.session.updateMany({
    where: { isRevoked: false },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
    },
  });

  return {
    message: 'All sessions revoked globally',
    count: result.count,
  };
};

const getActiveSessions = async (
  filters: SessionFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, userId } = filters;

  const andConditions: Prisma.SessionWhereInput[] = [{ ...activeSessionWhere }];

  if (userId) {
    andConditions.push({ userId });
  }

  if (searchTerm) {
    andConditions.push({
      user: {
        OR: [
          { email: { contains: searchTerm } },
          { firstName: { contains: searchTerm } },
          { lastName: { contains: searchTerm } },
          { username: { contains: searchTerm } },
        ],
      },
    });
  }

  const where: Prisma.SessionWhereInput = { AND: andConditions };

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastActiveAt: 'desc' },
      select: sessionSelect,
    }),
    prisma.session.count({ where }),
  ]);

  return {
    meta: { page, limit, total },
    data: sessions,
  };
};

const getSessionById = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: sessionSelect,
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Session not found!');
  }

  return session;
};

const getMySessions = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      ...activeSessionWhere,
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      rememberMe: true,
      lastActiveAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return sessions;
};

export const sessionService = {
  createSession,
  validateSession,
  touchSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  revokeMultipleUsersSessions,
  revokeAllSessions,
  getActiveSessions,
  getSessionById,
  getMySessions,
};
