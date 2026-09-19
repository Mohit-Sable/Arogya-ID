import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { hospitalApi, consentApi } from '../api/api.js';
import Timeline from '../components/Timeline.jsx';

const RECORD_TYPES = [
  { value: 'diagnosis', label: '🔬 Diagnostic Evaluation' },
  { value: 'prescription', label: '💊 Pharmacology Order (Rx)' },
  { value: 'surgery', label: '🏥 Surgical Procedure' },
  { value: 'vaccination', label: '💉 Immunization Event' },
  { value: 'discharge_summary', label: '📋 Clinical Discharge Summary' },
];

export default function HospitalPortal() {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [consentStatus, setConsentStatus] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);

  // Add record form
  const [recordType, setRecordType] = useState('diagnosis');
  const [recordData, setRecordData] = useState({});

  const showNotice = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setPatient(null);
    setRecords([]);
    setConsentStatus(null);

    try {
      const res = await hospitalApi.getPatientInfo(searchId.trim());
      setPatient(res.data.patient);
      setConsentStatus(res.data.patient.hasConsent ? 'approved' : null);

      if (res.data.patient.hasConsent) {
        const recRes = await hospitalApi.getPatientRecords(searchId.trim());
        setRecords(recRes.data.records || []);
      }
    } catch (err) {
      showNotice(err.response?.data?.error || 'Target Health ID not found in registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConsent = async () => {
    try {
      await hospitalApi.requestConsent(searchId.trim());
      showNotice('Cryptographic consent request broadcast to patient ✅', 'success');
      setConsentStatus('pending');
    } catch (err) {
      showNotice(err.response?.data?.error || 'Failed to dispatch consent query', 'error');
    }
  };

  const handleAddRecord = async () => {
    try {
      let data = {};
      switch (recordType) {
        case 'diagnosis':
          data = {
            condition: recordData.condition || '',
            notes: recordData.notes || '',
            severity: recordData.severity || 'Moderate',
            icdCode: recordData.icdCode || '',
          };
          break;
        case 'prescription':
          data = {
            medications: [{
              name: recordData.medName || '',
              dosage: recordData.dosage || '',
              frequency: recordData.frequency || '',
              duration: recordData.duration || '',
            }],
            prescribedBy: user.name,
            notes: recordData.notes || '',
          };
          break;
        case 'surgery':
          data = {
            procedure: recordData.procedure || '',
            surgeon: recordData.surgeon || user.name,
            hospital: recordData.hospital || '',
            outcome: recordData.outcome || '',
          };
          break;
        case 'vaccination':
          data = {
            vaccine: recordData.vaccine || '',
            batchNumber: recordData.batchNumber || '',
            administeredAt: recordData.administeredAt || '',
          };
          break;
        case 'discharge_summary':
          data = {
            admissionDate: recordData.admissionDate || '',
            dischargeDate: recordData.dischargeDate || '',
            reason: recordData.reason || '',
            treatmentGiven: recordData.treatmentGiven || '',
            conditionAtDischarge: recordData.conditionAtDischarge || '',
            followUp: recordData.followUp || '',
          };
          break;
      }

      await hospitalApi.addRecord({
        healthId: searchId.trim(),
        type: recordType,
        data,
      });

      showNotice('Record notarized and committed to patient ledger! ✅', 'success');
      setRecordData({});
      setShowAddRecord(false);

      // Refresh records
      const recRes = await hospitalApi.getPatientRecords(searchId.trim());
      setRecords(recRes.data.records || []);
    } catch (err) {
      showNotice(err.response?.data?.error || 'Failed to notarize record', 'error');
    }
  };

  const renderRecordForm = () => {
    const change = (field) => (e) => setRecordData(p => ({ ...p, [field]: e.target.value }));

    switch (recordType) {
      case 'diagnosis':
        return (
          <>
            <div className="form-group">
              <label className="form-label">Clinical Condition / Finding</label>
              <input className="form-input" placeholder="e.g. Type 2 Diabetes Mellitus" value={recordData.condition || ''} onChange={change('condition')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Clinical Severity</label>
                <select className="form-select" value={recordData.severity || 'Moderate'} onChange={change('severity')}>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ICD-10 Telemetry Code</label>
                <input className="form-input" placeholder="e.g. E11.9" value={recordData.icdCode || ''} onChange={change('icdCode')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Clinical Notes & Differential Diagnosis</label>
              <textarea className="form-textarea" rows={3} placeholder="Observations, laboratory findings, diagnostic metrics..." value={recordData.notes || ''} onChange={change('notes')} />
            </div>
          </>
        );
      case 'prescription':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Pharmaceutical Agent</label>
                <input className="form-input" placeholder="e.g. Metformin Hydrochloride" value={recordData.medName || ''} onChange={change('medName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Dosage Specification</label>
                <input className="form-input" placeholder="e.g. 500mg" value={recordData.dosage || ''} onChange={change('dosage')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Administration Frequency</label>
                <input className="form-input" placeholder="e.g. 1x Daily at 08:00" value={recordData.frequency || ''} onChange={change('frequency')} />
              </div>
              <div className="form-group">
                <label className="form-label">Regimen Duration</label>
                <input className="form-input" placeholder="e.g. 30 Days" value={recordData.duration || ''} onChange={change('duration')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pharmacist Instructions</label>
              <textarea className="form-textarea" rows={2} placeholder="Take post-prandial..." value={recordData.notes || ''} onChange={change('notes')} />
            </div>
          </>
        );
      case 'surgery':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Surgical Procedure</label>
                <input className="form-input" placeholder="e.g. Laparoscopic Cholecystectomy" value={recordData.procedure || ''} onChange={change('procedure')} />
              </div>
              <div className="form-group">
                <label className="form-label">Lead Surgeon</label>
                <input className="form-input" placeholder={user.name} value={recordData.surgeon || ''} onChange={change('surgeon')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Operating Facility / Suite</label>
              <input className="form-input" placeholder="Hospital / OR Block" value={recordData.hospital || ''} onChange={change('hospital')} />
            </div>
            <div className="form-group">
              <label className="form-label">Intraoperative & Postoperative Outcome</label>
              <textarea className="form-textarea" rows={3} placeholder="Surgical notes and hemodynamic stability..." value={recordData.outcome || ''} onChange={change('outcome')} />
            </div>
          </>
        );
      case 'vaccination':
        return (
          <>
            <div className="form-group">
              <label className="form-label">Immunization Agent</label>
              <input className="form-input" placeholder="e.g. mRNA-1273 Booster" value={recordData.vaccine || ''} onChange={change('vaccine')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Batch / Lot Number</label>
                <input className="form-input" placeholder="e.g. LOT-8849-B" value={recordData.batchNumber || ''} onChange={change('batchNumber')} />
              </div>
              <div className="form-group">
                <label className="form-label">Administration Site</label>
                <input className="form-input" placeholder="e.g. Left Deltoid IM" value={recordData.administeredAt || ''} onChange={change('administeredAt')} />
              </div>
            </div>
          </>
        );
      case 'discharge_summary':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Admission Timestamp</label>
                <input className="form-input" type="date" value={recordData.admissionDate || ''} onChange={change('admissionDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Discharge Timestamp</label>
                <input className="form-input" type="date" value={recordData.dischargeDate || ''} onChange={change('dischargeDate')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Admitting Diagnosis</label>
              <input className="form-input" placeholder="Reason for clinical admission..." value={recordData.reason || ''} onChange={change('reason')} />
            </div>
            <div className="form-group">
              <label className="form-label">Clinical Interventions Administered</label>
              <textarea className="form-textarea" rows={2} placeholder="Course in hospital..." value={recordData.treatmentGiven || ''} onChange={change('treatmentGiven')} />
            </div>
            <div className="form-group">
              <label className="form-label">Discharge Hemodynamic Status</label>
              <input className="form-input" placeholder="Stable, ambulatory..." value={recordData.conditionAtDischarge || ''} onChange={change('conditionAtDischarge')} />
            </div>
            <div className="form-group">
              <label className="form-label">Post-Discharge Care Plan & Follow-up</label>
              <textarea className="form-textarea" rows={2} placeholder="Follow-up scheduled..." value={recordData.followUp || ''} onChange={change('followUp')} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="page-container">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="section-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ● DIAGNOSTIC CLINICAL CONSOLE // EHR NODE
          </div>
          <h1>Hospital & Doctor Terminal</h1>
          <p>Query federated patient telemetry, request cryptographic consent, and notarize clinical encounters.</p>
        </div>
        <span className="badge badge-cyan">NODE: {user?.name?.toUpperCase()}</span>
      </div>

      {/* Patient Search Console */}
      <div className="hud-panel mb-2">
        <span className="hud-reticle-corner hud-reticle-tl"></span>
        <span className="hud-reticle-corner hud-reticle-tr"></span>
        <span className="hud-reticle-corner hud-reticle-bl"></span>
        <span className="hud-reticle-corner hud-reticle-br"></span>

        <h2 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          🔍 Patient Telemetry Lookup
        </h2>
        <div className="search-bar">
          <input
            className="form-input"
            placeholder="Scan or enter Patient Health ID (e.g. HID-XXXX-XXXX)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'ACQUIRING...' : 'LOCK ON & QUERY'}
          </button>
        </div>
      </div>

      {/* Patient Record Cluster */}
      {patient && (
        <div>
          <div className="hud-panel mb-2">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {patient.name}
                </h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  HEALTH ID: <span className="tabular-data" style={{ color: 'var(--accent-cyan-text)' }}>{patient.healthId}</span>
                </div>
                {patient.bloodGroup && (
                  <span className="badge badge-alert" style={{ marginTop: '0.5rem' }}>
                    BLOOD: {patient.bloodGroup}
                  </span>
                )}
              </div>

              <div>
                {consentStatus === 'approved' ? (
                  <span className="badge badge-cyan" style={{ padding: '0.45rem 0.85rem' }}>
                    ✅ CONSENT NOTARIZED // ACTIVE
                  </span>
                ) : consentStatus === 'pending' ? (
                  <span className="badge badge-warning" style={{ padding: '0.45rem 0.85rem' }}>
                    ⏳ CONSENT QUERY PENDING
                  </span>
                ) : (
                  <button className="btn btn-primary" onClick={handleRequestConsent}>
                    🔐 DISPATCH CONSENT QUERY
                  </button>
                )}
              </div>
            </div>

            {patient.hasConsent && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                <div className="hud-card">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-alert)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    CONTRAINDICATIONS & ALLERGIES
                  </div>
                  <div className="tag-list">
                    {(patient.allergies || []).map((a, i) => (
                      <span key={i} className="badge badge-alert">{a}</span>
                    ))}
                    {(!patient.allergies || patient.allergies.length === 0) && <span className="text-muted text-sm">None recorded</span>}
                  </div>
                </div>
                <div className="hud-card">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    MAJOR CLINICAL DIAGNOSES
                  </div>
                  <div className="tag-list">
                    {(patient.majorConditions || []).map((c, i) => (
                      <span key={i} className="badge badge-cyan">{c}</span>
                    ))}
                    {(!patient.majorConditions || patient.majorConditions.length === 0) && <span className="text-muted text-sm">None recorded</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Record Section */}
          {consentStatus === 'approved' && (
            <>
              <div className="hud-panel mb-2">
                <div className="flex justify-between items-center mb-2">
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>➕ Notarize New Clinical Encounter</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddRecord(!showAddRecord)}>
                    {showAddRecord ? '✕ DISMISS' : '+ OPEN DISPATCH FORM'}
                  </button>
                </div>

                {showAddRecord && (
                  <div className="record-form">
                    <div className="form-group">
                      <label className="form-label">Encounter Category</label>
                      <select className="form-select" value={recordType} onChange={(e) => { setRecordType(e.target.value); setRecordData({}); }}>
                        {RECORD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {renderRecordForm()}

                    <button className="btn btn-primary" onClick={handleAddRecord} style={{ marginTop: '1rem' }}>
                      💾 SIGN & COMMIT TO LEDGER
                    </button>
                  </div>
                )}
              </div>

              {/* Records Timeline */}
              <div className="hud-panel">
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>
                  📋 Verified Clinical Encounters
                </h2>
                {records.length > 0 ? (
                  <Timeline items={records.map(r => ({ ...r, timelineType: 'record', date: r.createdAt }))} />
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No prior records found</h3>
                  </div>
                )}
              </div>
            </>
          )}

          {!consentStatus && (
            <div className="alert alert-warning">
              ⚠️ Diagnostic history is cryptographically locked. Dispatch a consent query to the patient node to gain read/write authority.
            </div>
          )}

          {consentStatus === 'pending' && (
            <div className="alert alert-warning">
              ⏳ Awaiting digital signature from patient node. Once authorized, clinical telemetry will automatically unlock.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
