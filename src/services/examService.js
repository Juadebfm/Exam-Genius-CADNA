import { apiClient, API_ENDPOINTS } from '../config/api';

export const examService = {
  async getExams() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EXAMS);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getExamDetails(examId) {
    try {
      // Check if user is authenticated before making request
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await apiClient.get(API_ENDPOINTS.EXAM_DETAILS(examId));
      return { success: true, data: response.data || response };
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        // Clear invalid tokens and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/signin';
      }
      return { success: false, error: error.message };
    }
  },

  async startExam(examId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await apiClient.post(API_ENDPOINTS.START_EXAM(examId));
      
      console.log('Full start exam response:', response);
      console.log('Response keys:', Object.keys(response));
      
      // Extract sessionId from response.data._id
      const sessionId = response.data?._id || response._id || response.sessionId;
      
      if (sessionId) {
        localStorage.setItem(`exam_session_${examId}`, sessionId);
        console.log('Stored sessionId:', sessionId);
      } else {
        console.warn('No sessionId received from start exam API');
        console.warn('Available response data:', JSON.stringify(response, null, 2));
      }
      
      return { success: true, data: response.data || response };
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/signin';
      }
      return { success: false, error: error.message };
    }
  },

  async submitAnswer(sessionId, questionId, answer, timeSpent = 0) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBMIT_ANSWER(sessionId), {
        questionId,
        answer,
        timeSpent
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getExamSession(sessionId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EXAM_SESSION(sessionId));
      return { success: true, data: response.data || response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async syncAnswers(sessionId, answers) {
    try {
      const response = await apiClient.post(`/api/exam-sessions/${examId}/sync`, { answers });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async submitExam(sessionId, answers, isAutoSubmit = false) {
    try {
      const endpoint = isAutoSubmit 
        ? API_ENDPOINTS.AUTO_SUBMIT_EXAM(sessionId)
        : API_ENDPOINTS.SUBMIT_EXAM(sessionId);
        
      const response = await apiClient.post(endpoint, { 
        answers,
        submittedAt: new Date().toISOString()
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getResults() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESULTS);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getResultByExam(examId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(examId));
      return { success: true, data: response.data || response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default examService;