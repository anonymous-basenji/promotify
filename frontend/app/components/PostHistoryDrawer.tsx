import { useState, useEffect, useCallback } from 'react';
import { X, History, ExternalLink, Trash2, Calendar, Clock, Loader2, MessageSquare } from 'lucide-react';
import { apiFetch } from '~/lib/api';
import type { FacebookGroup, PostLog } from '~/types/promotify';

interface PostHistoryDrawerProps {
  group: FacebookGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onPostDeleted?: () => void;
}

export function PostHistoryDrawer({
  group,
  isOpen,
  onClose,
  onPostDeleted,
}: PostHistoryDrawerProps) {
  const [logs, setLogs] = useState<PostLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      const data = await apiFetch<PostLog[]>(
        `/api/groups/${group.facebook_group_id}/history`
      );
      setLogs(data);
    } catch (err) {
      console.error('Failed to load group post history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [group]);

  useEffect(() => {
    if (isOpen && group) {
      loadHistory();
    }
  }, [isOpen, group, loadHistory]);

  const handleDeletePost = async (postLogId: string) => {
    if (!confirm('Are you sure you want to delete this post log entry?')) return;

    try {
      await apiFetch<{ success: boolean }>(`/api/posts/${postLogId}`, {
        method: 'DELETE',
      });
      setLogs((prev) => prev.filter((p) => p.post_log_id !== postLogId));
      if (onPostDeleted) onPostDeleted();
    } catch (err) {
      console.error('Failed to delete post log:', err);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={22} className="text-accent" />
            <div>
              <h2 className="modal-title">Group Post History</h2>
              <p className="modal-subtitle">{group.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {group.group_url && (
            <a
              href={group.group_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group-direct-link"
              style={{ marginBottom: '16px', display: 'inline-flex' }}
            >
              <span>Open Group on Facebook</span>
              <ExternalLink size={14} />
            </a>
          )}

          <div className="history-timeline">
            {isLoading ? (
              <div className="loading-state">
                <Loader2 size={24} className="spin text-accent" />
                <p>Loading history...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="empty-history-state">
                <p className="empty-text">No posts have been logged for this group yet.</p>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Click "Mark as Posted" on the dashboard when you share promo copy here.
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const posterName =
                  log.poster_profile?.full_name ||
                  log.poster_profile?.email?.split('@')[0] ||
                  'Team Member';
                const postTime = new Date(log.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const postDate = new Date(log.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={log.post_log_id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-card">
                      <div className="timeline-header">
                        <div className="timeline-user">
                          {log.poster_profile?.avatar_url ? (
                            <img
                              src={log.poster_profile.avatar_url}
                              alt={posterName}
                              className="timeline-avatar"
                            />
                          ) : (
                            <div className="timeline-avatar-fallback">
                              {posterName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="timeline-user-name">{posterName}</span>
                            <div className="timeline-date-time">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {postDate}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {postTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePost(log.post_log_id)}
                          className="btn-icon btn-danger-soft"
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {log.notes && (
                        <div className="timeline-notes">
                          <MessageSquare size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{log.notes}</span>
                        </div>
                      )}

                      {log.post_url && (
                        <a
                          href={log.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="timeline-post-link"
                        >
                          <span>View Post</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
