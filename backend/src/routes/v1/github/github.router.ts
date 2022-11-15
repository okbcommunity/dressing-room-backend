import { Router } from 'express';
import { githubWebhookController } from './github.controller';

const router = Router();

router.post('/events', githubWebhookController);

export default router;
