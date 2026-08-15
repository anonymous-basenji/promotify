import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Share2,
  Copy,
  Check,
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  AlertCircle,
  Sparkles,
  X,
  Undo,
  History,
  Loader2,
  Save,
} from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import { teamService } from '~/services/teamService';
import { groupService } from '~/services/groupService';
import { postService } from '~/services/postService';
import type { DayOfWeek, FacebookGroup, PostLog, Team, ViewFilter } from '~/types/promotify';
import { DAYS_OF_WEEK } from '~/types/promotify';
import { HeaderBar } from '~/components/HeaderBar';
import { TeamMembersModal } from '~/components/TeamMembersModal';
import { PostHistoryDrawer } from '~/components/PostHistoryDrawer';

export default function TeamDashboard() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [todayPosts, setTodayPosts] = useState<Record<string, PostLog>>({});
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [promoText, setPromoText] = useState('');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditingPromo, setIsEditingPromo] = useState(false);
  const [tempPromoText, setTempPromoText] = useState('');
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<ViewFilter>('today');
  const [showRestrictedOnly, setShowRestrictedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [historyDrawerGroup, setHistoryDrawerGroup] = useState<FacebookGroup | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FacebookGroup | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDays, setFormDays] = useState<Record<DayOfWeek, boolean>>({
    Sunday: true,
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
  });
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDayName = useMemo<DayOfWeek>(() => {
    const dayIndex = new Date().getDay();
    return DAYS_OF_WEEK[dayIndex];
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  const loadDashboardData = useCallback(async () => {
    if (!teamId || !user) return;
    setIsLoadingDashboard(true);
    setErrorMsg(null);

    try {
      const teamData = await teamService.getTeamById(teamId, user.id);
      if (!teamData) {
        setErrorMsg('Team workspace not found or you do not have permission to view it.');
        setIsLoadingDashboard(false);
        return;
      }
      setTeam(teamData);
      setPromoText(teamData.promo_text || '');
      setTempPromoText(teamData.promo_text || '');

      const groupData = await groupService.getTeamGroups(teamId);
      setGroups(groupData);

      const [todayLogs, counts] = await Promise.all([
        postService.getTeamPostLogsToday(teamId, todayStr),
        postService.getTeamPostCounts(teamId),
      ]);
      setTodayPosts(todayLogs);
      setPostCounts(counts);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load team data');
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [teamId, user, todayStr]);

  useEffect(() => {
    if (user && teamId) {
      loadDashboardData();
    }
  }, [user, teamId, loadDashboardData]);

  const handleCopyPromoText = () => {
    if (!promoText) return;
    navigator.clipboard.writeText(promoText);
    triggerToast('Promo text copied to clipboard! 📋');
  };

  const handleSavePromoText = async () => {
    if (!teamId) return;
    setIsSavingPromo(true);
    try {
      await teamService.updateTeamPromoText(teamId, tempPromoText);
      setPromoText(tempPromoText);
      setIsEditingPromo(false);
      triggerToast('Promo text updated! 💾');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handleOpenAddGroupModal = () => {
    setEditingGroup(null);
    setFormName('');
    setFormUrl('');
    setFormNotes('');
    setFormDays({
      Sunday: true,
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true,
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroupModal = (group: FacebookGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormUrl(group.group_url || '');
    setFormNotes(group.notes || '');
    const daysMap: Record<DayOfWeek, boolean> = {
      Sunday: false,
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
    };
    group.allowed_days.forEach((d) => {
      daysMap[d] = true;
    });
    setFormDays(daysMap);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !user || !formName.trim()) return;

    setIsSavingGroup(true);
    setErrorMsg(null);

    const selectedAllowedDays = (Object.keys(formDays) as DayOfWeek[]).filter(
      (d) => formDays[d]
    );

    try {
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.facebook_group_id, {
          name: formName,
          group_url: formUrl,
          notes: formNotes,
          allowed_days: selectedAllowedDays,
        });
        triggerToast('Group updated! ✨');
      } else {
        await groupService.createGroup(teamId, user.id, {
          name: formName,
          group_url: formUrl,
          notes: formNotes,
          allowed_days: selectedAllowedDays,
        });
        triggerToast('Group added to team! 🚀');
      }

      setIsGroupModalOpen(false);
      const updatedGroups = await groupService.getTeamGroups(teamId);
      setGroups(updatedGroups);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}" from this team?`)) {
      return;
    }

    try {
      await groupService.deleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.facebook_group_id !== groupId));
      triggerToast('Group deleted.');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleMarkPosted = async (groupId: string) => {
    if (!teamId || !user) return;

    try {
      const newLog = await postService.logPost(groupId, teamId, user.id, todayStr);
      setTodayPosts((prev) => ({
        ...prev,
        [groupId]: newLog,
      }));
      setPostCounts((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || 0) + 1,
      }));
      triggerToast('Post recorded! 🎉');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleUnmarkPosted = async (groupId: string) => {
    const postLog = todayPosts[groupId];
    if (!postLog) return;

    try {
      await postService.removePostLog(postLog.post_log_id);
      setTodayPosts((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      setPostCounts((prev) => ({
        ...prev,
        [groupId]: Math.max(0, (prev[groupId] || 1) - 1),
      }));
      triggerToast('Post unmarked.');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  const activeDayName: DayOfWeek =
    selectedFilter === 'today'
      ? todayDayName
      : selectedFilter === 'all'
      ? todayDayName
      : selectedFilter;

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = group.name.toLowerCase().includes(query);
        const matchesNotes = group.notes?.toLowerCase().includes(query);
        const matchesCreator = group.creator_profile?.full_name?.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes && !matchesCreator) {
          return false;
        }
      }

      if (selectedFilter !== 'all') {
        const allowsDay = group.allowed_days.includes(activeDayName);
        if (!allowsDay) return false;
      }

      if (showRestrictedOnly && !group.notes) {
        return false;
      }

      return true;
    });
  }, [groups, searchQuery, selectedFilter, activeDayName, showRestrictedOnly]);

  const stats = useMemo(() => {
    const activeDayGroups = groups.filter((g) => g.allowed_days.includes(activeDayName));
    const postedCount = activeDayGroups.filter((g) => !!todayPosts[g.facebook_group_id]).length;
    const totalCount = activeDayGroups.length;
    const progressPercent = totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0;

    return { postedCount, totalCount, progressPercent };
  }, [groups, todayPosts, activeDayName]);

  if (isAuthLoading || (isLoadingDashboard && !team)) {
    return (
      <div className="app-container">
        <div className="login-viewport">
          <Loader2 size={36} className="spin text-accent" />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
            Loading team dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="app-container">
        <HeaderBar />
        <div className="empty-teams-card">
          <AlertCircle size={36} className="text-accent" style={{ margin: '0 auto 12px auto' }} />
          <h3 className="empty-title">Team Not Found</h3>
          <p className="empty-subtitle">
            {errorMsg || 'This team workspace could not be found or you are not a member.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <HeaderBar
        currentTeam={team}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
      />

      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner alert-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="btn-icon" style={{ marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <main className="dashboard-content">
        <section className="promo-text-card">
          <div className="promo-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} className="text-accent" />
              <h3 className="section-title">Team Promo Post Copy</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isEditingPromo ? (
                <>
                  <button
                    onClick={() => {
                      setTempPromoText(promoText);
                      setIsEditingPromo(false);
                    }}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePromoText}
                    disabled={isSavingPromo}
                    className="btn-primary btn-sm"
                  >
                    {isSavingPromo ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                    <span>Save</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingPromo(true)}
                    className="btn-secondary btn-sm"
                    title="Edit promo template"
                  >
                    <Edit3 size={14} />
                    <span>Edit Copy</span>
                  </button>
                  <button
                    onClick={handleCopyPromoText}
                    className="btn-primary btn-sm copy-btn"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                    <span>Copy Text</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditingPromo ? (
            <textarea
              rows={4}
              value={tempPromoText}
              onChange={(e) => setTempPromoText(e.target.value)}
              placeholder="Enter your team's promo copy template here..."
              className="textarea-field promo-edit-textarea"
              autoFocus
            />
          ) : (
            <div className="promo-preview-box" onClick={handleCopyPromoText} title="Click to copy">
              <p className="promo-preview-text">
                {promoText || 'No promo text set yet. Click "Edit Copy" to add your promo message!'}
              </p>
            </div>
          )}
        </section>

        <section className="controls-section">
          <div className="day-tabs-scroll">
            <div className="day-tabs-container">
              <button
                onClick={() => setSelectedFilter('today')}
                className={`day-tab ${selectedFilter === 'today' ? 'active' : ''}`}
              >
                <Calendar size={14} />
                <span>Today ({todayDayName.slice(0, 3)})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('all')}
                className={`day-tab ${selectedFilter === 'all' ? 'active' : ''}`}
              >
                <span>All Groups</span>
              </button>

              <div className="day-tab-divider" />

              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedFilter(day)}
                  className={`day-tab ${selectedFilter === day ? 'active' : ''}`}
                >
                  <span>{day.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search groups, notes, creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="btn-clear-search">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="filter-options">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showRestrictedOnly}
                  onChange={(e) => setShowRestrictedOnly(e.target.checked)}
                />
                <span>Notes Only</span>
              </label>

              <button onClick={handleOpenAddGroupModal} className="btn-primary btn-sm add-group-btn">
                <Plus size={16} />
                <span>Add Group</span>
              </button>
            </div>
          </div>

          {selectedFilter !== 'all' && (
            <div className="progress-banner">
              <div className="progress-info">
                <span className="progress-label">
                  {selectedFilter === 'today' ? "Today's Progress" : `${activeDayName}'s Progress`}
                </span>
                <span className="progress-counts">
                  {stats.postedCount} of {stats.totalCount} groups posted ({stats.progressPercent}%)
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="groups-section">
          {filteredGroups.length === 0 ? (
            <div className="empty-groups-state">
              <div className="empty-icon-circle">
                <Calendar size={32} className="text-accent" />
              </div>
              <h4 className="empty-title">No groups found</h4>
              <p className="empty-subtitle">
                {groups.length === 0
                  ? 'Get started by adding your first Facebook group to this team!'
                  : 'No groups match your current filter or day selection.'}
              </p>
              {groups.length === 0 && (
                <button
                  onClick={handleOpenAddGroupModal}
                  className="btn-primary"
                  style={{ marginTop: '14px' }}
                >
                  <Plus size={16} />
                  <span>Add First Facebook Group</span>
                </button>
              )}
            </div>
          ) : (
            <div className="groups-list">
              {filteredGroups.map((group) => {
                const todayLog = todayPosts[group.facebook_group_id];
                const isPostedToday = !!todayLog;
                const totalGroupPosts = postCounts[group.facebook_group_id] || 0;
                const creatorName =
                  group.creator_profile?.full_name ||
                  group.creator_profile?.email?.split('@')[0] ||
                  'Team';
                const posterName =
                  todayLog?.poster_profile?.full_name ||
                  todayLog?.poster_profile?.email?.split('@')[0] ||
                  'Team Member';
                const postedTime = todayLog
                  ? new Date(todayLog.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
                  <div
                    key={group.facebook_group_id}
                    className={`group-card ${isPostedToday ? 'group-posted' : ''}`}
                  >
                    <div className="group-card-main">
                      <div className="group-header-line">
                        <h4 className="group-name">{group.name}</h4>
                        {group.group_url && (
                          <a
                            href={group.group_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group-url-badge"
                            title="Open on Facebook"
                          >
                            <span>Open</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {group.notes && (
                        <div className="group-notes-box">
                          <AlertCircle size={14} className="notes-icon" />
                          <span>{group.notes}</span>
                        </div>
                      )}

                      <div className="group-meta-row">
                        <span className="meta-chip creator-chip" title="Added to team by">
                          Added by {creatorName}
                        </span>

                        <button
                          onClick={() => setHistoryDrawerGroup(group)}
                          className="meta-chip history-chip"
                          title="View complete post history"
                        >
                          <History size={12} />
                          <span>{totalGroupPosts} {totalGroupPosts === 1 ? 'post' : 'posts'} logged</span>
                        </button>

                        <div className="group-days-chips">
                          {DAYS_OF_WEEK.map((day) => {
                            const allowed = group.allowed_days.includes(day);
                            return (
                              <span
                                key={day}
                                className={`day-chip ${allowed ? 'day-chip-active' : 'day-chip-inactive'}`}
                              >
                                {day.slice(0, 1)}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {isPostedToday && (
                        <div className="posted-status-badge">
                          <Check size={14} />
                          <span>
                            Posted today by {posterName} at {postedTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="group-actions-col">
                      {isPostedToday ? (
                        <button
                          onClick={() => handleUnmarkPosted(group.facebook_group_id)}
                          className="btn-undo-post"
                          title="Undo today's post record"
                        >
                          <Undo size={14} />
                          <span>Undo</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkPosted(group.facebook_group_id)}
                          className="btn-mark-posted"
                          title="Mark this group as posted for today"
                        >
                          <Check size={16} />
                          <span>Mark Posted</span>
                        </button>
                      )}

                      <div className="group-manage-btns">
                        <button
                          onClick={() => handleOpenEditGroupModal(group)}
                          className="btn-icon"
                          title="Edit group"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteGroup(group.facebook_group_id, group.name)
                          }
                          className="btn-icon btn-danger-soft"
                          title="Delete group"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {isGroupModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsGroupModalOpen(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} className="text-accent" />
                <div>
                  <h2 className="modal-title">
                    {editingGroup ? 'Edit Facebook Group' : 'Add Facebook Group'}
                  </h2>
                  <p className="modal-subtitle">Team: {team.name}</p>
                </div>
              </div>
              <button onClick={() => setIsGroupModalOpen(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Group Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Local Community Events & Fairs"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Facebook Group URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/groups/..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Posting Rules / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Only post in weekly admin promo thread"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Allowed Posting Days</label>
                  <div className="days-checkbox-grid">
                    {DAYS_OF_WEEK.map((day) => (
                      <label key={day} className="day-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formDays[day]}
                          onChange={(e) =>
                            setFormDays((prev) => ({
                              ...prev,
                              [day]: e.target.checked,
                            }))
                          }
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGroup || !formName.trim()}
                  className="btn-primary"
                >
                  {isSavingGroup ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingGroup ? 'Update Group' : 'Add Group'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMembersModalOpen && (
        <TeamMembersModal
          teamId={team.team_id}
          teamName={team.name}
          currentUserRole={team.user_role || 'member'}
          isOpen={true}
          onClose={() => setIsMembersModalOpen(false)}
        />
      )}

      {historyDrawerGroup && (
        <PostHistoryDrawer
          group={historyDrawerGroup}
          isOpen={true}
          onClose={() => setHistoryDrawerGroup(null)}
          onPostDeleted={() => loadDashboardData()}
        />
      )}
    </div>
  );
}
