import { useState, useEffect, useRef } from 'react';
import { examMonitoringService } from '../services/examMonitoringService';

/*
  Hook to monitor exam integrity and detect cheating attempts
 */
export const useExamMonitoring = ({
  sessionId,
  examId,
  enabled = true,
  onIntegrityEvent
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState({
    tabSwitches: 0,
    windowBlurs: 0,
    fullscreenExits: 0,
    copyAttempts: 0,
    otherViolations: 0
  });
  const [totalViolations, setTotalViolations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const startTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(sessionId);

  // Update sessionId ref when it changes
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  //  FETCH EXISTING VIOLATIONS FROM BACKEND 
  useEffect(() => {
    const fetchExistingViolations = async () => {
      if (!sessionId) {
        console.log('⚠️ No sessionId, skipping violation fetch');
        setIsLoading(false);
        return;
      }

      try {
        console.log('📥 Fetching existing violations for session:', sessionId);
        
        //  Use examMonitoringService instead of direct fetch
        const result = await examMonitoringService.getIntegrityEvents(sessionId);
        console.log('✅ Fetch result:', result);
        
        if (result && result.data) {
          setViolations(result.data.violations || {
            tabSwitches: 0,
            windowBlurs: 0,
            fullscreenExits: 0,
            copyAttempts: 0,
            otherViolations: 0
          });
          setTotalViolations(result.data.totalViolations || 0);
          console.log('📊 Initial violation count:', result.data.totalViolations);
        }
      } catch (error) {
        console.error('❌ Failed to fetch existing violations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingViolations();
  }, [sessionId]);

  // Helper to log integrity events
  const logEvent = async (eventType, severity = 'medium', metadata = {}) => {
    if (!enabled || !sessionIdRef.current) {
      console.log('⚠️ Cannot log - enabled:', enabled, 'sessionId:', !!sessionIdRef.current);
      return;
    }

    const event = {
      sessionId: sessionIdRef.current,
      examId,
      eventType,
      timestamp: new Date().toISOString(),
      timeFromStart: Math.floor((Date.now() - startTimeRef.current) / 1000),
      severity,
      metadata
    };

    console.log('🚨 Logging violation:', eventType);
    console.log('📤 Event data:', event);

    // Update local state immediately for UI
    setViolations(prev => {
      const updated = { ...prev };
      switch (eventType) {
        case 'tab_switch':
          updated.tabSwitches = (updated.tabSwitches || 0) + 1;
          break;
        case 'window_blur':
          updated.windowBlurs = (updated.windowBlurs || 0) + 1;
          break;
        case 'fullscreen_exit':
        case 'fullscreen_denied':
          updated.fullscreenExits = (updated.fullscreenExits || 0) + 1;
          break;
        case 'copy_attempt':
        case 'paste_attempt':
          updated.copyAttempts = (updated.copyAttempts || 0) + 1;
          break;
        default:
          updated.otherViolations = (updated.otherViolations || 0) + 1;
      }
      return updated;
    });

    setTotalViolations(prev => prev + 1);

    // Call the callback if provided
    if (onIntegrityEvent) {
      console.log('📤 Calling onIntegrityEvent callback...');
      try {
        await onIntegrityEvent(event);
        console.log('✅ Callback completed successfully');
      } catch (error) {
        console.error('❌ Callback failed:', error);
      }
    } else {
      console.warn('⚠️ No onIntegrityEvent callback provided!');
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    if (!enabled) return;

    const checkFullscreen = () => {
      const isFS = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFS);
      return isFS;
    };

    const handleFullscreenChange = () => {
      const isFS = checkFullscreen();
      if (!isFS && enabled) {
        logEvent('fullscreen_exit', 'high', { reason: 'user_action' });
      }
    };

    checkFullscreen();

    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.warn('⚠️ Fullscreen request failed:', err);
          logEvent('fullscreen_denied', 'medium', { error: err.message });
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    };

    setTimeout(enterFullscreen, 500);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [enabled]);

  // Monitor tab/window visibility
  useEffect(() => {
    if (!enabled) {
      console.log('⚠️ Tab monitoring disabled');
      return;
    }

    console.log('✅ Setting up tab/blur monitoring');

    let lastVisibilityChange = Date.now();

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (now - lastVisibilityChange < 1000) return;
      lastVisibilityChange = now;

      if (document.hidden) {
        console.log('🚨 TAB SWITCH DETECTED!');
        logEvent('tab_switch', 'high', { hidden: true });
      }
    };

    const handleBlur = () => {
      const now = Date.now();
      if (now - lastVisibilityChange < 1000) return;
      lastVisibilityChange = now;

      console.log('🚨 WINDOW BLUR DETECTED!');
      logEvent('window_blur', 'medium', { focused: false });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);

  // Monitor copy/paste attempts
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e) => {
      console.log('🚨 COPY DETECTED!');
      logEvent('copy_attempt', 'low', { type: 'copy' });
    };

    const handlePaste = (e) => {
      console.log('🚨 PASTE DETECTED!');
      logEvent('paste_attempt', 'low', { type: 'paste' });
    };

    const handleCut = (e) => {
      console.log('🚨 CUT DETECTED!');
      logEvent('copy_attempt', 'low', { type: 'cut' });
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [enabled]);

  // Prevent right-click context menu
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      console.log('⚠️ Right-click blocked');
      logEvent('context_menu', 'low', { blocked: true });
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled]);

  // Detect common cheating key combinations
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'Tab') {
        console.log('⚠️ Alt+Tab detected');
        logEvent('tab_switch', 'high', { keys: 'Alt+Tab' });
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        console.log('⚠️ DevTools attempt detected');
        logEvent('devtools_attempt', 'high', { keys: 'Ctrl+Shift+I' });
      }

      if (e.key === 'F12') {
        console.log('⚠️ F12 DevTools attempt detected');
        logEvent('devtools_attempt', 'high', { keys: 'F12' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return {
    isFullscreen,
    violations,
    totalViolations,
    isLoading,
    logEvent
  };
};