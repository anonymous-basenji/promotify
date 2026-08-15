import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', teamController.getTeams);
router.post('/', teamController.createTeam);
router.get('/:teamId', teamController.getTeam);
router.patch('/:teamId/promo', teamController.updatePromo);

router.get('/:teamId/members', teamController.getMembers);
router.post('/:teamId/members', teamController.addMember);
router.patch('/:teamId/members/:memberId', teamController.updateMemberRole);
router.delete('/:teamId/members/:memberId', teamController.removeMember);

export default router;
