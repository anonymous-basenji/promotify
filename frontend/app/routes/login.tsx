import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import './login.css';

export default function Login() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/teams', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthError(error.message);
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="login-viewport">
        <Loader2 size={36} className="spin text-accent" />
      </div>
    );
  }

  return (
    <div className="login-viewport">
      <div className="login-card">
        <div className="login-brand-header">
          <div className="login-icon-box">
            <Sparkles size={28} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <h1 className="login-title">Promotify One</h1>
            <span className="brand-badge">BETA</span>
          </div>
          <p className="login-subtitle">
            Coordinate festival & campaign promotions across Facebook groups with your team.
          </p>
        </div>

        {authError && (
          <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        <div className="login-actions">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="btn-google-signin"
          >
            {isSigningIn ? (
              <>
                <Loader2 size={20} className="spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <span>Sign in with Google</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
