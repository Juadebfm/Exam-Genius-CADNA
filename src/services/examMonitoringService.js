import { apiClient, API_ENDPOINTS } from '../config/api';

/*
  Service for logging exam integrity events to backend
  Uses API_ENDPOINTS + keeps offline fallback support
 */
class ExamMonitoringService {
  /*
   * Log an integrity event to the backend
   * @param {string} sessionId - Exam session ID
   * @param {object} event - Event data from useExamMonitoring
   */
  async logIntegrityEvent(sessionId, event) {
    if (!sessionId) {
      console.warn('⚠️ No session ID provided for integrity event');
      return { success: false, error: 'No session ID' };
    }

    try {
      //  Uses API_ENDPOINTS 
      const response = await apiClient.post(
        API_ENDPOINTS.LOG_INTEGRITY_EVENT(sessionId),
        event
      );

      console.log('✅ Integrity event logged to backend:', event.eventType);
      return response;
    } catch (error) {
      console.error('❌ Failed to log integrity event:', error);
      
      // Store in localStorage as fallback
      this.storeEventLocally(sessionId, event);
      
      return { success: false, error: error.message };
    }
  }

  /*
    Store event locally if backend fails
   */
  storeEventLocally(sessionId, event) {
    try {
      const key = `integrity_events_${sessionId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        ...event,
        storedLocally: true,
        storedAt: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(existing));
      console.log('💾 Stored integrity event locally');
    } catch (error) {
      console.error('Failed to store event locally:', error);
    }
  }

  /*
    Sync locally stored events to backend
   */
  async syncLocalEvents(sessionId) {
    try {
      const key = `integrity_events_${sessionId}`;
      const events = JSON.parse(localStorage.getItem(key) || '[]');

      if (events.length === 0) return { success: true, synced: 0 };

      let synced = 0;
      for (const event of events) {
        const result = await this.logIntegrityEvent(sessionId, event);
        if (result.success) synced++;
      }

      // Clear local storage after sync
      if (synced === events.length) {
        localStorage.removeItem(key);
        console.log(`🔄 Synced ${synced} local events to backend`);
      }

      return { success: true, synced };
    } catch (error) {
      console.error('Failed to sync local events:', error);
      return { success: false, error: error.message };
    }
  }

  /*
    Get integrity events for a session
   */
  async getIntegrityEvents(sessionId) {
    try {
      //  Uses API_ENDPOINTS 
      const response = await apiClient.get(
        API_ENDPOINTS.GET_INTEGRITY_EVENTS(sessionId)
      );
      return response;
    } catch (error) {
      console.error('Failed to get integrity events:', error);
      return { success: false, error: error.message };
    }
  }
}

export const examMonitoringService = new ExamMonitoringService();
