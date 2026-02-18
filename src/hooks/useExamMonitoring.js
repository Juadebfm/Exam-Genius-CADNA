import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for exam monitoring and anti-cheating features
 * Tracks: fullscreen, tab switches, window blur, visibility changes
 */
export const useExamMonitoring = ({ 
  sessionId, 
  examId, 
  onIntegrityEvent, 
  enabled = true 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState({
    tabSwitches: 0,
    windowBlurs: 0,
    fullscreenExits: 0,
    visibilityChanges: 0
  });
  
  const violationsRef = useRef(violations);
  const startTimeRef = useRef(Date.now());

  // Update ref when violations change
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  // Request fullscreen on component mount
  useEffect(() => {
    if (!enabled) return;

    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE11
          await elem.msRequestFullscreen();
        }
        setIsFullscreen(true);
        console.log('✅ Entered fullscreen mode');
      } catch (error) {
        console.warn('⚠️ Fullscreen request failed:', error);
        logEvent('fullscreen_denied', { error: error.message });
      }
    };

    // Small delay to avoid immediate fullscreen request
    const timeout = setTimeout(enterFullscreen, 500);
    return () => clearTimeout(timeout);
  }, [enabled]);

  // Log integrity event
  const logEvent = (eventType, metadata = {}) => {
    const event = {
      sessionId,
      examId,
      eventType,
      timestamp: new Date().toISOString(),
      timeFromStart: Math.floor((Date.now() - startTimeRef.current) / 1000),
      metadata
    };

    console.log('🚨 Integrity Event:', event);

    // Call parent handler
    if (onIntegrityEvent) {
      onIntegrityEvent(event);
    }
  };

  // Fullscreen change detection
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen) {
        // User exited fullscreen
        setViolations(prev => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1
        }));

        logEvent('fullscreen_exit', {
          exitCount: violationsRef.current.fullscreenExits + 1,
          severity: 'high'
        });

        // Show warning
        alert('⚠️ Warning: You exited fullscreen mode. Please return to fullscreen to continue the exam.');

        // Try to re-enter fullscreen
        setTimeout(() => {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => 
              console.warn('Failed to re-enter fullscreen:', err)
            );
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [enabled]);

  // Window blur detection (user clicked outside browser)
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      setViolations(prev => ({
        ...prev,
        windowBlurs: prev.windowBlurs + 1
      }));

      logEvent('window_blur', {
        blurCount: violationsRef.current.windowBlurs + 1,
        severity: 'medium'
      });

      console.warn('⚠️ Window lost focus - potential cheating');
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [enabled]);

  // Visibility change detection (tab switched)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
          visibilityChanges: prev.visibilityChanges + 1
        }));

        logEvent('tab_switch', {
          tabSwitchCount: violationsRef.current.tabSwitches + 1,
          severity: 'high'
        });

        console.warn('⚠️ Tab switched - HIGH SEVERITY VIOLATION');
        
        // Show warning when user returns
        alert('⚠️ WARNING: Tab switching is not allowed during the exam. This incident has been logged.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);

  // Context menu prevention (right-click)
  useEffect(() => {
    if (!enabled) return;

    const preventContextMenu = (e) => {
      e.preventDefault();
      logEvent('context_menu_attempt', { severity: 'low' });
      return false;
    };

    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, [enabled]);

  // Copy/paste prevention
  useEffect(() => {
    if (!enabled) return;

    const preventCopy = (e) => {
      // Allow copy in textarea/input for user answers
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
      }
      e.preventDefault();
      logEvent('copy_attempt', { severity: 'low' });
    };

    const preventPaste = (e) => {
      // Allow paste in textarea/input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
      }
      e.preventDefault();
      logEvent('paste_attempt', { severity: 'low' });
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
    };
  }, [enabled]);

  // Print screen detection
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Print Screen (PrtScn)
      if (e.key === 'PrintScreen') {
        logEvent('print_screen_attempt', { severity: 'medium' });
        alert('⚠️ Screenshots are not allowed during the exam.');
      }

      // Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        logEvent('print_attempt', { severity: 'medium' });
        alert('⚠️ Printing is not allowed during the exam.');
      }

      // Ctrl+Shift+I or F12 (DevTools)
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        logEvent('devtools_attempt', { severity: 'high' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  // Exit fullscreen on cleanup
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => 
          console.warn('Failed to exit fullscreen on cleanup:', err)
        );
      }
    };
  }, []);

  return {
    isFullscreen,
    violations,
    totalViolations: Object.values(violations).reduce((a, b) => a + b, 0)
  };
};
