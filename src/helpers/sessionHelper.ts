import { Request } from 'express';

export type SessionMeta = {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
};

const extractSessionMeta = (req: Request): SessionMeta => {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;

  const userAgent = req.headers['user-agent'] || undefined;

  let deviceInfo: string | undefined;
  if (userAgent) {
    if (/mobile/i.test(userAgent)) deviceInfo = 'Mobile';
    else if (/tablet/i.test(userAgent)) deviceInfo = 'Tablet';
    else deviceInfo = 'Desktop';
  }

  return { ipAddress, userAgent, deviceInfo };
};

const parseRefreshExpiry = (expiresIn: string): Date => {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
};

const expiryToMs = (expiresIn: string): number => {
  const expiryDate = parseRefreshExpiry(expiresIn);
  return Math.max(expiryDate.getTime() - Date.now(), 0);
};

export const sessionHelper = {
  extractSessionMeta,
  parseRefreshExpiry,
  expiryToMs,
};
