import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, CheckCheck, Play, Pause, Download, Volume2, Bell, Pin, Search, Trash2, User, Image as ImageIcon, Share2 } from 'lucide-react';
import MessageInput from './MessageInput';
import CallModal from './CallModal';
import SharedMediaDrawer from './SharedMediaDrawer';
import confetti from 'canvas-confetti';

export default function ChatArea({
  chat,
  messages,
  currentUser,
  typingUser,
  onSendMessage,
  onSendFile,
  onTypingStart,
  onTypingStop,
  onToggleReaction,
  onBackMobile,
  onTriggerForward,
  serverUrl,
  token
}) {
  const messagesEndRef = useRef(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  // States
  const [activeCall, setActiveCall] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReactionClick = (messageId, emoji) => {
    onToggleReaction(messageId, emoji);
    if (emoji === '🔥' || emoji === '🎉') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
  };

  const toggleAudio = (audioUrl) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audioUrl);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingAudio(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pinnedMessage = messages.find((m) => m.is_pinned === 1) || (messages.length > 0 ? messages[0] : null);

  if (!chat) {
    return (
      <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-chat-body)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          backgroundColor: 'rgba(82, 136, 193, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <Volume2 size={44} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Sélectionnez une discussion
        </h2>
        <p style={{ fontSize: '0.9rem', maxWidth: '360px' }}>
          Choisissez un canal, un groupe ou un contact dans le menu pour commencer à échanger.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      <main className="chat-area" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-chat-body)',
        position: 'relative'
      }}>
        {/* Top Bar Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          paddingTop: 'calc(0.85rem + env(safe-area-inset-top, 0px))',
          backgroundColor: 'var(--bg-chat-header)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onBackMobile}
              title="Retour"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <ArrowLeft size={22} />
            </button>

            <img
              src={chat.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + chat.name}
              alt={chat.name}
              style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-card)' }}
            />

            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {chat.name} {isPinned && '📌'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
                {typingUser ? (
                  <span className="animate-fade-in" style={{ fontStyle: 'italic', fontWeight: 500 }}>
                    ✏️ {typingUser} est en train d'écrire...
                  </span>
                ) : (
                  chat.type === 'channel' ? 'Canal d\'annonces' : (chat.type === 'group' ? 'Groupe de discussion' : (chat.status === 'online' || !chat.status ? '🟢 En ligne' : 'Hors ligne'))
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveCall({ isVideo: false })}
              title="Appel audio HD"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Phone size={20} />
            </button>

            <button
              onClick={() => setActiveCall({ isVideo: true })}
              title="Appel vidéo HD"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Video size={20} />
            </button>

            <button
              onClick={() => setShowSharedMedia(!showSharedMedia)}
              title="Médias partagés"
              style={{
                background: 'none',
                border: 'none',
                color: showSharedMedia ? 'var(--accent)' : 'var(--text-main)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ImageIcon size={20} />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Menu Options"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: showMenu ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Dropdown Options Menu */}
          {showMenu && (
            <div className="animate-pop" style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: '12px',
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '0.5rem',
              width: '230px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <button
                onClick={() => { setIsMuted(!isMuted); setShowMenu(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Bell size={18} color="var(--accent)" />
                {isMuted ? 'Activer notifications' : 'Mettre en sourdine'}
              </button>

              <button
                onClick={() => { setIsPinned(!isPinned); setShowMenu(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Pin size={18} color="var(--accent)" />
                {isPinned ? 'Désépingler' : 'Épingler en haut'}
              </button>

              <button
                onClick={() => { setShowSharedMedia(true); setShowMenu(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <ImageIcon size={18} color="var(--accent)" />
                Galerie de médias
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

              <button
                onClick={() => { alert('Historique effacé'); setShowMenu(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Trash2 size={18} />
                Effacer le chat
              </button>
            </div>
          )}
        </div>

        {/* Telegram Pinned Message Banner */}
        {pinnedMessage && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.5rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              <Pin size={14} color="var(--accent)" />
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Message épinglé: </span>
                <span style={{ color: 'var(--text-muted)' }}>{pinnedMessage.text || pinnedMessage.media_name || 'Média'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages Scroll View */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                {!isMe && chat.type !== 'direct' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '3px', marginLeft: '8px' }}>
                    {msg.sender_name}
                  </span>
                )}

                <div style={{
                  maxWidth: '78%',
                  backgroundColor: isMe ? 'var(--bubble-out)' : 'var(--bubble-in)',
                  color: isMe ? 'var(--bubble-out-text)' : 'var(--bubble-in-text)',
                  padding: '0.7rem 0.95rem',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  wordBreak: 'break-word'
                }}>
                  {msg.type === 'image' && msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt="Attachement image"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '12px',
                        marginBottom: '0.5rem',
                        display: 'block',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(msg.media_url, '_blank')}
                    />
                  )}

                  {msg.type === 'audio' && msg.media_url && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.3rem',
                      minWidth: '200px'
                    }}>
                      <button
                        onClick={() => toggleAudio(msg.media_url)}
                        style={{
                          backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        {playingAudio === msg.media_url ? <Pause size={18} /> : <Play size={18} style={{ transform: 'translateX(1px)' }} />}
                      </button>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Message vocal</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Audio WebM</div>
                      </div>
                    </div>
                  )}

                  {msg.type === 'file' && msg.media_url && (
                    <a
                      href={msg.media_url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'inherit',
                        textDecoration: 'none',
                        marginBottom: '0.4rem',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        padding: '0.5rem',
                        borderRadius: '8px'
                      }}
                    >
                      <Download size={18} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{msg.media_name || 'Télécharger le fichier'}</span>
                    </a>
                  )}

                  {msg.text && (
                    <div style={{ fontSize: '0.92rem', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                  )}

                  {/* Message Reactions & Actions Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.35rem',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {['❤️', '👍', '🔥', '😂'].map(emoji => {
                        const count = (msg.reactions || []).filter(r => r.emoji === emoji).length;
                        return (
                          <span
                            key={emoji}
                            onClick={() => handleReactionClick(msg.id, emoji)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              backgroundColor: count > 0 ? 'rgba(255,255,255,0.2)' : 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            {emoji} {count > 0 && count}
                          </span>
                        );
                      })}
                    </div>

                    <div style={{
                      fontSize: '0.7rem',
                      opacity: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginLeft: 'auto'
                    }}>
                      <button
                        onClick={() => onTriggerForward(msg)}
                        title="Transférer ce message"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          opacity: 0.7,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                      >
                        <Share2 size={13} />
                      </button>
                      <span>{formatTime(msg.created_at)}</span>
                      {isMe && <CheckCheck size={14} color="#60a5fa" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <MessageInput
          serverUrl={serverUrl}
          onSendMessage={onSendMessage}
          onSendFile={onSendFile}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
        />

        {/* Active Voice/Video Call Modal */}
        {activeCall && (
          <CallModal
            targetName={chat.name}
            targetAvatar={chat.avatar_url}
            isVideoCall={activeCall.isVideo}
            onClose={() => setActiveCall(null)}
          />
        )}
      </main>

      {/* Shared Media Gallery Drawer */}
      {showSharedMedia && (
        <SharedMediaDrawer
          chatId={chat.id}
          token={token}
          serverUrl={serverUrl}
          onClose={() => setShowSharedMedia(false)}
        />
      )}
    </div>
  );
}
