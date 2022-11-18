import { Request, Response } from 'express';
import { STAGE } from '../../config';
import appConfig from '../../config/app.config';
import { migrate } from '../../core/migration';

export async function migrateController(req: Request, res: Response) {
  if (appConfig.stage === STAGE.LOCAL) {
    try {
      await migrate();
      res.sendStatus(200);
    } catch (err) {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(404);
  }
}
