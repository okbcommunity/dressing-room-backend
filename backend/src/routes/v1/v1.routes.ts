import { Router } from 'express';
import githubRoutes from './github';

const router = Router();

router.use('/github', githubRoutes);

export default router;
