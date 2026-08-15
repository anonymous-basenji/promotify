import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Plus, 
  Users, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import { teamService } from '~/services/teamService';
import type { Team } from '~/types/promotify';
import { HeaderBar } from '~/components/HeaderBar';
import { TeamMembersModal } from '~/components/TeamMembersModal';

export default function Teams() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamPromoText, setTeamPromoText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [activeManagingTeam, setActiveManagingTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  const loadTeams = useCallback(async () => {
    if (!user) return;
    setIsLoadingTeams(true);
    setErrorMsg(null);
    try {
      const data = await teamService.getUserTeams(user.id);
      setTeams(data);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user, loadTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !teamName.trim()) return;

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const newTeam = await teamService.createTeam(
        teamName,
        teamDescription,
        teamPromoText,
        user.id
      );

      setIsCreateModalOpen(false);
      setTeamName('');
      setTeamDescription('');
      setTeamPromoText('');

      navigate(`/teams/${newTeam.team_id}`);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
      setIsCreating(false);
    }
  };

  if (isAuthLoading || (isLoadingTeams && teams.length === 0)) {
    return (
      <div className="app-container">
        <div className="login-viewport">
          <Loader2 size={36} className="spin text-accent" />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <HeaderBar />

      <main className="teams-view-content">
        <div className="teams-header-row">
          <div>
            <h2 className="page-title">Your Workspaces</h2>
            <p className="page-subtitle">
              Select a festival or campaign team to manage its Facebook group promotion roster.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary create-team-btn"
          >
            <Plus size={18} />
            <span>Create Team</span>
          </button>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="empty-teams-card">
            <div className="empty-icon-circle">
              <Layers size={36} className="text-accent" />
            </div>
            <h3 className="empty-title">No teams found</h3>
            <p className="empty-subtitle">
              Get started by creating your first festival or campaign team workspace.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              <Plus size={18} />
              <span>Create Your First Team</span>
            </button>
          </div>
        ) : (
          <div className="teams-grid">
            {teams.map((team) => {
              const isAdmin = team.user_role === 'owner' || team.user_role === 'admin';

              return (
                <div key={team.team_id} className="team-card">
                  <div className="team-card-header">
                    <div className="team-card-icon">
                      <Layers size={22} />
                    </div>
                    {team.user_role && (
                      <span className={`role-badge role-${team.user_role}`}>
                        {team.user_role === 'owner' ? (
                          <>
                            <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                            OWNER
                          </>
                        ) : (
                          team.user_role.toUpperCase()
                        )}
                      </span>
                    )}
                  </div>

                  <div className="team-card-body">
                    <h3 className="team-card-title">{team.name}</h3>
                    <p className="team-card-desc">
                      {team.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="team-card-footer">
                    <button
                      onClick={() => setActiveManagingTeam(team)}
                      className="btn-secondary team-members-btn"
                      title="Manage members and admins"
                    >
                      <Users size={16} />
                      <span>{isAdmin ? 'Manage Members' : 'View Members'}</span>
                    </button>

                    <Link
                      to={`/teams/${team.team_id}`}
                      className="btn-primary team-enter-btn"
                    >
                      <span>Open</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} className="text-accent" />
                <div>
                  <h2 className="modal-title">Create Team Workspace</h2>
                  <p className="modal-subtitle">Set up a new festival or promotion campaign</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greek Festival 2026 or Fall Festival"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Social media promotion team for September event"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Promo Post Text (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Enter the template post text your team will copy-paste to Facebook groups..."
                    value={teamPromoText}
                    onChange={(e) => setTeamPromoText(e.target.value)}
                    className="textarea-field"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !teamName.trim()}
                  className="btn-primary"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Team</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeManagingTeam && (
        <TeamMembersModal
          teamId={activeManagingTeam.team_id}
          teamName={activeManagingTeam.name}
          currentUserRole={activeManagingTeam.user_role || 'member'}
          isOpen={true}
          onClose={() => setActiveManagingTeam(null)}
        />
      )}
    </div>
  );
}
