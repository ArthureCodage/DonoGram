import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';

export default function CallModal({ targetName, targetAvatar, isVideoCall, onClose }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideoCall);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState('Appel en cours...'); // 'Appel en cours...' | 'Connecté'

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallState('00:00');
    }, 2000);

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, []);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(14, 22, 33, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 150,
      padding: '2.5rem 1.5rem',
      paddingTop: 'calc(2.5rem + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))'
    }}>
      {/* Top Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isVideoCall ? '📹 Appel Vidéo HD' : '📞 Appel Audio DonoGram'}
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff' }}>{targetName}</h2>
        <div style={{ fontSize: '0.95rem', color: 'var(--accent)', marginTop: '4px', fontWeight: 500 }}>
          {callDuration > 2 ? formatDuration(callDuration - 2) : callState}
        </div>
      </div>

      {/* Center Avatar & Visualizer */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pop" style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          border: '4px solid var(--accent)',
          boxShadow: '0 0 40px var(--accent-glow)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card)'
        }}>
          <img
            src={targetAvatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + targetName}
            alt={targetName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        padding: '0.85rem 1.75rem',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            backgroundColor: isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={onClose}
          style={{
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
          }}
        >
          <PhoneOff size={28} />
        </button>

        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          style={{
            backgroundColor: isVideoOff ? 'rgba(255,255,255,0.15)' : 'var(--accent)',
            border: 'none',
            borderRadius: '50%',
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>
      </div>
    </div>
  );
}
