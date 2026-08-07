import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, FileText, Mic, ExternalLink } from 'lucide-react';

export default function SharedMediaDrawer({ chatId, token, serverUrl, onClose }) {
  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'file' | 'audio'
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, [chatId]);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/chats/${chatId}/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMediaList(data.media);
    } catch (err) {
      console.error('Fetch media error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = mediaList.filter((m) => m.type === activeTab);

  return (
    <div className="animate-fade-in" style={{
      width: '320px',
      backgroundColor: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      zIndex: 15
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        paddingTop: 'calc(0.85rem + env(safe-area-inset-top, 0px))',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Médias Partagés</h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Media Type Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)'
      }}>
        <button
          onClick={() => setActiveTab('image')}
          style={{
            flex: 1,
            padding: '0.65rem',
            border: 'none',
            borderBottom: activeTab === 'image' ? '2px solid var(--accent)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'image' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <ImageIcon size={15} /> Photos
        </button>

        <button
          onClick={() => setActiveTab('file')}
          style={{
            flex: 1,
            padding: '0.65rem',
            border: 'none',
            borderBottom: activeTab === 'file' ? '2px solid var(--accent)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'file' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <FileText size={15} /> Fichiers
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          style={{
            flex: 1,
            padding: '0.65rem',
            border: 'none',
            borderBottom: activeTab === 'audio' ? '2px solid var(--accent)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'audio' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Mic size={15} /> Vocaux
        </button>
      </div>

      {/* Media List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chargement...</p>
        ) : filteredMedia.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>
            Aucun média partagé dans cette catégorie.
          </div>
        ) : activeTab === 'image' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {filteredMedia.map((m) => (
              <img
                key={m.id}
                src={m.media_url}
                alt="Partagé"
                style={{
                  width: '100%',
                  height: '110px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(m.media_url, '_blank')}
              />
            ))}
          </div>
        ) : (
          filteredMedia.map((m) => (
            <a
              key={m.id}
              href={m.media_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-card)',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                marginBottom: '0.5rem',
                textDecoration: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                {activeTab === 'file' ? <FileText size={18} color="var(--accent)" /> : <Mic size={18} color="var(--accent)" />}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.media_name || 'Fichier'}
                </span>
              </div>
              <ExternalLink size={14} color="var(--text-muted)" />
            </a>
          ))
        )}
      </div>
    </div>
  );
}
