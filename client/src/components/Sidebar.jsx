import React, { useState } from 'react';
import { Search, Plus, QrCode, Settings, Volume2, Users, User } from 'lucide-react';

export default function Sidebar({
  currentUser,
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChatModal,
  onOpenQrModal,
  onOpenProfileModal,
  isHiddenMobile
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getChatIcon = (type) => {
    if (type === 'channel') return <Volume2 size={16} color="var(--accent)" />;
    if (type === 'group') return <Users size={16} color="var(--accent)" />;
    return <User size={16} color="var(--accent)" />;
  };

  return (
    <aside className={`sidebar ${isHiddenMobile ? 'hidden-mobile' : ''}`} style={{
      width: '320px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header User Bar with iOS Safe Area Top padding */}
      <div style={{
        padding: '0.85rem 1.25rem',
        paddingTop: 'calc(0.85rem + env(safe-area-inset-top, 0px))',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-sidebar)'
      }}>
        <div
          onClick={onOpenProfileModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=User'}
              alt="Avatar"
              style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-card)' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-online)',
              border: '2px solid var(--bg-sidebar)'
            }} />
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {currentUser?.display_name || 'Utilisateur'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              @{currentUser?.username}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={onOpenQrModal}
            title="Connexion Mobile QR Code"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <QrCode size={20} />
          </button>
          <button
            onClick={onOpenProfileModal}
            title="Paramètres"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--bg-input)',
          padding: '0.6rem 0.85rem',
          borderRadius: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '16px',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
        {filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 1rem' }}>
            Aucune conversation trouvée.
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '14px',
                  backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                  cursor: 'pointer',
                  margin: '2px 0',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={chat.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + chat.name}
                    alt={chat.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-card)' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'var(--bg-sidebar)',
                    borderRadius: '50%',
                    padding: '2px'
                  }}>
                    {getChatIcon(chat.type)}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: isActive ? '#ffffff' : 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {chat.name}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                      {formatTime(chat.last_message_at)}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.82rem',
                    color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {chat.last_message || chat.description || 'Discussion créée'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={onOpenNewChatModal}
          style={{
            width: '100%',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '0.8rem',
            fontWeight: 600,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px var(--accent-glow)'
          }}
        >
          <Plus size={20} /> Nouvelle Discussion
        </button>
      </div>
    </aside>
  );
}
