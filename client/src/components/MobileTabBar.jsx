import React from 'react';
import { MessageSquare, Users, Volume2, Settings } from 'lucide-react';

export default function MobileTabBar({ activeTab, onSelectTab, onOpenSettings }) {
  const tabs = [
    { id: 'chats', label: 'Discussions', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'channels', label: 'Canaux', icon: Volume2 },
    { id: 'settings', label: 'Réglages', icon: Settings }
  ];

  return (
    <nav className="mobile-tab-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      backgroundColor: 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 30,
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'settings') {
                onOpenSettings();
              } else {
                onSelectTab(tab.id);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              flex: 1,
              padding: '6px 0'
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
