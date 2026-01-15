
import { useState, useEffect, useRef } from 'react';
import { useSafeAppStore } from '../store/useAppStore'; // Use safe wrapper
import { SecurityEvent } from '../types';

interface ProctoringConfig {
  studentId?: string;
  studentName?: string;
  isActive: boolean;
  onViolation?: (reason: string, type: SecurityEvent['type']) => void;
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

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      // Force focus back
      window.focus();

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }
  }, [isActive, studentId]);

const handleViolation = (reason: string, type: SecurityEvent['type']) => {
  // Increment only for "bad" things
  if (type !== 'FOCUS_GAINED') {
    setViolationCount((prev) => prev + 1);
    setLastViolation(reason);
  }

  // Log internally
  logEvent(type, reason);

  if (studentId && studentName) {
    // Broadcast to Supabase Realtime
    broadcastEvent('ALERT', {
      studentId,
      name: studentName,
      type,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  }

  if (onViolation) onViolation(reason, type);
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

return {
  cameraActive,
  isKioskActive,
  violationCount,
  lastViolation,
  videoRef,
  securityLog,
  enterKioskMode,
  resetViolations: () => {
    setViolationCount(0);
    setSecurityLog([]);
  }
};
};