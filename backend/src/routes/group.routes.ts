import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/team/:teamId', groupController.getTeamGroups);
router.post('/team/:teamId', groupController.createGroup);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

export default router;
