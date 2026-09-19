import { useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

export default function QRDisplay({ healthId }) {
  const [copied, setCopied] = useState(false);
  const emergencyUrl = `/emergency/${healthId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(healthId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="qr-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          SECURE DISPATCH QR
        </span>
        <span className="status-dot-pulse" title="Ready for Paramedic Lock-on"></span>
      </div>

      {/* Target Reticle Container */}
      <div className="hud-reticle-container" style={{ padding: '6px' }}>
        <span className="hud-reticle-corner hud-reticle-tl"></span>
        <span className="hud-reticle-corner hud-reticle-tr"></span>
        <span className="hud-reticle-corner hud-reticle-bl"></span>
        <span className="hud-reticle-corner hud-reticle-br"></span>

        <div className="emergency-radar-scanner">
          <QRCode
            value={JSON.stringify({ healthId, emergencyUrl })}
            size={180}
            level="H"
            bgColor="#ffffff"
            fgColor="#0a0d12"
          />
        </div>
      </div>

      {/* Monospace Health ID */}
      <div className="health-id-display">
        {healthId}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        <Link 
          to={emergencyUrl} 
          className="btn btn-danger btn-sm"
          style={{ width: '100%' }}
        >
          🚨 Simulate Emergency Triage Lock-on
        </Link>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
          style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
        >
          {copied ? '✓ HASH COPIED' : '📋 COPY HEALTH ID'}
        </button>
      </div>
    </div>
  );
}
