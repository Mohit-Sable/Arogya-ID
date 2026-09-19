import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'patient', label: '🏥 Patient Citizen', desc: 'Personal telemetry & consent management' },
  { value: 'hospital', label: '🔬 Clinical Node / Hospital', desc: 'Diagnose & notarize encounters' },
  { value: 'insurer', label: '🏦 Actuarial Insurer', desc: 'Zero-knowledge claim verification' },
];

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
      } else {
        user = await register(form);
      }

      switch (user.role) {
        case 'patient': navigate('/dashboard'); break;
        case 'hospital': navigate('/hospital'); break;
        case 'insurer': navigate('/insurer'); break;
        default: navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const autofill = (email, password) => {
    setForm(prev => ({ ...prev, email, password }));
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container animate-in">
        <div className="login-hero">
          <div className="logo">⚡</div>
          <h1>HEALTHNET OS</h1>
          <p>Federated Digital Health Terminal // SHA-256 E2EE</p>
        </div>

        <div className="login-card">
          <span className="hud-reticle-corner hud-reticle-tl"></span>
          <span className="hud-reticle-corner hud-reticle-tr"></span>
          <span className="hud-reticle-corner hud-reticle-bl"></span>
          <span className="hud-reticle-corner hud-reticle-br"></span>

          {/* Toggle Login / Register */}
          <div className="login-toggle">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError(''); }}
            >
              AUTHENTICATE
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setError(''); }}
            >
              REGISTER IDENTITY
            </button>
          </div>

          {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Sharma"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Identity Credential (Email)</label>
              <input
                type="email"
                className="form-input"
                placeholder="citizen@network.org"
                value={form.email}
                onChange={handleChange('email')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Passphrase / Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange('password')}
                required
                minLength={6}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Access Role Protocol</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={handleChange('role')}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                  {ROLES.find(r => r.value === form.role)?.desc}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
              style={{ padding: '0.65rem', letterSpacing: '0.04em' }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
              ) : (
                mode === 'login' ? 'INITIALIZE TELEMETRY SESSION' : 'MINT HEALTH IDENTITY'
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="demo-credentials-box">
              <div style={{ textAlign: 'center', marginBottom: '0.35rem', letterSpacing: '0.06em' }}>
                QUICK ACCESS DEMO ROLES:
              </div>
              <div className="demo-btn-group">
                <button 
                  type="button" 
                  className="demo-pill" 
                  onClick={() => autofill('patient@demo.com', 'patient123')}
                >
                  👤 PATIENT
                </button>
                <button 
                  type="button" 
                  className="demo-pill" 
                  onClick={() => autofill('doctor@cityhospital.com', 'hospital123')}
                >
                  🔬 DOCTOR
                </button>
                <button 
                  type="button" 
                  className="demo-pill" 
                  onClick={() => autofill('insurer@starhealth.com', 'insurer123')}
                >
                  🏦 INSURER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
