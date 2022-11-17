import { Router } from 'express';
import { migrateController } from './v1.controller';
import githubRoutes from './github';

const router = Router();

router.use('/github', githubRoutes);
router.get('/migrate', migrateController);

export default router;
