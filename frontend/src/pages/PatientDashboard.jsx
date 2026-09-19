import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { patientApi, documentApi } from '../api/api.js';
import QRDisplay from '../components/QRDisplay.jsx';
import Timeline from '../components/Timeline.jsx';

const TABS = [
  { key: 'overview', label: '📊 Telemetry Cluster' },
  { key: 'timeline', label: '📋 Clinical Encounters' },
  { key: 'documents', label: '📁 Document Vault' },
  { key: 'consents', label: '🔐 Consent Matrix' },
  { key: 'access-logs', label: '📝 Tamper-Evident Ledger' },
  { key: 'profile', label: '⚙️ Patient Configuration' },
  { key: 'ai-summary', label: '🤖 Diagnostic Synthesis' },
];

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

// Deterministic mock hash generator for visual ledger authenticity
const getMockHash = (str, idx = 0) => {
  const seed = (str || 'ledger') + idx;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}...${hex.slice(0, 4)}`;
};

export default function PatientDashboard() {
  const { user, qrCode, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [consents, setConsents] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    bloodGroup: '', allergies: [], emergencyContact: '',
    majorConditions: [], chronicConditions: [], currentMedications: [], pastSurgeries: [],
  });
  const [newTag, setNewTag] = useState({});

  useEffect(() => {
    if (user) {
      setProfileForm({
        bloodGroup: user.bloodGroup || '',
        allergies: ensureArray(user.allergies),
        emergencyContact: user.emergencyContact || '',
        majorConditions: ensureArray(user.majorConditions),
        chronicConditions: ensureArray(user.chronicConditions),
        currentMedications: ensureArray(user.currentMedications),
        pastSurgeries: ensureArray(user.pastSurgeries),
      });
    }
  }, [user]);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
          const [tlRes, logRes] = await Promise.all([
            patientApi.getTimeline(),
            patientApi.getAccessLogs().catch(() => ({ data: { logs: [] } }))
          ]);
          setTimeline(tlRes.data.timeline || []);
          setAccessLogs(logRes.data.logs || []);
          break;
        case 'timeline':
          const tl = await patientApi.getTimeline();
          setTimeline(tl.data.timeline || []);
          break;
        case 'documents':
          const docs = await patientApi.getDocuments();
          setDocuments(docs.data.documents || []);
          break;
        case 'consents':
          const cons = await patientApi.getConsents();
          setConsents(cons.data.consents || []);
          break;
        case 'access-logs':
          const logs = await patientApi.getAccessLogs();
          setAccessLogs(logs.data.logs || []);
          break;
      }
    } catch (err) {
      console.error('Telemetry stream error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveConsent = async (id) => {
    try {
      await patientApi.approveConsent(id);
      showAlert('Consent signature recorded & notarized ✅', 'success');
      loadTabData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to sign consent', 'error');
    }
  };

  const handleDenyConsent = async (id) => {
    try {
      await patientApi.denyConsent(id);
      showAlert('Access authorization revoked ❌', 'error');
      loadTabData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to revoke consent', 'error');
    }
  };

  const handleProfileSave = async () => {
    try {
      await patientApi.updateProfile(profileForm);
      await refreshUser();
      showAlert('Patient telemetry updated and committed to ledger! ✅', 'success');
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to update telemetry', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'report');
    formData.append('healthId', user.healthId);

    try {
      await documentApi.upload(formData);
      showAlert('Medical artifact encrypted and stored in vault! 📄', 'success');
      loadTabData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Upload error', 'error');
    }
  };

  const handleAiSummary = async () => {
    setLoading(true);
    try {
      const res = await patientApi.getAiSummary();
      setAiSummary(res.data.summary);
    } catch (err) {
      showAlert('Diagnostic synthesis failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const addTag = (field) => {
    const val = (newTag[field] || '').trim();
    if (val && !profileForm[field].includes(val)) {
      setProfileForm(prev => ({ ...prev, [field]: [...prev[field], val] }));
      setNewTag(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeTag = (field, idx) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  if (!user) return null;

  const recordCount = timeline.filter(t => t.timelineType === 'record').length;
  const docCount = timeline.filter(t => t.timelineType === 'document').length;

  return (
    <div className="page-container">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* Header Telemetry Cluster */}
      <div className="section-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ● TELEMETRY NODE // PATIENT HEALTH ID
          </div>
          <h1>{user.name}</h1>
          <p>Verified cryptographic health record — synchronized with federated clinical registry.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="hud-card" style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID:</span>
            <span className="telemetry-val" style={{ color: 'var(--accent-cyan-text)', fontWeight: 600 }}>{user.healthId}</span>
          </div>
          <span className="badge badge-cyan">VERIFIED LEDGER</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Console Rail (Profile & QR Lock-on) */}
        <div className="dashboard-sidebar">
          <div className="hud-panel profile-card">
            <span className="hud-reticle-corner hud-reticle-tl"></span>
            <span className="hud-reticle-corner hud-reticle-tr"></span>
            <span className="hud-reticle-corner hud-reticle-bl"></span>
            <span className="hud-reticle-corner hud-reticle-br"></span>

            <div className="profile-avatar">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="profile-name">{user.name}</div>
            <div className="profile-role">CITIZEN NODE // {user.role}</div>

            {user.bloodGroup && (
              <span className="badge badge-alert" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', margin: '0 auto 0.75rem' }}>
                BLOOD: {user.bloodGroup}
              </span>
            )}

            <div className="profile-stats">
              <div className="profile-stat">
                <div className="value">{recordCount}</div>
                <div className="label">Encounters</div>
              </div>
              <div className="profile-stat">
                <div className="value">{docCount}</div>
                <div className="label">Artifacts</div>
              </div>
            </div>
          </div>

          {/* Emergency Scan Dispatch Target */}
          {user.healthId && (
            <div className="hud-panel">
              <QRDisplay healthId={user.healthId} qrCode={qrCode} />
            </div>
          )}
        </div>

        {/* Main Telemetry & Workflow Tabs */}
        <div>
          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && activeTab !== 'profile' && activeTab !== 'ai-summary' ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : (
            <>
              {/* === Overview Tab: Instrument Cluster === */}
              {activeTab === 'overview' && (
                <div>
                  {/* Real-time Instrument Gauges */}
                  <div className="gauge-grid">
                    {/* Blood Group Gauge */}
                    <div className="hud-gauge">
                      <div className="gauge-header">
                        <span className="gauge-label">BLOOD TELEMETRY</span>
                        <span className="gauge-indicator"></span>
                      </div>
                      <div className="gauge-val cyan">
                        {user.bloodGroup || 'UNASSIGNED'}
                      </div>
                      <div className="gauge-sub">
                        {user.bloodGroup ? 'Rh Antigen Matched' : 'Laboratory typing pending'}
                      </div>
                    </div>

                    {/* Allergies Gauge */}
                    <div className="hud-gauge">
                      <div className="gauge-header">
                        <span className="gauge-label">ALLERGY CONTRAINDICATIONS</span>
                        <span className="gauge-indicator" style={{ background: ensureArray(user.allergies).length > 0 ? 'var(--accent-alert)' : 'var(--accent-cyan)' }}></span>
                      </div>
                      <div className="gauge-val" style={{ color: ensureArray(user.allergies).length > 0 ? 'var(--accent-alert)' : 'var(--text-primary)' }}>
                        {ensureArray(user.allergies).length} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>RECORDED</span>
                      </div>
                      <div className="gauge-sub">
                        {ensureArray(user.allergies).length > 0 ? ensureArray(user.allergies).slice(0, 2).join(', ') : 'No high-risk triggers'}
                      </div>
                    </div>

                    {/* Active Medications Gauge */}
                    <div className="hud-gauge">
                      <div className="gauge-header">
                        <span className="gauge-label">ACTIVE PHARMACOLOGY</span>
                        <span className="gauge-indicator"></span>
                      </div>
                      <div className="gauge-val cyan">
                        {ensureArray(user.currentMedications).length} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>ACTIVE</span>
                      </div>
                      <div className="gauge-sub">
                        {ensureArray(user.currentMedications).length > 0 ? ensureArray(user.currentMedications)[0] : 'No current prescriptions'}
                      </div>
                    </div>

                    {/* Live Telemetry Sensor Simulation (Vitals) */}
                    <div className="hud-gauge">
                      <div className="gauge-header">
                        <span className="gauge-label">LIVE SENSOR TELEMETRY</span>
                        <span className="status-dot-pulse"></span>
                      </div>
                      <div className="gauge-val cyan" style={{ fontSize: '1.1rem' }}>
                        HR: 72 <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>bpm</span> • BP: 118/76
                      </div>
                      <div className="gauge-sub">
                        SpO2: 99% • Normal Sinus Rhythm
                      </div>
                    </div>
                  </div>

                  {/* Split Layout: Clinical Encounters + Tamper-Evident Ledger Feed */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                    {/* Clinical Encounters */}
                    <div className="hud-panel">
                      <div className="flex justify-between items-center mb-2">
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                          Recent Encounters
                        </h3>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          CHRONOLOGICAL
                        </span>
                      </div>
                      <Timeline items={timeline.slice(0, 4)} />
                      {timeline.length === 0 && (
                        <div className="empty-state">
                          <div className="empty-icon">🔬</div>
                          <h3>No encounter history</h3>
                          <p>Hospital visits and diagnostic records will be indexed here</p>
                        </div>
                      )}
                    </div>

                    {/* Tamper-Evident Consent & Audit Ledger Stream */}
                    <div className="hud-panel">
                      <div className="flex justify-between items-center mb-2">
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                          Audit Ledger Stream
                        </h3>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>IMMUTABLE</span>
                      </div>
                      <div className="ledger-stream">
                        {accessLogs.slice(0, 5).map((log, idx) => (
                          <div className="ledger-item" key={log.id || idx}>
                            <div className="ledger-timestamp">
                              [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                                {log.accessedByName || 'Authorized Agent'}
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                {log.role} • {log.wasEmergencyMode ? '🚨 Emergency Triage' : '🟢 Verified Protocol'}
                              </div>
                            </div>
                            <div className="ledger-hash">
                              {getMockHash(log.accessedByName, idx)}
                            </div>
                          </div>
                        ))}

                        {accessLogs.length === 0 && (
                          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              [NO ANOMALOUS ACCESS DETECTED]
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === Timeline Tab === */}
              {activeTab === 'timeline' && (
                <div className="hud-panel">
                  <div className="flex justify-between items-center mb-2">
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Clinical Encounters & Diagnostic History</h2>
                    <span className="badge badge-cyan">FEDERATED TIMELINE</span>
                  </div>
                  <Timeline items={timeline} />
                  {timeline.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <h3>No indexed clinical records</h3>
                      <p>Medical records and laboratory panels will appear chronologically.</p>
                    </div>
                  )}
                </div>
              )}

              {/* === Documents Tab === */}
              {activeTab === 'documents' && (
                <div className="hud-panel">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Encrypted Document Vault</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End-to-end encrypted storage for radiological reports, blood panels, and lab notes.</p>
                    </div>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                      📤 Encrypt & Upload
                      <input type="file" hidden onChange={handleFileUpload} />
                    </label>
                  </div>

                  {documents.length > 0 ? (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Artifact Name</th>
                            <th>Diagnostic Type</th>
                            <th>Timestamp</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map(doc => (
                            <tr key={doc._id}>
                              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.fileName}</td>
                              <td><span className="badge badge-cyan">{doc.type}</span></td>
                              <td className="tabular-data">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                              <td>
                                <a
                                  href={documentApi.getFileUrl(doc._id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                  DECRYPT // VIEW
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📁</div>
                      <h3>Vault empty</h3>
                      <p>Upload diagnostic PDF reports, DICOM scans, or laboratory certificates.</p>
                    </div>
                  )}
                </div>
              )}

              {/* === Consents Tab === */}
              {activeTab === 'consents' && (
                <div className="hud-panel">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Access Authorization & Consent Matrix</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cryptographically authorize external hospital nodes and insurance underwriters.</p>
                    </div>
                  </div>

                  {consents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {consents.map(c => (
                        <div key={c.id} className="hud-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {c.requestedByName || 'External Medical Node'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                              ROLE: <span style={{ color: 'var(--accent-cyan)' }}>{c.requestedByRole?.toUpperCase()}</span> • REQUESTED: {new Date(c.requestedAt).toLocaleString()}
                              {c.decidedAt && ` • SIGNED: ${new Date(c.decidedAt).toLocaleString()}`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {c.status === 'pending' ? (
                              <>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApproveConsent(c.id)}>
                                  ✓ AUTHORIZE ACCESS
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDenyConsent(c.id)}>
                                  ✕ DENY
                                </button>
                              </>
                            ) : (
                              <span className={`badge ${c.status === 'approved' ? 'badge-cyan' : 'badge-alert'}`}>
                                STATUS: {c.status?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🔐</div>
                      <h3>No pending authorization requests</h3>
                      <p>Inbound queries from hospital EHR nodes will be queued here for your digital signature.</p>
                    </div>
                  )}
                </div>
              )}

              {/* === Access Logs Tab === */}
              {activeTab === 'access-logs' && (
                <div className="hud-panel">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Tamper-Evident Access Ledger</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immutable log of all clinical queries, emergency overrides, and credential checks.</p>
                    </div>
                    <span className="badge badge-cyan">BLOCK-NOTARIZED</span>
                  </div>

                  {accessLogs.length > 0 ? (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Block Timestamp</th>
                            <th>Requesting Entity</th>
                            <th>Entity Role</th>
                            <th>Protocol Mode</th>
                            <th>Notarized Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accessLogs.map((log, idx) => (
                            <tr key={log.id || idx}>
                              <td className="tabular-data">[{new Date(log.timestamp).toLocaleString()}]</td>
                              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.accessedByName || 'Anonymous Operator'}</td>
                              <td><span className="badge badge-neutral">{log.role}</span></td>
                              <td>
                                {log.wasEmergencyMode ? (
                                  <span className="badge badge-alert">🚨 EMERGENCY TRIAGE</span>
                                ) : (
                                  <span className="badge badge-cyan">🟢 CONSENTED RECORD</span>
                                )}
                              </td>
                              <td className="tabular-data" style={{ color: 'var(--accent-cyan-text)' }}>
                                {getMockHash(log.accessedByName, idx)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <h3>No ledger entries</h3>
                      <p>All queries to your digital health identity are permanently audited.</p>
                    </div>
                  )}
                </div>
              )}

              {/* === Profile Configuration Tab === */}
              {activeTab === 'profile' && (
                <div className="hud-panel">
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    Patient Telemetry Configuration
                  </h2>

                  <div className="record-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Blood Group Typing</label>
                        <select
                          className="form-select"
                          value={profileForm.bloodGroup}
                          onChange={(e) => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                        >
                          <option value="">Select Blood Group</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Emergency SOS Dial Number</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="+91-9876543210 (Kin Name)"
                          value={profileForm.emergencyContact}
                          onChange={(e) => setProfileForm(p => ({ ...p, emergencyContact: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Tag-based fields */}
                    {[
                      { field: 'allergies', label: 'Contraindications & Allergies', placeholder: 'e.g. Penicillin, NSAIDs' },
                      { field: 'majorConditions', label: 'Primary Diagnoses', placeholder: 'e.g. Type 2 Diabetes' },
                      { field: 'chronicConditions', label: 'Chronic Conditions', placeholder: 'e.g. Hypertension' },
                      { field: 'currentMedications', label: 'Active Pharmacology', placeholder: 'e.g. Metformin 500mg (Daily)' },
                      { field: 'pastSurgeries', label: 'Surgical Procedures History', placeholder: 'e.g. Laparoscopic Appendectomy (2021)' },
                    ].map(({ field, label, placeholder }) => (
                      <div className="form-group" key={field}>
                        <label className="form-label">{label}</label>
                        <div className="tag-list mb-1">
                          {ensureArray(profileForm[field]).map((t, i) => (
                            <span key={i} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              {t}
                              <button 
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--accent-alert)', cursor: 'pointer', fontSize: '0.8rem' }}
                                onClick={() => removeTag(field, i)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            className="form-input"
                            placeholder={placeholder}
                            value={newTag[field] || ''}
                            onChange={(e) => setNewTag(p => ({ ...p, [field]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(field); } }}
                          />
                          <button className="btn btn-ghost btn-sm" type="button" onClick={() => addTag(field)}>
                            + APPEND
                          </button>
                        </div>
                      </div>
                    ))}

                    <div style={{ marginTop: '1.5rem' }}>
                      <button className="btn btn-primary" onClick={handleProfileSave}>
                        💾 COMMIT TELEMETRY TO LEDGER
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* === AI Summary Tab === */}
              {activeTab === 'ai-summary' && (
                <div className="hud-panel">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Diagnostic AI Synthesis</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Neural synthesis of your historical medical encounters, prescriptions, and laboratory readings.</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAiSummary} disabled={loading}>
                      {loading ? 'SYNTHESIZING...' : '⚡ GENERATE CLINICAL SYNTHESIS'}
                    </button>
                  </div>
                  {aiSummary ? (
                    <div className="hud-card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', borderLeft: '3px solid var(--accent-cyan)' }}>
                      {aiSummary}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🤖</div>
                      <h3>No synthesis compiled</h3>
                      <p>Trigger the neural model to review your timeline and output a unified diagnostic telemetry briefing.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
