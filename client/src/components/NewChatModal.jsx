import React, { useState, useEffect } from 'react';
import { X, Users, Volume2, MessageSquarePlus, UserCheck } from 'lucide-react';

export default function NewChatModal({ currentUser, serverUrl, onClose, onChatCreated }) {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'group' | 'channel'
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.filter(u => u.id !== currentUser.id));
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleCreateGroupOrChannel = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/chats/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          name: name.trim(),
          description: description.trim(),
          created_by: currentUser.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        onChatCreated(data.chat);
        onClose();
      }
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDirectChat = async (targetUserId) => {
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/chats/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          created_by: currentUser.id,
          target_user_id: targetUserId
        })
      });

      const data = await res.json();
      if (res.ok) {
        onChatCreated(data.chat);
        onClose();
      }
    } catch (err) {
      console.error('Direct chat error:', err);
    } finally {
      setLoading(false);
    }
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
        maxWidth: '440px',
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

        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Nouvelle Discussion
        </h2>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('direct')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'direct' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'direct' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={16} /> Privé
          </button>
          <button
            onClick={() => setActiveTab('group')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'group' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'group' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} /> Groupe
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'channel' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'channel' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Volume2 size={16} /> Canal
          </button>
        </div>

        {/* Content based on tab */}
        {activeTab === 'direct' ? (
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>
                Aucun autre utilisateur en ligne. Connectez un deuxième appareil !
              </p>
            ) : (
              users.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleStartDirectChat(u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <img src={u.avatar_url} alt={u.display_name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.display_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateGroupOrChannel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder={activeTab === 'group' ? "Nom du Groupe..." : "Nom du Canal..."}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />

            <textarea
              placeholder="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                outline: 'none',
                resize: 'none'
              }}
            />

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
                cursor: 'pointer'
              }}
            >
              {loading ? 'Création...' : `Créer le ${activeTab === 'group' ? 'Groupe' : 'Canal'}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
