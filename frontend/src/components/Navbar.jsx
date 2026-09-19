import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('healthnet_theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('healthnet_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <aside className="mac-sidebar">
      {/* Console Brand */}
      <Link to="/" className="sidebar-brand">
        <div className="logo-icon">
          ⚡
        </div>
        <div className="brand-title">
          <span className="brand-name">HEALTHNET OS</span>
          <span className="brand-badge">SECURE COMMAND</span>
        </div>
      </Link>

      {/* System Status Telemetry */}
      <div className="console-status-box">
        <div className="console-status-line">
          <span>LINK TELEMETRY</span>
          <span className="status-dot-pulse"></span>
        </div>
        <div className="console-status-line">
          <span>NODE: ASIA-SOUTH-1</span>
          <span style={{ color: 'var(--accent-cyan)' }}>ENCRYPTED</span>
        </div>
      </div>

      <div className="sidebar-section">NAVIGATION HUD</div>
      <nav className="sidebar-nav">
        {user?.role === 'patient' && (
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            <span className="nav-icon">📊</span>
            <span>Patient Telemetry</span>
          </Link>
        )}
        {user?.role === 'hospital' && (
          <Link to="/hospital" className={`nav-link ${isActive('/hospital')}`}>
            <span className="nav-icon">🔬</span>
            <span>Diagnostic Console</span>
          </Link>
        )}
        {user?.role === 'insurer' && (
          <Link to="/insurer" className={`nav-link ${isActive('/insurer')}`}>
            <span className="nav-icon">🏦</span>
            <span>Actuarial Portal</span>
          </Link>
        )}
        <Link to="/emergency-lookup" className={`nav-link ${isActive('/emergency-lookup')}`}>
          <span className="nav-icon">🚨</span>
          <span>Emergency Triage</span>
        </Link>
      </nav>

      {/* Theme Toggle Button */}
      <div style={{ padding: '0.5rem 0', marginBottom: '0.75rem' }}>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          style={{ width: '100%', justifyContent: 'center' }}
          title="Toggle Clinical Light / HUD Dark mode"
        >
          {theme === 'dark' ? '☀️ Switch to Clinical Light' : '🌙 Switch to HUD Dark'}
        </button>
      </div>

      {/* Operator Status */}
      <div className="sidebar-user">
        {user && (
          <>
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || 'Operator'}</span>
              <span className="user-role">{user.role || 'Access'}</span>
            </div>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleLogout} 
              title="Terminate Session" 
              style={{ padding: '0.25rem 0.5rem', marginLeft: 'auto', color: 'var(--text-muted)' }}
            >
              ⏻
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
