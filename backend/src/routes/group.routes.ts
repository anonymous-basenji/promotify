import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { postController } from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);
router.get('/:groupId/history', postController.getGroupHistory);
router.delete('/:groupId/posts', postController.resetGroupPosts);

export default router;
