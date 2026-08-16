import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { groupController } from '../controllers/group.controller';
import { postController } from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', teamController.getTeams);
router.post('/', teamController.createTeam);
router.get('/:teamId', teamController.getTeam);
router.put('/:teamId', teamController.updateTeam);
router.delete('/:teamId', teamController.deleteTeam);
router.patch('/:teamId/promo', teamController.updatePromo);

router.get('/:teamId/members', teamController.getMembers);
router.post('/:teamId/members', teamController.addMember);
router.patch('/:teamId/members/:memberId', teamController.updateMemberRole);
router.delete('/:teamId/members/:memberId', teamController.removeMember);

router.get('/:teamId/groups', groupController.getTeamGroups);
router.post('/:teamId/groups', groupController.createGroup);

router.get('/:teamId/posts/today', postController.getTodayPosts);
router.get('/:teamId/posts/counts', postController.getPostCounts);
router.post('/:teamId/posts', postController.logPost);

export default router;
