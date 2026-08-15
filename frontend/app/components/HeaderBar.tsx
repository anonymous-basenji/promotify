import { useNavigate, Link } from 'react-router';
import { Sparkles, LogOut, Users, ChevronRight, Layers } from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import type { Team } from '~/types/promotify';

interface HeaderBarProps {
  currentTeam?: Team | null;
  onOpenMembersModal?: () => void;
}

export function HeaderBar({ currentTeam, onOpenMembersModal }: HeaderBarProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="header-bar">
      <div className="brand">
        <Link to="/teams" className="brand-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="brand-title">Promotify One</h1>
              <span className="brand-badge">BETA</span>
            </div>
            <p className="brand-subtitle">Team Promotional Distribution Matrix</p>
          </div>
        </Link>

        {currentTeam && (
          <div className="team-breadcrumb">
            <ChevronRight size={16} className="breadcrumb-separator" />
            <Link to="/teams" className="breadcrumb-team-pill" title="Switch Team">
              <Layers size={14} />
              <span className="breadcrumb-team-name">{currentTeam.name}</span>
            </Link>
            {currentTeam.user_role && (
              <span className={`role-badge role-${currentTeam.user_role}`}>
                {currentTeam.user_role.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="header-actions">
        {currentTeam && onOpenMembersModal && (
          <button
            onClick={onOpenMembersModal}
            className="btn-secondary header-btn"
            title="Team Members & Admins"
          >
            <Users size={16} />
            <span className="hide-on-mobile">Members</span>
          </button>
        )}

        {user && (
          <div className="user-profile-menu">
            <div className="user-avatar-wrapper" title={profile?.email || user.email || ''}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="user-avatar-img" />
              ) : (
                <div className="user-avatar-fallback">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="user-name-text hide-on-mobile">{displayName}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="btn-icon btn-signout"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
