import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '../interfaces/auth';

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string
) => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

const generateAccessToken = (
  payload: TokenPayload,
  secret: Secret,
  expiresIn: string
) => {
  return generateToken(
    payload as unknown as Record<string, unknown>,
    secret,
    expiresIn
  );
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload & TokenPayload;
};

export const jwtHelpers = {
  generateToken,
  generateAccessToken,
  verifyToken,
};
