import express from 'express';
import { STAGE } from '../../config';
import appConfig from '../../config/app.config';
import { migrate } from '../../core/migration';
import { AppError } from '../../middleware/error';

export async function migrateController(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    if (appConfig.stage === STAGE.LOCAL) {
      // Call migrate script
      await migrate();

      // Response
      res.sendStatus(200);
    } else {
      throw new AppError(404);
    }
  } catch (err: any) {
    next(err);
  }
}
