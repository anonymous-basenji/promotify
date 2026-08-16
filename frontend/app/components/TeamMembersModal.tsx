import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Shield, ShieldCheck, UserCheck, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '~/lib/api';
import type { TeamMember, TeamRole } from '~/types/promotify';
import { useAuth } from '~/context/AuthContext';

interface TeamMembersModalProps {
  teamId: string;
  teamName: string;
  currentUserRole: TeamRole;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamMembersModal({
  teamId,
  teamName,
  currentUserRole,
  isOpen,
  onClose,
}: TeamMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<TeamMember[]>(`/api/teams/${teamId}/members`);
      setMembers(data);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiFetch<TeamMember>(`/api/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail('');
      setSuccessMsg(`Added ${inviteEmail} to ${teamName}!`);
      await loadMembers();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, newRole: TeamRole) => {
    try {
      await apiFetch<{ success: boolean }>(
        `/api/teams/${teamId}/members/${member.team_member_id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: newRole }),
        }
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.team_member_id === member.team_member_id ? { ...m, role: newRole } : m
        )
      );
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    const memberName = member.profile?.full_name || member.profile?.email || 'this user';
    if (!confirm(`Are you sure you want to remove ${memberName} from ${teamName}?`)) {
      return;
    }

    try {
      await apiFetch<{ success: boolean }>(
        `/api/teams/${teamId}/members/${member.team_member_id}`,
        {
          method: 'DELETE',
        }
      );
      setMembers((prev) => prev.filter((m) => m.team_member_id !== member.team_member_id));
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} className="text-accent" />
            <div>
              <h2 className="modal-title">{teamName}</h2>
              <p className="modal-subtitle">Team Roster & Admins</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div className="alert-banner alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-banner alert-success">
              <UserCheck size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add member form for admins */}
          {canManageMembers && (
            <form onSubmit={handleAddMember} className="member-invite-box">
              <h4 className="section-small-title">Add Team Member</h4>
              <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                Enter the email address of a user who has signed into Promotify One.
              </p>
              <div className="invite-inputs-row">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input-field"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="select-field role-select"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail.trim()}
                  className="btn-primary invite-btn"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Members List */}
          <div className="members-list-wrapper">
            <h4 className="section-small-title" style={{ marginTop: '16px', marginBottom: '10px' }}>
              Members ({members.length})
            </h4>

            {isLoading ? (
              <div className="loading-state">
                <Loader2 size={24} className="spin text-accent" />
                <p>Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <p className="empty-text">No members found.</p>
            ) : (
              <div className="members-list">
                {members.map((member) => {
                  const isSelf = member.user_id === user?.id;
                  const isOwner = member.role === 'owner';
                  const displayName =
                    member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Member';

                  return (
                    <div key={member.team_member_id} className="member-row">
                      <div className="member-info">
                        {member.profile?.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt={displayName}
                            className="member-avatar-img"
                          />
                        ) : (
                          <div className="member-avatar-fallback">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="member-name">{displayName}</span>
                            {isSelf && <span className="tag-self">You</span>}
                          </div>
                          <span className="member-email">{member.profile?.email || 'No email'}</span>
                        </div>
                      </div>

                      <div className="member-actions">
                        {canManageMembers && !isOwner && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member, e.target.value as TeamRole)
                            }
                            className={`role-badge-select role-${member.role}`}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`role-badge role-${member.role}`}>
                            {isOwner ? (
                              <>
                                <Shield size={12} style={{ marginRight: '4px' }} />
                                OWNER
                              </>
                            ) : (
                              member.role.toUpperCase()
                            )}
                          </span>
                        )}

                        {canManageMembers && !isOwner && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="btn-icon btn-danger-soft"
                            title="Remove member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
