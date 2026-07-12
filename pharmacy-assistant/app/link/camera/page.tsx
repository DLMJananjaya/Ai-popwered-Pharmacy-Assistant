'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type SessionState = 'connecting' | 'connected' | 'error' | 'expired';
type CaptureMode = 'prescription' | 'medicine';

interface MedResult {
  name: string;
  strength: string | null;
  frequency: string | null;
  timing: string | null;
  notes: string | null;
}

interface PrescriptionResult {
  medicines: MedResult[];
  patientName: string | null;
  doctorName: string | null;
  date: string | null;
  diagnosis: string | null;
  usageInstructions: string;
  allergyWarnings: string;
  warnings: string[];
  rawText: string;
}

export default function MobileCameraPage() {
  const [sessionState, setSessionState] = useState<SessionState>('connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<CaptureMode>('prescription');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Extract pairing code from URL
  const getCodeFromURL = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  }, []);

  // Connect to session
  useEffect(() => {
    const code = getCodeFromURL();
    if (!code) {
      setSessionState('error');
      setErrorMsg('No pairing code found. Please scan the QR code again.');
      return;
    }

    async function connect() {
      try {
        const res = await fetch('/api/link/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            userAgent: navigator.userAgent,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to connect');
        }

        const data = await res.json();
        setSessionId(data.sessionId);
        setSessionState('connected');
      } catch (err) {
        setSessionState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Connection failed');
      }
    }

    connect();
  }, [getCodeFromURL]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
      setCapturedImage(null);
      setResult(null);

      // Try to enable torch/flash
      if (flashEnabled) {
        const track = stream.getVideoTracks()[0];
        try {
          // @ts-expect-error — applyConstraints with torch is non-standard
          await track.applyConstraints({ advanced: [{ torch: true }] });
        } catch { /* flash not supported */ }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setErrorMsg('Could not access camera. Please check permissions and try again.');
    }
  }, [facingMode, flashEnabled]);

  // Start camera when connected
  useEffect(() => {
    if (sessionState === 'connected') {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]);

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      alert('Camera not ready. Please wait a moment.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImage(imageData);
    setCameraActive(false);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Send photo for processing
  const processPhoto = async () => {
    if (!capturedImage || !sessionId) return;

    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch('/api/link/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          image: capturedImage,
          type: mode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Processing failed');
      }

      const data = await res.json();
      setResult(data.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to process photo');
    } finally {
      setProcessing(false);
    }
  };

  // Retake photo
  const retake = () => {
    setCapturedImage(null);
    setResult(null);
    startCamera();
  };

  // Toggle camera
  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (cameraActive) {
      startCamera();
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    setFlashEnabled(prev => !prev);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        // @ts-expect-error — torch constraint is non-standard
        await track.applyConstraints({ advanced: [{ torch: !flashEnabled }] });
      } catch { /* not supported */ }
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  // Error state
  if (sessionState === 'error' || sessionState === 'expired') {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Connection Failed</h2>
          <p style={styles.errorText}>{errorMsg}</p>
          <p style={styles.errorHint}>Please go back to the desktop and generate a new QR code.</p>
        </div>
      </div>
    );
  }

  // Connecting state
  if (sessionState === 'connecting') {
    return (
      <div style={styles.container}>
        <div style={styles.connectingCard}>
          <div style={styles.spinner} />
          <p style={styles.connectingText}>Connecting to your pharmacy system...</p>
        </div>
      </div>
    );
  }

  // Connected — camera view
  return (
    <div style={styles.container}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusDot} />
        <span style={styles.statusText}>Connected to Desktop</span>
        <div style={styles.modeSwitch}>
          <button
            onClick={() => setMode('prescription')}
            style={{
              ...styles.modeBtn,
              ...(mode === 'prescription' ? styles.modeBtnActive : {}),
            }}
          >
            📋 Prescription
          </button>
          <button
            onClick={() => setMode('medicine')}
            style={{
              ...styles.modeBtn,
              ...(mode === 'medicine' ? styles.modeBtnActive : {}),
            }}
          >
            💊 Medicine
          </button>
        </div>
      </div>

      {/* Camera / Captured image */}
      <div style={styles.viewfinder}>
        {cameraActive && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            {/* Camera overlay guide */}
            <div style={styles.cameraOverlay}>
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <p style={styles.guideText}>
                {mode === 'prescription'
                  ? 'Position the prescription within the frame'
                  : 'Point at the medicine label'}
              </p>
            </div>
          </>
        )}

        {capturedImage && !cameraActive && (
          <img src={capturedImage} alt="Captured" style={styles.capturedImg} />
        )}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {cameraActive ? (
          <>
            <button onClick={toggleFlash} style={styles.sideBtn} title="Toggle Flash">
              {flashEnabled ? '⚡' : '🔦'}
            </button>
            <button onClick={capturePhoto} style={styles.captureBtn}>
              <div style={styles.captureBtnInner} />
            </button>
            <button onClick={flipCamera} style={styles.sideBtn} title="Flip Camera">
              🔄
            </button>
          </>
        ) : capturedImage ? (
          <>
            <button onClick={retake} style={styles.actionBtn}>
              🔄 Retake
            </button>
            <button
              onClick={processPhoto}
              disabled={processing}
              style={{
                ...styles.actionBtn,
                ...styles.processBtn,
                ...(processing ? styles.processBtnDisabled : {}),
              }}
            >
              {processing ? (
                <>
                  <span style={styles.btnSpinner} />
                  Processing...
                </>
              ) : (
                `✨ Analyze ${mode === 'prescription' ? 'Prescription' : 'Medicine'}`
              )}
            </button>
          </>
        ) : null}
      </div>

      {/* Results */}
      {result && (
        <div style={styles.resultsContainer}>
          <h3 style={styles.resultsTitle}>
            ✅ {mode === 'prescription' ? 'Prescription Analysis' : 'Medicine Identified'}
          </h3>

          {result.patientName && (
            <div style={styles.resultMeta}>
              <span>👤 {result.patientName}</span>
              {result.doctorName && <span>🩺 Dr. {result.doctorName}</span>}
              {result.date && <span>📅 {result.date}</span>}
            </div>
          )}

          {result.diagnosis && (
            <div style={styles.diagnosisCard}>
              <strong>Diagnosis:</strong> {result.diagnosis}
            </div>
          )}

          {result.medicines && result.medicines.length > 0 && (
            <div style={styles.medsGrid}>
              {result.medicines.map((med, i) => (
                <div key={i} style={styles.medCard}>
                  <div style={styles.medName}>
                    💊 {med.name}
                    {med.strength && <span style={styles.medStrength}>{med.strength}</span>}
                  </div>
                  {med.frequency && (
                    <div style={styles.medDetail}>📅 {med.frequency}</div>
                  )}
                  {med.timing && (
                    <div style={styles.medDetail}>⏰ {med.timing}</div>
                  )}
                  {med.notes && (
                    <div style={styles.medNote}>📝 {med.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.usageInstructions && (
            <div style={styles.infoCard}>
              <strong>📋 Usage:</strong>
              <p>{result.usageInstructions}</p>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div style={{ ...styles.infoCard, ...styles.warningCard }}>
              <strong>⚠️ Warnings:</strong>
              <ul style={styles.warningList}>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <p style={styles.desktopHint}>
            ✅ Results have been sent to your desktop automatically.
          </p>

          <button onClick={retake} style={{ ...styles.actionBtn, ...styles.newScanBtn }}>
            📸 Scan Another
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles (inline — mobile-optimized, dark theme)
// ─────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    background: '#0a0a0a',
    color: '#e2e8f0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },

  // Status bar
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 8px #22c55e',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontSize: '13px',
    color: '#94a3b8',
    flex: 1,
  },
  modeSwitch: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '8px',
    padding: '2px',
  },
  modeBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeBtnActive: {
    background: 'rgba(99, 102, 241, 0.3)',
    color: '#a5b4fc',
  },

  // Viewfinder
  viewfinder: {
    flex: 1,
    position: 'relative',
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  capturedImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  // Camera overlay
  cameraOverlay: {
    position: 'absolute',
    inset: '10%',
    pointerEvents: 'none',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30px',
    height: '30px',
    borderTop: '3px solid rgba(99, 102, 241, 0.8)',
    borderLeft: '3px solid rgba(99, 102, 241, 0.8)',
    borderRadius: '4px 0 0 0',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30px',
    height: '30px',
    borderTop: '3px solid rgba(99, 102, 241, 0.8)',
    borderRight: '3px solid rgba(99, 102, 241, 0.8)',
    borderRadius: '0 4px 0 0',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '30px',
    height: '30px',
    borderBottom: '3px solid rgba(99, 102, 241, 0.8)',
    borderLeft: '3px solid rgba(99, 102, 241, 0.8)',
    borderRadius: '0 0 0 4px',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '30px',
    height: '30px',
    borderBottom: '3px solid rgba(99, 102, 241, 0.8)',
    borderRight: '3px solid rgba(99, 102, 241, 0.8)',
    borderRadius: '0 0 4px 0',
  },
  guideText: {
    position: 'absolute',
    bottom: '-32px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },

  // Controls
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '20px 16px',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  captureBtn: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '4px solid rgba(255, 255, 255, 0.8)',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s',
  },
  captureBtnInner: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'white',
    transition: 'transform 0.1s',
  },
  sideBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  processBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
  },
  processBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  // Results
  resultsContainer: {
    padding: '20px 16px',
    background: '#0f172a',
    borderTop: '1px solid rgba(99, 102, 241, 0.2)',
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#a5b4fc',
    marginBottom: '16px',
  },
  resultMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  diagnosisCard: {
    padding: '10px 14px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    marginBottom: '12px',
    fontSize: '14px',
  },
  medsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  medCard: {
    padding: '12px 14px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },
  medName: {
    fontWeight: 600,
    fontSize: '15px',
    color: '#e2e8f0',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  medStrength: {
    fontSize: '12px',
    color: '#a5b4fc',
    background: 'rgba(99, 102, 241, 0.15)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  medDetail: {
    fontSize: '13px',
    color: '#94a3b8',
    marginLeft: '24px',
    marginTop: '2px',
  },
  medNote: {
    fontSize: '12px',
    color: '#64748b',
    marginLeft: '24px',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  infoCard: {
    padding: '12px 14px',
    background: 'rgba(30, 41, 59, 0.4)',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    marginBottom: '12px',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  warningCard: {
    background: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningList: {
    margin: '6px 0 0 16px',
    padding: 0,
  },
  desktopHint: {
    textAlign: 'center',
    color: '#22c55e',
    fontSize: '13px',
    margin: '16px 0',
    fontWeight: 500,
  },
  newScanBtn: {
    width: '100%',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    marginTop: '8px',
  },

  // Error / Connecting states
  errorCard: {
    margin: 'auto',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '360px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f87171',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '8px',
  },
  errorHint: {
    fontSize: '13px',
    color: '#64748b',
  },
  connectingCard: {
    margin: 'auto',
    textAlign: 'center',
    padding: '32px',
  },
  connectingText: {
    fontSize: '15px',
    color: '#94a3b8',
    marginTop: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(99, 102, 241, 0.2)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 0.8s linear infinite',
  },
  btnSpinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
