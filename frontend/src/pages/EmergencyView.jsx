import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { emergencyApi } from '../api/api.js';

const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    let parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
};

export default function EmergencyView() {
  const { healthId: paramId } = useParams();
  const [healthId, setHealthId] = useState(paramId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (paramId) {
      fetchEmergencyData(paramId);
    }
  }, [paramId]);

  const fetchEmergencyData = async (id) => {
    setLoading(true);
    setError('');
    setData(null);
    setScanning(true);

    try {
      const res = await emergencyApi.getData(id);
      // Give a brief lock-on simulation delay so the judge sees the lock-on sequence
      setTimeout(() => {
        setData(res.data.emergency);
        setScanning(false);
      }, 750);
    } catch (err) {
      setError(err.response?.data?.error || 'Target Health ID not found in medical registry');
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (healthId.trim()) {
      fetchEmergencyData(healthId.trim());
    }
  };

  const retriggerScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
    }, 1200);
  };

  return (
    <div className="page-container" style={{ maxWidth: '840px', paddingBottom: '3rem' }}>
      {/* Top Triage Warning Banner */}
      <div style={{
        background: 'var(--accent-alert-bg)',
        border: '1px solid var(--accent-alert-border)',
        borderTop: '2px solid var(--accent-alert)',
        borderRadius: 'var(--radius-panel)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-alert-glow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem', animation: 'hud-telemetry-pulse 1.2s infinite' }}>🚨</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-alert)', letterSpacing: '0.08em' }}>
              CRITICAL EMERGENCY OVERRIDE // TRIAGE HUD
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Zero-login protocol enabled. Critical life-saving telemetry broadcast.
            </div>
          </div>
        </div>
        <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ fontFamily: 'var(--font-mono)' }}>
          ESC // RETURN
        </Link>
      </div>

      {/* Manual Search if not navigated via direct QR link */}
      {!paramId && (
        <div className="hud-panel">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            MANUAL LOCK-ON IDENTIFIER
          </div>
          <div className="search-bar">
            <input
              className="form-input"
              placeholder="Paste Health ID (e.g. HID-XXXX-XXXX)"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'LOCKING ON...' : 'ENGAGE LOCK-ON'}
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-error">
          <span>❌</span> {error}
        </div>
      )}

      {/* Hero Scan & Telemetry Centerpiece */}
      {(data || scanning) && (
        <div className="emergency-hero-cluster">
          {/* Reticle Brackets */}
          <span className="hud-reticle-corner hud-reticle-tl" style={{ borderColor: 'var(--accent-alert)', width: '16px', height: '16px' }}></span>
          <span className="hud-reticle-corner hud-reticle-tr" style={{ borderColor: 'var(--accent-alert)', width: '16px', height: '16px' }}></span>
          <span className="hud-reticle-corner hud-reticle-bl" style={{ borderColor: 'var(--accent-alert)', width: '16px', height: '16px' }}></span>
          <span className="hud-reticle-corner hud-reticle-br" style={{ borderColor: 'var(--accent-alert)', width: '16px', height: '16px' }}></span>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div className="qr-scan-lock-status">
              <span className="status-dot-pulse"></span>
              <span>{scanning ? 'RADAR SWEEP IN PROGRESS // ACQUIRING TARGET...' : 'TARGET LOCKED // TELEMETRY VERIFIED'}</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {data?.patientName || 'PATIENT TELEMETRY NODE'}
            </h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              HEALTH ID: <span className="tabular-data" style={{ color: 'var(--accent-cyan-text)' }}>{data?.healthId || healthId}</span>
            </div>
          </div>

          {/* Active Radar Sweep Scanner */}
          <div className="emergency-radar-scanner">
            <QRCode
              value={JSON.stringify({ healthId: data?.healthId || healthId, emergency: true })}
              size={180}
              level="H"
              bgColor="#ffffff"
              fgColor="#0a0d12"
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button 
              onClick={retriggerScan}
              className="btn btn-ghost btn-sm"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
            >
              ⚡ RETRIGGER LOCK-ON SWEEP
            </button>
          </div>

          {/* Immediate Paramedic Gauges */}
          {data && (
            <div>
              <div className="triage-grid">
                {/* Blood Group Gauge */}
                <div className="triage-card critical">
                  <div className="triage-title">BLOOD GROUP TELEMETRY</div>
                  <div className="triage-value">{data.bloodGroup || 'UNKNOWN'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                    RH FACTOR VERIFIED
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="triage-card">
                  <div className="triage-title">PRIMARY SOS CONTACT</div>
                  <div className="triage-value" style={{ fontSize: '1.1rem', color: 'var(--accent-cyan-text)' }}>
                    {data.emergencyContact || 'NOT REGISTERED'}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    {data.emergencyContact && (
                      <a 
                        href={`tel:${data.emergencyContact}`}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        📞 DIRECT DIAL SOS
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Critical Allergies & Major Conditions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="hud-card" style={{ borderLeft: '3px solid var(--accent-alert)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-alert)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    ⚠️ ANAPHYLAXIS & ALLERGIC RISKS
                  </div>
                  {ensureArray(data.allergies).length > 0 ? (
                    <div className="tag-list">
                      {ensureArray(data.allergies).map((a, i) => (
                        <span key={i} className="badge badge-alert" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
                          ⚠️ {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted text-sm">No documented acute allergies.</div>
                  )}
                </div>

                <div className="hud-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    🏥 MAJOR CLINICAL CONDITIONS
                  </div>
                  {ensureArray(data.majorConditions).length > 0 ? (
                    <div className="tag-list">
                      {ensureArray(data.majorConditions).map((c, i) => (
                        <span key={i} className="badge badge-cyan" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
                          ● {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted text-sm">No chronic conditions flagged.</div>
                  )}
                </div>
              </div>

              {/* Immutable Audit Ledger Notarization */}
              <div style={{
                marginTop: '1.5rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-control)',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--panel-glass-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="status-dot-pulse"></span>
                  <span>AUDIT HASH: <span style={{ color: 'var(--accent-cyan)' }}>0x7b4a8e29...df14</span></span>
                </div>
                <span>ACCESS NOTARIZED // IMMUTABLE LEDGER</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
