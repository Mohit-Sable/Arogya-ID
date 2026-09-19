import { useState } from 'react';

const TYPE_LABELS = {
  prescription: '💊 PHARMACOLOGY (RX)',
  diagnosis: '🔬 DIAGNOSTIC EVALUATION',
  surgery: '🏥 SURGICAL PROCEDURE',
  vaccination: '💉 IMMUNIZATION',
  discharge_summary: '📋 DISCHARGE SUMMARY',
  document: '📄 DIAGNOSTIC ARTIFACT',
};

const TYPE_BADGES = {
  prescription: 'badge-cyan',
  diagnosis: 'badge-purple',
  surgery: 'badge-alert',
  vaccination: 'badge-success',
  discharge_summary: 'badge-warning',
  document: 'badge-cyan',
};

export default function RecordCard({ item, type, date }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTitle = () => {
    if (type === 'document') return item.fileName || 'Diagnostic Artifact';
    if (item.data?.condition) return item.data.condition;
    if (item.data?.procedure) return item.data.procedure;
    if (item.data?.vaccine) return item.data.vaccine;
    if (item.data?.medications?.[0]?.name) return `Rx: ${item.data.medications.map(m => m.name).join(', ')}`;
    if (item.data?.reason) return item.data.reason;
    return TYPE_LABELS[type] || 'Medical Telemetry';
  };

  const getDetail = () => {
    if (type === 'document') return `Format: ${item.type || 'Artifact'} • ${item.mimeType || ''}`;
    if (item.data?.notes) return item.data.notes;
    if (item.data?.outcome) return item.data.outcome;
    if (item.data?.conditionAtDischarge) return item.data.conditionAtDischarge;
    return '';
  };

  const renderExpandedData = () => {
    if (!item.data) return null;
    const data = item.data;

    return (
      <div className="timeline-detail-expanded">
        {Object.entries(data).map(([key, val]) => {
          if (val === null || val === undefined) return null;

          let displayVal;
          if (Array.isArray(val)) {
            displayVal = val.map((v, i) =>
              typeof v === 'object' ? (
                <div key={i} style={{ marginLeft: '0.5rem', marginBottom: '0.25rem' }}>
                  {Object.entries(v).map(([k, vv]) => (
                    <span key={k} style={{ marginRight: '0.75rem' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{k}:</strong> {String(vv)}
                    </span>
                  ))}
                </div>
              ) : <span key={i}>{String(v)}{i < val.length - 1 ? ', ' : ''}</span>
            );
          } else if (typeof val === 'object') {
            displayVal = JSON.stringify(val, null, 2);
          } else {
            displayVal = String(val);
          }

          return (
            <div className="detail-row" key={key}>
              <span className="detail-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</span>
              <span style={{ color: 'var(--text-primary)' }}>{displayVal}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="timeline-card" onClick={() => setExpanded(!expanded)}>
      <div className="timeline-meta">
        <span className={`badge ${TYPE_BADGES[type] || 'badge-cyan'}`}>
          {TYPE_LABELS[type] || type.toUpperCase()}
        </span>
        <span className="timeline-date tabular-data">[{formatDate(date)}]</span>
        {item.addedByName && (
          <span className="timeline-date">SIGNER: {item.addedByName}</span>
        )}
      </div>

      <div className="timeline-title">{getTitle()}</div>

      {getDetail() && (
        <div className="timeline-detail">
          {getDetail().length > 130 && !expanded
            ? getDetail().substring(0, 130) + '...'
            : getDetail()
          }
        </div>
      )}

      {expanded && item.data && renderExpandedData()}

      <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {expanded ? '▲ COLLAPSE TELEMETRY' : '▼ EXPAND DIAGNOSTIC DATA'}
      </div>
    </div>
  );
}
