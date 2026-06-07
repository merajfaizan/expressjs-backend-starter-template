import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import pick from '../../../shared/pick';
import { sessionService } from './session.service';

const getActiveSessions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['userId', 'searchTerm']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await sessionService.getActiveSessions(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active sessions retrieved successfully',
    data: result,
  });
});

const getSessionById = catchAsync(async (req: Request, res: Response) => {
  const result = await sessionService.getSessionById(req.params.sessionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session retrieved successfully',
    data: result,
  });
});

const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const result = await sessionService.revokeSession(
    req.params.sessionId,
    req.user?.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const revokeUserSessions = catchAsync(async (req: Request, res: Response) => {
  const result = await sessionService.revokeAllUserSessions(
    req.params.userId,
    undefined,
    req.user?.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const revokeMultipleUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await sessionService.revokeMultipleUsersSessions(
    req.body.userIds,
    req.user!.id as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const revokeAllSessions = catchAsync(async (req: Request, res: Response) => {
  const result = await sessionService.revokeAllSessions(req.user!.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const sessionController = {
  getActiveSessions,
  getSessionById,
  revokeSession,
  revokeUserSessions,
  revokeMultipleUsers,
  revokeAllSessions,
};
