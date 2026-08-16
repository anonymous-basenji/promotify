import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.delete('/:postLogId', postController.deletePost);

export default router;
