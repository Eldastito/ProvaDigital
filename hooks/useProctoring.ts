
import { useState, useEffect, useRef } from 'react';
import { useSafeAppStore } from '../store/useAppStore'; // Use safe wrapper
import { SecurityEvent } from '../types';
import html2canvas from 'html2canvas';

interface ProctoringConfig {
  studentId?: string;
  studentName?: string;
  isActive: boolean;
  onViolation?: (reason: string, type: SecurityEvent['type'], evidence?: { screenshot?: string; webcam?: string }) => void;
}

export const useProctoring = ({ studentId, studentName, isActive, onViolation }: ProctoringConfig) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isKioskActive, setIsKioskActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolation, setLastViolation] = useState<string>('');
  const [securityLog, setSecurityLog] = useState<SecurityEvent[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { broadcastEvent } = useSafeAppStore();

  // 1. Camera Initialization
  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        })
        .catch((err) => console.warn('Camera blocked or unavailable', err));

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach((t) => t.stop());
        }
      };
    }
  }, [isActive]);

  // 2. Security Event Logging Helper
  const logEvent = (type: SecurityEvent['type'], details: string) => {
    const newEvent: SecurityEvent = {
      timestamp: new Date().toISOString(),
      type,
      details
    };
    setSecurityLog(prev => [...prev, newEvent]);
    return newEvent;
  };

  // 3. Kiosk Mode & Event Listeners
  useEffect(() => {
    if (isActive) {
      // A. Visibility Change (Tab Switch)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleViolation('Aluno minimizou o app ou trocou de aba.', 'FOCUS_LOST');
        } else {
          handleViolation('Aluno retornou ao foco.', 'FOCUS_GAINED'); // Track return too
        }
      };

      // B. Window Blur (Clicking outside / Notifications)
      const handleBlur = () => {
        handleViolation('Aluno perdeu o foco da janela (clique externo ou notificação).', 'FOCUS_LOST');
      };

      // C. Keys (Shortcuts)
      const handleKeyDown = (e: KeyboardEvent) => {
        const forbiddenKeys = ['Alt', 'Tab', 'Meta', 'F12', 'PrintScreen', 'Escape'];

        if (forbiddenKeys.includes(e.key) || (e.ctrlKey && ['c', 'v', 'p', 'shift', 'i'].includes(e.key))) {
          e.preventDefault(); // BLOCK ACTION
          if (forbiddenKeys.includes(e.key)) {
            handleViolation(`Tentativa de atalho de sistema: ${e.key}`, 'KEYBOARD_VIOLATION');
          }
        }
      };

      // D. Context Menu (Right Click)
      const handleContextMenu = (e: Event) => {
        e.preventDefault();
        // Optional: Alert user minimally or just block silently
      };

      // E. Fullscreen Change
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          setIsKioskActive(false);
          handleViolation('Aluno saiu do modo Tela Cheia.', 'FULLSCREEN_EXIT');
        } else {
          setIsKioskActive(true);
        }
      };

      // F. Mouse Leave (Intent to Switch Tab/App)
      const handleMouseLeave = (e: MouseEvent | Event) => {
        const me = e as MouseEvent;
        // Only trigger if mouse leaves significantly towards the top of the viewport
        // Changed from clientY <= 0 to clientY <= 2 to avoid accidental browser tab hovers
        if (me.clientY <= -2) {
          handleViolation('Aluno moveu o cursor para fora da janela (Intenção de trocar aba).', 'MOUSE_LEAVE');
        }
      };

      // G. Window Resize (Split Screen Attempt)
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const screenW = window.screen.width;

        // If window is significantly smaller than screen (e.g. < 90%), it might be split screen
        // Note: Fullscreen usually forces match, but this catches non-fullscreen resizing
        if (width < screenW * 0.9) {
          handleViolation('Janela redimensionada (Possível Split-Screen).', 'WINDOW_RESIZE');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.documentElement.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('resize', handleResize);

      // Force focus back
      window.focus();

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isActive, studentId]);

  // 4. Evidence Capture (Snapshot & Screenshot)
  const captureEvidence = async () => {
    const evidence: { screenshot?: string; webcam?: string } = {};

    try {
      // A. Webcam Snapshot
      if (videoRef.current && cameraActive) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          evidence.webcam = canvas.toDataURL('image/jpeg', 0.5); // Low quality for storage
        }
      }

      // B. Screen UI Snapshot (html2canvas)
      // We capture document.body to show exam state
      // Note: This is heavy, ensuring it doesn't freeze UI is hard, but necessary for proof
      const canvas = await html2canvas(document.body, {
        scale: 0.5, // Reduced quality
        logging: false,
        useCORS: true
      });
      evidence.screenshot = canvas.toDataURL('image/jpeg', 0.5);

    } catch (e) {
      console.error("Failed to capture evidence:", e);
    }
    return evidence;
  };

  const handleViolation = async (reason: string, type: SecurityEvent['type']) => {
    // Increment only for "bad" things
    if (type !== 'FOCUS_GAINED') {
      setViolationCount((prev) => prev + 1);
      setLastViolation(reason);
    }

    // Capture Evidence for severe violations
    let evidence = undefined;
    if (['FOCUS_LOST', 'WINDOW_RESIZE', 'MOUSE_LEAVE', 'FULLSCREEN_EXIT'].includes(type as string)) {
      evidence = await captureEvidence();
    }

    // Log internally
    const event = logEvent(type, reason);
    // Attach evidence to local log if needed (omitted to save memory)

    if (studentId && studentName) {
      // Broadcast to Supabase Realtime
      broadcastEvent('ALERT', {
        studentId,
        name: studentName,
        type,
        reason: reason,
        timestamp: new Date().toISOString(),
        hasEvidence: !!evidence // Flag for teacher to verify in DB later
      });
    }

    if (onViolation) onViolation(reason, type, evidence);
  };

  const enterKioskMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsKioskActive(true);
      }
    } catch (e) {
      console.warn('Fullscreen denied');
    }
  };

  // 5. Screen Share Logic
  const startScreenShare = async () => {
    try {
      // Request Screen Share - specifically asking for system audio if possible (optional)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });

      // If successful
      setIsKioskActive(true); // Treat screen share as high-integrity mode

      // Handle user clicking "Stop Sharing" on browser UI
      stream.getVideoTracks()[0].onended = () => {
        handleViolation('Aluno encerrou o compartilhamento de tela manualmente.', 'SCREEN_SHARE_ENDED');
      };

      return true;
    } catch (err) {
      console.warn("Screen Share denied:", err);
      return false;
    }
  };

  return {
    cameraActive,
    isKioskActive,
    violationCount,
    lastViolation,
    videoRef,
    securityLog,
    enterKioskMode,
    startScreenShare, // Export new capability
    captureEvidence, // Export for manual evidence capture (e.g. Waiver acceptance)
    resetViolations: () => {
      setViolationCount(0);
      setSecurityLog([]);
    }
  };
};