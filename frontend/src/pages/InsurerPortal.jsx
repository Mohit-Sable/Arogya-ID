import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { hospitalApi, consentApi } from '../api/api.js';
import Timeline from '../components/Timeline.jsx';

export default function InsurerPortal() {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [consentStatus, setConsentStatus] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const showNotice = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setPatient(null);
    setRecords([]);

    try {
      const res = await hospitalApi.getPatientInfo(searchId.trim());
      setPatient(res.data.patient);

      const consentRes = await consentApi.checkStatus(searchId.trim());
      setConsentStatus(consentRes.data.hasConsent ? 'approved' : null);

      if (consentRes.data.hasConsent) {
        const recRes = await hospitalApi.getPatientRecords(searchId.trim());
        setRecords(recRes.data.records || []);
      }
    } catch (err) {
      showNotice(err.response?.data?.error || 'Patient Health ID not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConsent = async () => {
    try {
      await consentApi.requestAccess(searchId.trim());
      showNotice('Actuarial audit request dispatched to patient node ✅', 'success');
      setConsentStatus('pending');
    } catch (err) {
      showNotice(err.response?.data?.error || 'Failed to dispatch audit request', 'error');
    }
  };

  return (
    <div className="page-container">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="section-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ● ACTUARIAL AUDIT TERMINAL // CLAIM VERIFICATION NODE
          </div>
          <h1>Insurer Verification Portal</h1>
          <p>Verify historical clinical telemetry and claim authenticity under cryptographically signed patient consent.</p>
        </div>
        <span className="badge badge-cyan">UNDERWRITER: {user?.name?.toUpperCase()}</span>
      </div>

      {/* Search Console */}
      <div className="hud-panel mb-2">
        <span className="hud-reticle-corner hud-reticle-tl"></span>
        <span className="hud-reticle-corner hud-reticle-tr"></span>
        <span className="hud-reticle-corner hud-reticle-bl"></span>
        <span className="hud-reticle-corner hud-reticle-br"></span>

        <h2 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          🔍 Patient Health ID Lookup
        </h2>
        <div className="search-bar">
          <input
            className="form-input"
            placeholder="Enter Patient Health ID (e.g. HID-XXXX-XXXX)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'AUDITING...' : 'VERIFY CLAIM'}
          </button>
        </div>
      </div>

      {patient && (
        <div>
          <div className="hud-panel mb-2">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {patient.name}
                </h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  POLICY ID / HEALTH ID: <span className="tabular-data" style={{ color: 'var(--accent-cyan-text)' }}>{patient.healthId}</span>
                </div>
              </div>
              <div>
                {consentStatus === 'approved' ? (
                  <span className="badge badge-cyan" style={{ padding: '0.45rem 0.85rem' }}>
                    ✅ CLAIM AUDIT AUTHORIZED
                  </span>
                ) : consentStatus === 'pending' ? (
                  <span className="badge badge-warning" style={{ padding: '0.45rem 0.85rem' }}>
                    ⏳ AUDIT CONSENT PENDING
                  </span>
                ) : (
                  <button className="btn btn-primary" onClick={handleRequestConsent}>
                    🔐 REQUEST VERIFICATION ACCESS
                  </button>
                )}
              </div>
            </div>
          </div>

          {consentStatus === 'approved' && (
            <div className="hud-panel">
              <div className="flex justify-between items-center mb-2">
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>📋 Verified Clinical History for Adjudication</h2>
                <span className="badge badge-cyan">BLOCK-VERIFIED</span>
              </div>
              {records.length > 0 ? (
                <Timeline items={records.map(r => ({ ...r, timelineType: 'record', date: r.createdAt }))} />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No historical encounters on ledger</h3>
                </div>
              )}
            </div>
          )}

          {!consentStatus && (
            <div className="alert alert-warning">
              ⚠️ Actuarial verification requires explicit patient consent. Request access above to inspect historical claims.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
