import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import { Secret } from 'jsonwebtoken';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import { sessionService } from '../modules/Session/session.service';

const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return authorizationHeader;
  }

  return token;
};

const auth = (...roles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      if (!verifiedUser.sessionId) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Invalid token: session missing!'
        );
      }

      const session = await sessionService.validateSession(
        verifiedUser.sessionId
      );

      if (session.userId !== verifiedUser.id) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid session!');
      }

      sessionService.touchSession(verifiedUser.sessionId);

      req.user = verifiedUser;
      req.sessionId = verifiedUser.sessionId;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden!');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
