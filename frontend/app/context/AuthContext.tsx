import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabaseClient';
import type { Profile } from '~/types/promotify';
import { Clock, LogOut } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION_MS = 2 * 60 * 1000;    // 2 minutes warning
const THROTTLE_MS = 15 * 1000;                // 15 seconds
const STORAGE_KEY = 'promotify_last_active';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const showWarningRef = useRef(showInactivityWarning);
  showWarningRef.current = showInactivityWarning;
  const lastThrottledUpdateRef = useRef(Date.now());

  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    lastThrottledUpdateRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {}
    setShowInactivityWarning(false);
  }, []);

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Error loading profile:', error.message);
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        const newProfile: Profile = {
          user_id: authUser.id,
          email: authUser.email || '',
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'User',
          avatar_url: authUser.user_metadata?.avatar_url || null,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        if (!insertError && inserted) {
          setProfile(inserted as Profile);
        } else {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('Failed to sync profile:', err);
    }
  }, []);

  useEffect(() => {
    const isExpired = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const lastActive = parseInt(stored, 10);
          if (!isNaN(lastActive)) {
            return Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS;
          }
        }
      } catch {}
      return false;
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession && isExpired()) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        supabase.auth.signOut().finally(() => {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsLoading(false);
        });
        return;
      }

      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
          }
        } catch {}
        fetchProfile(currentUser).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_IN') {
        try {
          localStorage.setItem(STORAGE_KEY, Date.now().toString());
        } catch {}
      } else if (currentSession && isExpired()) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        supabase.auth.signOut().finally(() => {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsLoading(false);
        });
        return;
      }

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/teams` 
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = useCallback(async () => {
    try {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setShowInactivityWarning(false);
    }
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    if (!user) {
      setShowInactivityWarning(false);
      return;
    }

    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    } catch {}

    const handleUserActivity = () => {
      if (showWarningRef.current) return;
      const now = Date.now();
      if (now - lastThrottledUpdateRef.current > THROTTLE_MS) {
        lastThrottledUpdateRef.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, now.toString());
        } catch {}
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const checkInactivity = () => {
      let lastActive = Date.now();
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          lastActive = parseInt(stored, 10);
        }
      } catch {}

      const now = Date.now();
      const elapsed = now - lastActive;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setShowInactivityWarning(false);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        signOut();
      } else if (elapsed >= INACTIVITY_TIMEOUT_MS - WARNING_DURATION_MS) {
        const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
    };

    checkInactivity();
    const intervalId = setInterval(checkInactivity, 1000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        checkInactivity();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkInactivity);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkInactivity);
    };
  }, [user, signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
      {showInactivityWarning && user && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-content modal-md" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: '32px 24px', alignItems: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  marginBottom: '8px',
                }}
              >
                <Clock size={28} />
              </div>
              <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>
                Session Timeout Warning
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                You have been inactive for a while. To protect your account, your session will expire in:
              </p>
              <div
                style={{
                  fontSize: '2.25rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  color: secondsRemaining <= 30 ? 'var(--accent-rose)' : 'var(--accent-amber)',
                  letterSpacing: '0.05em',
                  margin: '4px 0',
                }}
              >
                {Math.floor(secondsRemaining / 60)}:
                {(secondsRemaining % 60).toString().padStart(2, '0')}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Click below to stay logged in.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  width: '100%',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={signOut}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={resetInactivityTimer}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
