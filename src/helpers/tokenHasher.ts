import { createHash, randomBytes } from 'crypto';

const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

const generateRefreshToken = (): string => {
  return randomBytes(64).toString('hex');
};

export const tokenHasher = {
  hashToken,
  generateRefreshToken,
};
