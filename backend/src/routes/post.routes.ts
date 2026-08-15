import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/team/:teamId/today', postController.getTodayPosts);
router.get('/team/:teamId/counts', postController.getPostCounts);
router.get('/group/:groupId/history', postController.getGroupHistory);
router.post('/team/:teamId', postController.logPost);
router.delete('/:postLogId', postController.deletePost);

export default router;
