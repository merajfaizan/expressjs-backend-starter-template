import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

const validateRequest =
  (schema: ZodType) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
