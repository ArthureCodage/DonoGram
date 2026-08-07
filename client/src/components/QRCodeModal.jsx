import React from 'react';
import { X, Smartphone, Wifi, Copy, Check } from 'lucide-react';

export default function QRCodeModal({ networkInfo, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!networkInfo) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(networkInfo.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 90,
      padding: '1rem'
    }}>
      <div className="animate-pop" style={{
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            backgroundColor: 'rgba(82, 136, 193, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            <Smartphone size={24} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Connexion Mobile</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Scannez ce QR Code avec l'appareil photo de votre smartphone
          </p>
        </div>

        {/* QR Code Container */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 1.25rem auto',
          width: 'fit-content',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          <img
            src={networkInfo.qrCode}
            alt="QR Code Connexion Mobile"
            style={{ width: '200px', height: '200px', display: 'block' }}
          />
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Wifi size={16} color="var(--status-online)" />
            <span style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontWeight: 600 }}>
              {networkInfo.url}
            </span>
          </div>
          <button
            onClick={copyUrl}
            style={{
              background: 'none',
              border: 'none',
              color: copied ? 'var(--status-online)' : 'var(--accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              fontSize: '0.8rem'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: '1.4' }}>
          💡 Assurez-vous que votre smartphone est connecté au <b>même Wi-Fi</b> que ce PC.
        </p>
      </div>
    </div>
  );
}
