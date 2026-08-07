import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

export default function VoiceRecorder({ onSend, onCancel, serverUrl }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => stopRecordingCleanup();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      
      // Stop track streams
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const stopRecordingCleanup = () => {
    clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `vocal_${Date.now()}.webm`);

      const res = await fetch(`${serverUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        onSend({
          type: 'audio',
          media_url: data.url,
          media_name: 'Message Vocal',
          media_size: audioBlob.size,
          duration: timer
        });
      }
    } catch (err) {
      console.error('Audio upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      backgroundColor: 'var(--bg-card)',
      padding: '0.5rem 1rem',
      borderRadius: '24px',
      border: '1px solid var(--border-color)',
      width: '100%',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#ef4444',
        fontWeight: 600,
        fontSize: '0.9rem'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          animation: 'pulseGlow 1s infinite'
        }} />
        <span>{formatTime(timer)}</span>
      </div>

      <div style={{ flex: 1 }}>
        {audioUrl && !isRecording && (
          <audio src={audioUrl} controls style={{ height: '32px', width: '100%' }} />
        )}
        {isRecording && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Enregistrement en cours...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isRecording ? (
          <button
            onClick={stopRecording}
            style={{
              backgroundColor: '#ef4444',
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
            <Square size={16} fill="#ffffff" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isUploading}
            style={{
              backgroundColor: 'var(--accent)',
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
            <Send size={18} />
          </button>
        )}

        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
