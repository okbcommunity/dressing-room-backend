import express from 'express';
import config from '../config';
import v1Routes from './v1';

const router = express.Router();

router.use('/v1', v1Routes);
router.use(
  '/info',
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      res.send({
        apiVersion: 'v1',
        version: config.app.packageVersion,
        repo: 'https://github.com/okbcommunity/dressing-room-backend',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
