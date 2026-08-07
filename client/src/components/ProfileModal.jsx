import React, { useState } from 'react';
import { X, User, Palette, Check, LogOut } from 'lucide-react';

export default function ProfileModal({ currentUser, serverUrl, currentTheme, setTheme, onClose, onUpdateUser, onLogout }) {
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarSeed, setAvatarSeed] = useState(currentUser?.username || 'User');
  const [loading, setLoading] = useState(false);

  const themes = [
    { id: 'telegram', name: 'Telegram Sombre', color: '#17212b' },
    { id: 'oled', name: 'OLED Noir Pur', color: '#000000' },
    { id: 'cyberpunk', name: 'Cyberpunk Néon', color: '#1f2833' },
    { id: 'light', name: 'Clair Moderne', color: '#ffffff' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('donogram_token');
    const newAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

    try {
      const res = await fetch(`${serverUrl}/api/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName,
          bio: bio,
          avatar_url: newAvatarUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        onUpdateUser(data.user);
        onClose();
      }
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 90,
      padding: '1rem',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div className="animate-pop" style={{
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
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
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Paramètres & Profil
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Avatar Preview */}
          <div style={{ textAlign: 'center' }}>
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`}
              alt="Avatar"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                padding: '4px',
                border: '2px solid var(--accent)',
                margin: '0 auto 0.4rem auto'
              }}
            />
            <button
              type="button"
              onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              🔄 Choisir un autre avatar
            </button>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Nom d'affichage
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Bio
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          {/* Theme Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Thème
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {themes.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '10px',
                    border: currentTheme === t.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color, border: '1px solid #777' }} />
                    {t.name}
                  </div>
                  {currentTheme === t.id && <Check size={14} color="var(--accent)" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
          >
            {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '0.25rem'
            }}
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
