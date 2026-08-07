import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageCircle, UserCheck, Trash2 } from 'lucide-react';

export default function ContactsView({ currentUser, token, serverUrl, onStartChat }) {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/contacts/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setContacts(data.contacts);
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${serverUrl}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data.users);
    } catch (err) {
      console.error('Search users error:', err);
    }
  };

  const handleAddContact = async (contactUserId) => {
    try {
      const res = await fetch(`${serverUrl}/api/contacts/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contact_user_id: contactUserId })
      });
      if (res.ok) {
        fetchContacts();
        handleSearchUsers(searchQuery);
      }
    } catch (err) {
      console.error('Add contact error:', err);
    }
  };

  const handleRemoveContact = async (contactUserId) => {
    try {
      const res = await fetch(`${serverUrl}/api/contacts/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contact_user_id: contactUserId })
      });
      if (res.ok) fetchContacts();
    } catch (err) {
      console.error('Remove contact error:', err);
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
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
        Carnet de Contacts
      </h2>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: 'var(--bg-card)',
        padding: '0.75rem 1rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.25rem'
      }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Rechercher par @pseudo ou nom..."
          value={searchQuery}
          onChange={(e) => handleSearchUsers(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            width: '100%'
          }}
        />
      </div>

      {/* Search Results */}
      {isSearching && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Résultats de recherche
          </h3>
          {searchResults.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Aucun utilisateur trouvé.</p>
          ) : (
            searchResults.map((u) => {
              const isAlreadyContact = contacts.some((c) => c.id === u.id);
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-sidebar)',
                    padding: '0.75rem 1rem',
                    borderRadius: '14px',
                    marginBottom: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={u.avatar_url} alt={u.display_name} style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.display_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!isAlreadyContact ? (
                      <button
                        onClick={() => handleAddContact(u.id)}
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.5rem 0.85rem',
                          borderRadius: '10px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <UserPlus size={16} /> Ajouter
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--status-online)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={16} /> Dans vos contacts
                      </span>
                    )}

                    <button
                      onClick={() => onStartChat(u.id)}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageCircle size={16} /> Message
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Saved Contacts List */}
      <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Mes Contacts ({contacts.length})
      </h3>

      {contacts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '2rem',
          backgroundColor: 'var(--bg-sidebar)',
          borderRadius: '16px',
          border: '1px dashed var(--border-color)'
        }}>
          Vous n'avez pas encore de contacts enregistrés. Utilisez la barre de recherche ci-dessus pour ajouter des amis !
        </div>
      ) : (
        contacts.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-sidebar)',
              padding: '0.85rem 1rem',
              borderRadius: '16px',
              marginBottom: '0.6rem',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img src={c.avatar_url} alt={c.display_name} style={{ width: '46px', height: '46px', borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{c.display_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{c.username} • {c.status === 'online' ? '🟢 En ligne' : 'Hors ligne'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => onStartChat(c.id)}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MessageCircle size={16} /> Discuter
              </button>
              <button
                onClick={() => handleRemoveContact(c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
