import { Router } from 'express';
import { githubWebhookController } from './github.controller';

const router = Router();

router.get('/events', githubWebhookController);

export default router;
