import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import handleZodError from '../../errors/handleZodError';
import parsePrismaValidationError from '../../errors/parsePrismaValidationError';
import ApiError from '../../errors/ApiErrors';

const isDevelopment = process.env.NODE_ENV === 'development';

const GlobalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = err instanceof Error ? err.message : 'Something went wrong!';
  let errorSources: { path?: string; message: string }[] = [];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode ?? httpStatus.BAD_REQUEST;
    message = simplifiedError?.message ?? 'Validation Error';
    errorSources = simplifiedError?.errorSources ?? [];
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ message: err.message }];
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = httpStatus.BAD_REQUEST;
    if (err.code === 'P2031') {
      message =
        'MongoDB must run as a replica set for write operations. See README for local setup.';
    } else {
      message = err.message;
    }
    errorSources = [{ message: `Prisma Error (${err.code})` }];
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = parsePrismaValidationError(err.message);
    errorSources = [{ message: 'Prisma Client Validation Error' }];
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      'Failed to initialize Prisma Client. Check your database connection or Prisma configuration.';
    errorSources = [{ message: 'Prisma Client Initialization Error' }];
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      'A critical error occurred in the Prisma engine. Please try again later.';
    errorSources = [{ message: 'Prisma Client Rust Panic Error' }];
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'An unknown error occurred while processing the request.';
    errorSources = [{ message: 'Prisma Client Unknown Request Error' }];
  } else if (err instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Syntax error in the request. Please verify your input.';
    errorSources = [{ message: 'Syntax Error' }];
  } else if (err instanceof TypeError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Type error in the application. Please verify your input.';
    errorSources = [{ message: 'Type Error' }];
  } else if (err instanceof ReferenceError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Reference error in the application. Please verify your input.';
    errorSources = [{ message: 'Reference Error' }];
  } else {
    message = 'An unexpected error occurred!';
    errorSources = [{ message: 'Unknown Error' }];
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
    errorSources,
  };

  if (isDevelopment && err instanceof Error) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

export default GlobalErrorHandler;
