import express from 'express';
import config from '../config';
import v1Routes from './v1';

const router = express.Router();

router.unsubscribe('/v1', v1Routes);
router.use('/info', (req, res) => {
  console.log('Info');
  try {
    res.send({
      version: config.app.packageVersion,
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

export default router;
