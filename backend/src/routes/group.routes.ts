import { Router } from 'express';
import { groupController } from '../controllers/group.controller.js';
import { postController } from '../controllers/post.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);
router.get('/:groupId/history', postController.getGroupHistory);
router.delete('/:groupId/posts', postController.resetGroupPosts);

export default router;
