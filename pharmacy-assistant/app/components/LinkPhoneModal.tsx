'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

type SessionStatus = 'idle' | 'generating' | 'waiting' | 'connected' | 'error';

interface MedResult {
  name: string;
  strength: string | null;
  frequency: string | null;
  timing: string | null;
  notes: string | null;
}

interface PhotoResult {
  type: 'prescription' | 'medicine';
  result: {
    medicines?: MedResult[];
    patientName?: string;
    doctorName?: string;
    date?: string;
    diagnosis?: string;
    usageInstructions?: string;
    allergyWarnings?: string;
    warnings?: string[];
    rawText?: string;
  };
  timestamp: string;
}

interface LinkPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkPhoneModal({ isOpen, onClose }: LinkPhoneModalProps) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [pairingCode, setPairingCode] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);
  const [results, setResults] = useState<PhotoResult[]>([]);
  const [error, setError] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Create a new pairing session
  const createSession = useCallback(async () => {
    setStatus('generating');
    setError('');
    setResults([]);
    setPhoneInfo(null);

    try {
      const res = await fetch('/api/link/create-session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');

      const data = await res.json();
      setPairingCode(data.pairingCode);
      setSessionId(data.sessionId);

      // Generate QR code URL
      const origin = window.location.origin;
      const linkUrl = `${origin}/link/camera?code=${data.pairingCode}`;
      setQrUrl(linkUrl);
      setStatus('waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setStatus('error');
    }
  }, []);

  // Connect to SSE when session is created
  useEffect(() => {
    if (!sessionId || status !== 'waiting' && status !== 'connected') return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/link/events?sessionId=${sessionId}`);
    eventSourceRef.current = es;

    es.addEventListener('phone-connected', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setStatus('connected');

      // Parse user agent into friendly name
      const ua = data.phoneUserAgent || 'Unknown device';
      const isIOS = /iPhone|iPad/.test(ua);
      const isAndroid = /Android/.test(ua);
      setPhoneInfo(isIOS ? '📱 iPhone connected' : isAndroid ? '📱 Android connected' : '📱 Phone connected');
    });

    es.addEventListener('photo-result', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setResults(prev => {
        const exists = prev.some(r => new Date(r.timestamp).getTime() === new Date(data.timestamp).getTime());
        if (exists) return prev;
        return [data, ...prev];
      });
    });

    es.addEventListener('session-expired', () => {
      setStatus('idle');
      es.close();
    });

    es.onerror = () => {
      // SSE will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-create session when modal opens
  useEffect(() => {
    if (isOpen && status === 'idle') {
      createSession();
    }
  }, [isOpen, status, createSession]);

  // Cleanup on close
  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('idle');
    setSessionId(null);
    setPairingCode('');
    setQrUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={s.backdrop} onClick={handleClose} />

      {/* Modal */}
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.headerIcon}>📱</span>
            <h2 style={s.headerTitle}>Link Your Phone</h2>
          </div>
          <button onClick={handleClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Content */}
        <div style={s.content}>
          {/* Error state */}
          {status === 'error' && (
            <div style={s.errorBox}>
              <p>{error}</p>
              <button onClick={createSession} style={s.retryBtn}>Try Again</button>
            </div>
          )}

          {/* Generating state */}
          {status === 'generating' && (
            <div style={s.centerBox}>
              <div style={s.spinner} />
              <p style={s.subtext}>Generating pairing code...</p>
            </div>
          )}

          {/* Waiting / Connected state */}
          {(status === 'waiting' || status === 'connected') && (
            <>
              {/* QR Section */}
              <div style={s.qrSection}>
                {status === 'waiting' ? (
                  <>
                    <p style={s.instruction}>
                      Scan this QR code with your phone to use its camera
                    </p>
                    {qrUrl && (
                      <div style={s.qrWrapper}>
                        <QRCode value={qrUrl} size={248} style={s.qrImage} />
                      </div>
                    )}
                    <div style={s.codeDisplay}>
                      <span style={s.codeLabel}>Or enter code manually:</span>
                      <span style={s.codeValue}>{pairingCode}</span>
                    </div>
                    <div style={s.waitingIndicator}>
                      <div style={s.waitingDot} />
                      <span style={s.waitingText}>Waiting for phone to connect...</span>
                    </div>
                  </>
                ) : (
                  <div style={s.connectedBanner}>
                    <div style={s.connectedDot} />
                    <span style={s.connectedText}>{phoneInfo || '📱 Phone connected'}</span>
                    <p style={s.connectedHint}>Take a photo on your phone — results will appear here instantly.</p>
                  </div>
                )}
              </div>

              {/* Results Section */}
              {results.length > 0 && (
                <div style={s.resultsSection}>
                  <h3 style={s.resultsTitle}>
                    📸 Received Photos ({results.length})
                  </h3>

                  {results.map((r, i) => (
                    <div key={i} style={s.resultCard}>
                      <div style={s.resultHeader}>
                        <span style={s.resultBadge}>
                          {r.type === 'prescription' ? '📋 Prescription' : '💊 Medicine'}
                        </span>
                        <span style={s.resultTime}>
                          {new Date(r.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {r.result?.medicines && r.result.medicines.length > 0 && (
                        <div style={s.medsList}>
                          {r.result.medicines.map((med, j) => (
                            <div key={j} style={s.medItem}>
                              <span style={s.medIcon}>💊</span>
                              <div>
                                <strong>{med.name}</strong>
                                {med.strength && (
                                  <span style={s.medBadge}>{med.strength}</span>
                                )}
                                {med.frequency && (
                                  <div style={s.medSub}>{med.frequency}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {r.result?.diagnosis && (
                        <p style={s.diagText}>
                          <strong>Diagnosis:</strong> {r.result.diagnosis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {status === 'connected' && (
            <button onClick={createSession} style={s.reconnectBtn}>
              🔄 Generate New Code
            </button>
          )}
          <button onClick={handleClose} style={s.doneBtn}>
            Done
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes linkModalFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes linkBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes linkSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes linkPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes linkGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    animation: 'linkBackdropFadeIn 0.2s ease',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '85vh',
    background: '#0f172a',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'linkModalFadeIn 0.3s ease',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    fontSize: '22px',
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#e2e8f0',
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },

  // Content
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  centerBox: {
    textAlign: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(99, 102, 241, 0.2)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'linkSpin 0.8s linear infinite',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: '14px',
  },

  // QR Section
  qrSection: {
    textAlign: 'center',
  },
  instruction: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  qrWrapper: {
    display: 'inline-block',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 4px 24px rgba(99, 102, 241, 0.15)',
  },
  qrImage: {
    width: '248px',
    height: '248px',
    display: 'block',
  },
  codeDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '20px',
  },
  codeLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  codeValue: {
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '4px',
    color: '#a5b4fc',
    fontFamily: "'JetBrains Mono', monospace",
  },
  waitingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  waitingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f59e0b',
    animation: 'linkPulse 1.5s infinite',
  },
  waitingText: {
    fontSize: '13px',
    color: '#94a3b8',
  },

  // Connected
  connectedBanner: {
    padding: '20px',
    background: 'rgba(34, 197, 94, 0.08)',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    textAlign: 'center',
  },
  connectedDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22c55e',
    margin: '0 auto 12px',
    animation: 'linkGlow 2s infinite',
  },
  connectedText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#4ade80',
    display: 'block',
    marginBottom: '8px',
  },
  connectedHint: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },

  // Results
  resultsSection: {
    marginTop: '20px',
  },
  resultsTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: '12px',
  },
  resultCard: {
    padding: '14px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(99, 102, 241, 0.12)',
    marginBottom: '10px',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  resultBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#a5b4fc',
    background: 'rgba(99, 102, 241, 0.15)',
    padding: '3px 10px',
    borderRadius: '6px',
  },
  resultTime: {
    fontSize: '11px',
    color: '#64748b',
  },
  medsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  medItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: '#e2e8f0',
  },
  medIcon: {
    flexShrink: 0,
    marginTop: '2px',
  },
  medBadge: {
    marginLeft: '6px',
    fontSize: '11px',
    color: '#a5b4fc',
    background: 'rgba(99, 102, 241, 0.12)',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  medSub: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  diagText: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '10px',
    padding: '8px 10px',
    background: 'rgba(99, 102, 241, 0.06)',
    borderRadius: '6px',
  },

  // Error
  errorBox: {
    textAlign: 'center',
    padding: '32px 16px',
    color: '#f87171',
    fontSize: '14px',
  },
  retryBtn: {
    marginTop: '12px',
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Footer
  footer: {
    display: 'flex',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid rgba(99, 102, 241, 0.15)',
    justifyContent: 'flex-end',
  },
  reconnectBtn: {
    padding: '8px 16px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    background: 'transparent',
    color: '#a5b4fc',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  doneBtn: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
