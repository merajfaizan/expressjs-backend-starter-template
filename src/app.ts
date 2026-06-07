import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import GlobalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './app/routes';
import config from './config';

const app: Application = express();

export const corsOptions = {
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (_req: Request, res: Response) => {
  res.send({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Welcome to Express Backend Starter!',
  });
});

app.get('/reset-password', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'reset-password.html'));
});

app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth/refresh-token', authRateLimiter);
app.use('/api/v1/auth/forgot-password', authRateLimiter);
app.use('/api/v1', router);

app.use(GlobalErrorHandler);

app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

export default app;
