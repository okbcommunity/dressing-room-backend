import express from 'express';
import config from '../config';

const router = express.Router();

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
