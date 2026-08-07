import React, { useState, useEffect } from 'react';
import { Volume2, Plus, Users, Check, ArrowRight } from 'lucide-react';

export default function ChannelsView({ currentUser, token, serverUrl, onJoinChannel, onCreateChannelClick }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/channels/public`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setChannels(data.channels);
    } catch (err) {
      console.error('Fetch channels error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (channelId) => {
    try {
      const res = await fetch(`${serverUrl}/api/chats/${channelId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onJoinChannel(channelId);
      }
    } catch (err) {
      console.error('Join channel error:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{
      flex: 1,
      backgroundColor: 'var(--bg-app)',
      padding: '1.25rem',
      overflowY: 'auto',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Explorer les Canaux</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Découvrez et abonnez-vous aux fil d'annonces publics
          </p>
        </div>

        <button
          onClick={onCreateChannelClick}
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '0.65rem 1rem',
            borderRadius: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}
        >
          <Plus size={18} /> Créer un Canal
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement des canaux...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {channels.map((c) => (
            <div
              key={c.id}
              style={{
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-color)',
                borderRadius: '18px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <img
                    src={c.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${c.name}`}
                    alt={c.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-card)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{c.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {c.members_count || 1} abonnés
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                  {c.description || 'Aucune description disponible pour ce canal.'}
                </p>
              </div>

              <button
                onClick={() => handleJoin(c.id)}
                style={{
                  width: '100%',
                  backgroundColor: c.is_joined ? 'var(--bg-card)' : 'var(--accent)',
                  color: c.is_joined ? 'var(--text-main)' : '#ffffff',
                  border: c.is_joined ? '1px solid var(--border-color)' : 'none',
                  borderRadius: '12px',
                  padding: '0.65rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {c.is_joined ? (
                  <> <Check size={16} color="var(--status-online)" /> Déjà abonné </>
                ) : (
                  <> Rejoindre le canal <ArrowRight size={16} /> </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
