import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FAQ from '../components/FAQ';

const Login = ({ onNavigate }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <>
      <div className="auth-wrapper">
        <div className="card-panel auth-card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="auth-header blur-reveal" style={{ animationDelay: '200ms' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Welcome</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Employee Leave Management System</p>
          </div>

          {error && (
            <div className="toast error" style={{ minWidth: 'auto', marginBottom: '1.5rem', animation: 'none', padding: '0.75rem 1rem' }}>
              <span className="toast-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              <div className="toast-content">
                <div className="toast-message" style={{ fontSize: '0.8rem' }}>{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                className="form-control"
                placeholder="manager@gcu.in or username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  className="auth-link"
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot?
                </button>
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye off icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    // Eye icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me removed for strict tab-isolation security */}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: loading ? '1rem' : '0' }}
              disabled={loading}
            >
              {loading && <span className="spinner"></span>}
              {loading ? 'Connecting to Server...' : 'Sign In'}
            </button>

            {loading && (
              <div className="cold-start-alert blur-reveal" style={{ animationDelay: '100ms' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>
                  Please wait while we wake up our secure servers. Since we use eco-friendly hosting, initial connection may take up to 60 seconds.
                </span>
              </div>
            )}
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <button 
              className="auth-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onNavigate('register')}
            >
              Register here
            </button>
          </div>
        </div>
        <FAQ />
      </div>

      {showForgotModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card-panel blur-reveal" style={{ 
            maxWidth: '400px', width: '90%', padding: '2.5rem 2rem', 
            textAlign: 'center', border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'rgba(255, 171, 0, 0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--warning-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Password Reset
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              Please contact your system administrator or HR department directly to request a secure password reset link.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowForgotModal(false)}
              style={{ width: '100%', padding: '0.75rem', fontWeight: '600' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
