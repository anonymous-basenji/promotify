import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Sparkles, 
  LogOut, 
  Users, 
  Layers, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import type { Team } from '~/types/promotify';
import './HeaderBar.css';

interface HeaderBarProps {
  currentTeam?: Team | null;
  onOpenMembersModal?: () => void;
  onOpenSettingsModal?: () => void;
}

export function HeaderBar({
  currentTeam,
  onOpenMembersModal,
  onOpenSettingsModal,
}: HeaderBarProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;
  const userEmail = profile?.email || user?.email || '';
  const isAdmin = currentTeam?.user_role === 'owner' || currentTeam?.user_role === 'admin';

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
      </div>

      <div className="header-actions header-actions-desktop">
        {currentTeam && onOpenMembersModal && (
          <button
            onClick={onOpenMembersModal}
            className="btn-secondary header-btn"
            title="Team Members & Admins"
          >
            <Users size={16} />
            <span>Members</span>
          </button>
        )}

        {currentTeam && isAdmin && onOpenSettingsModal && (
          <button
            onClick={onOpenSettingsModal}
            className="btn-secondary header-btn"
            title="Edit Workspace Settings"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        )}

        {user && (
          <div className="user-profile-menu">
            <div className="user-avatar-wrapper" title={userEmail}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="user-avatar-img" />
              ) : (
                <div className="user-avatar-fallback">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="user-name-text">{displayName}</span>
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

      <div className="header-actions-mobile">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn-icon mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="mobile-menu-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-dropdown-menu">
            {user && (
              <div className="mobile-menu-user-header">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-fallback">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div className="mobile-menu-user-name">{displayName}</div>
                  <div className="mobile-menu-user-email">{userEmail}</div>
                </div>
              </div>
            )}

            <div className="mobile-menu-items">
              {currentTeam && onOpenMembersModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenMembersModal();
                  }}
                  className="mobile-menu-item"
                >
                  <Users size={16} className="text-accent" />
                  <span>Team Members & Admins</span>
                </button>
              )}

              {currentTeam && isAdmin && onOpenSettingsModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSettingsModal();
                  }}
                  className="mobile-menu-item"
                >
                  <Settings size={16} className="text-accent" />
                  <span>Team Settings</span>
                </button>
              )}

              <Link
                to="/teams"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-menu-item"
              >
                <Layers size={16} />
                <span>All Workspaces</span>
              </Link>

              <div className="mobile-menu-divider" />

              <button
                onClick={handleSignOut}
                className="mobile-menu-item mobile-menu-item-danger"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
