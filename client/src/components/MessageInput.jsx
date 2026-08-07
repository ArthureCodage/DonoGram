import React, { useState, useRef } from 'react';
import { Paperclip, Mic, Send, Smile, Image as ImageIcon, X } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

export default function MessageInput({ onSendMessage, onSendFile, onTypingStart, onTypingStop, serverUrl }) {
  const [text, setText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const emojis = ['👍', '❤️', '🔥', '😂', '🎉', '🚀', '💡', '👏', '😍', '👀', '💯', '✨'];

  const handleFocus = () => {
    // Scroll input into view smoothly on iOS when keyboard appears
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 150);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const token = localStorage.getItem('donogram_token');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${serverUrl}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setAttachment({
          url: data.url,
          name: data.filename,
          size: data.size,
          mimetype: data.mimetype,
          type: data.mimetype.startsWith('image/') ? 'image' : 'file'
        });
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !attachment) return;

    if (attachment) {
      onSendFile({
        text: text.trim(),
        type: attachment.type,
        media_url: attachment.url,
        media_name: attachment.name,
        media_size: attachment.size
      });
      setAttachment(null);
    } else {
      onSendMessage(text.trim());
    }

    setText('');
    onTypingStop();
  };

  return (
    <div className="message-input-container" style={{
      padding: '0.75rem 1rem',
      backgroundColor: 'var(--bg-chat-header)',
      borderTop: '1px solid var(--border-color)',
      position: 'relative'
    }}>
      {/* Quick Emoji Bar */}
      {showEmojiBar && (
        <div className="animate-pop" style={{
          position: 'absolute',
          bottom: '75px',
          left: '15px',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '0.6rem 0.85rem',
          display: 'flex',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 30
        }}>
          {emojis.map(e => (
            <span
              key={e}
              onClick={() => {
                setText(prev => prev + e);
                setShowEmojiBar(false);
              }}
              style={{
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachment && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)',
          padding: '0.5rem 0.85rem',
          borderRadius: '12px',
          marginBottom: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <ImageIcon size={18} color="var(--accent)" />
            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showVoiceRecorder ? (
        <VoiceRecorder
          serverUrl={serverUrl}
          onSend={(voiceData) => {
            onSendFile(voiceData);
            setShowVoiceRecorder(false);
          }}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            title="Joindre un fichier"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <Paperclip size={22} />
          </button>

          <div style={{
            flex: 1,
            backgroundColor: 'var(--bg-input)',
            borderRadius: '22px',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <textarea
              placeholder="Écrivez un message..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              rows={1}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '16px',
                resize: 'none',
                fontFamily: 'inherit',
                maxHeight: '120px',
                WebkitUserSelect: 'text',
                userSelect: 'text'
              }}
            />

            <button
              type="button"
              onClick={() => setShowEmojiBar(!showEmojiBar)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <Smile size={20} />
            </button>
          </div>

          {text.trim() || attachment ? (
            <button
              type="submit"
              disabled={isUploading}
              style={{
                backgroundColor: 'var(--accent)',
                border: 'none',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 10px var(--accent-glow)'
              }}
            >
              <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <Mic size={22} />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
