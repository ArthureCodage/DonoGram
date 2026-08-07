import React from 'react';
import { X, Send, Share2 } from 'lucide-react';

export default function ForwardModal({ message, chats, onClose, onForward }) {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '1rem'
    }}>
      <div className="animate-pop" style={{
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        padding: '1.5rem',
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
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Share2 size={20} color="var(--accent)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Transférer le message</h3>
        </div>

        {/* Message snippet preview */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          borderLeft: '3px solid var(--accent)',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '2px' }}>{message.sender_name}</div>
          <div style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {message.text || message.media_name || 'Pièce jointe'}
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Choisir le destinataire :
        </p>

        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => onForward(c.id, message)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-card)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={c.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${c.name}`} alt={c.name} style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
              </div>
              <Send size={16} color="var(--accent)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
