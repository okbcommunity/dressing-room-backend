import { Request, Response } from 'express';

export async function migrateController(req: Request, res: Response) {
  try {
    await migrate();
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
}
