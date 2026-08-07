import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AuthModal from './components/AuthModal';
import QRCodeModal from './components/QRCodeModal';
import NewChatModal from './components/NewChatModal';
import ProfileModal from './components/ProfileModal';
import MobileTabBar from './components/MobileTabBar';
import ContactsView from './components/ContactsView';
import ChannelsView from './components/ChannelsView';

const host = window.location.hostname || 'localhost';
const SERVER_URL = `http://${host}:4000`;

let socket;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('donogram_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('donogram_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('donogram_theme') || 'telegram');
  const [activeTab, setActiveTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('general');
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('donogram_theme', theme);
  }, [theme]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!token || !currentUser) return;

    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    socket.emit('user_connected', currentUser.id);

    socket.on('new_message', (newMsg) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    socket.on('user_typing', ({ conversation_id, username, isTyping }) => {
      if (conversation_id === activeChatId) {
        setTypingUser(isTyping ? username : null);
      }
    });

    socket.on('reactions_updated', ({ message_id, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message_id ? { ...msg, reactions } : msg))
      );
    });

    socket.on('chat_created', (newChat) => {
      setChats((prev) => [newChat, ...prev]);
    });

    socket.on('error_message', ({ error }) => {
      showToast(`⚠️ ${error}`);
    });

    fetchChats();
    fetchNetworkInfo();

    return () => {
      socket.disconnect();
    };
  }, [token, currentUser]);

  useEffect(() => {
    if (!socket || !activeChatId || !token) return;

    socket.emit('join_room', activeChatId);
    fetchMessages(activeChatId);

    return () => {
      socket.emit('leave_room', activeChatId);
    };
  }, [activeChatId, token]);

  const fetchChats = async () => {
    if (!currentUser || !token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/chats/user/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChats(data.chats);
        if (data.chats.length > 0 && !activeChatId) {
          setActiveChatId(data.chats[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch chats failed:', err);
    }
  };

  const fetchMessages = async (chatId) => {
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Fetch messages failed:', err);
    }
  };

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/network-info`);
      const data = await res.json();
      if (res.ok) setNetworkInfo(data);
    } catch (err) {
      console.error('Network info fetch error:', err);
    }
  };

  const handleLogin = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('donogram_user', JSON.stringify(user));
    localStorage.setItem('donogram_token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('donogram_user');
    localStorage.removeItem('donogram_token');
    setShowProfileModal(false);
  };

  const handleStartDirectChat = async (targetUserId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/chats/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'direct', target_user_id: targetUserId })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchChats();
        setActiveChatId(data.chat.id);
        setActiveTab('chats');
        setIsMobileChatOpen(true);
      }
    } catch (err) {
      console.error('Start DM chat error:', err);
    }
  };

  const handleSendMessage = (text) => {
    if (!socket || !currentUser || !activeChatId) return;
    socket.emit('send_message', {
      conversation_id: activeChatId,
      sender_id: currentUser.id,
      text,
      type: 'text'
    });
  };

  const handleSendFile = (fileData) => {
    if (!socket || !currentUser || !activeChatId) return;
    socket.emit('send_message', {
      conversation_id: activeChatId,
      sender_id: currentUser.id,
      ...fileData
    });
  };

  const handleTypingStart = () => {
    if (socket && currentUser && activeChatId) {
      socket.emit('typing_start', {
        conversation_id: activeChatId,
        username: currentUser.display_name,
        userId: currentUser.id
      });
    }
  };

  const handleTypingStop = () => {
    if (socket && currentUser && activeChatId) {
      socket.emit('typing_stop', {
        conversation_id: activeChatId,
        userId: currentUser.id
      });
    }
  };

  const handleToggleReaction = (message_id, emoji) => {
    if (socket && currentUser && activeChatId) {
      socket.emit('toggle_reaction', {
        message_id,
        conversation_id: activeChatId,
        user_id: currentUser.id,
        emoji
      });
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="app-container">
      {/* Toast alert */}
      {toastMessage && (
        <div className="animate-pop" style={{
          position: 'fixed',
          top: 'calc(20px + env(safe-area-inset-top))',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '20px',
          fontWeight: 500,
          fontSize: '0.9rem',
          zIndex: 200,
          boxShadow: 'var(--shadow-lg)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Login Auth Modal */}
      {(!currentUser || !token) && (
        <AuthModal onLogin={handleLogin} serverUrl={SERVER_URL} />
      )}

      {/* Dynamic Content Views */}
      {activeTab === 'contacts' ? (
        <ContactsView
          currentUser={currentUser}
          token={token}
          serverUrl={SERVER_URL}
          onStartChat={handleStartDirectChat}
        />
      ) : activeTab === 'channels' ? (
        <ChannelsView
          currentUser={currentUser}
          token={token}
          serverUrl={SERVER_URL}
          onJoinChannel={async (channelId) => {
            await fetchChats();
            setActiveChatId(channelId);
            setActiveTab('chats');
            setIsMobileChatOpen(true);
          }}
          onCreateChannelClick={() => setShowNewChatModal(true)}
        />
      ) : (
        <>
          {/* Main Sidebar */}
          <Sidebar
            currentUser={currentUser}
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              setIsMobileChatOpen(true);
            }}
            onOpenNewChatModal={() => setShowNewChatModal(true)}
            onOpenQrModal={() => setShowQrModal(true)}
            onOpenProfileModal={() => setShowProfileModal(true)}
            isHiddenMobile={isMobileChatOpen}
          />

          {/* Chat Conversation Area */}
          <ChatArea
            chat={activeChat}
            messages={messages}
            currentUser={currentUser}
            typingUser={typingUser}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onToggleReaction={handleToggleReaction}
            onBackMobile={() => setIsMobileChatOpen(false)}
            serverUrl={SERVER_URL}
          />
        </>
      )}

      {/* Mobile Bottom Navigation Tab Bar (Only visible when NOT inside an active mobile chat) */}
      {currentUser && token && !isMobileChatOpen && (
        <MobileTabBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileChatOpen(false);
          }}
          onOpenSettings={() => setShowProfileModal(true)}
        />
      )}

      {/* Modals */}
      {showQrModal && (
        <QRCodeModal
          networkInfo={networkInfo}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          currentUser={currentUser}
          serverUrl={SERVER_URL}
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(newChat) => {
            fetchChats();
            setActiveChatId(newChat.id);
            setActiveTab('chats');
            setIsMobileChatOpen(true);
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          currentUser={currentUser}
          serverUrl={SERVER_URL}
          currentTheme={theme}
          setTheme={setTheme}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('donogram_user', JSON.stringify(updated));
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
