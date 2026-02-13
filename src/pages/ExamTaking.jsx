import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient, API_ENDPOINTS } from "../config/api";
import { useTheme } from "../context/ThemeContext.jsx";
import ExamTokenManager from "../utils/examTokenManager";
import Loading from "../components/UI/Loading";

const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // State
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [showWarning, setShowWarning] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    answered: false,
    flagged: false,
    notAnswered: false
  });
  
  const tokenManager = useRef(new ExamTokenManager(apiClient));
  const saveTimeoutRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  // Initialize exam
  useEffect(() => {
    const initializeExam = async () => {
      try {
        const realExamId = localStorage.getItem('currentExamId') || examId;
        
        if (!realExamId || typeof realExamId !== 'string') {
          throw new Error('Invalid exam ID');
        }
        
        // Get exam details
        const examResponse = await apiClient.get(API_ENDPOINTS.EXAM_DETAILS(realExamId));
        if (!examResponse.success || !examResponse.data) {
          throw new Error(examResponse.message || 'Failed to load exam');
        }
        
        // Start exam session
        const sessionResponse = await apiClient.post(API_ENDPOINTS.START_EXAM(realExamId), {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        if (!sessionResponse.success || !sessionResponse.data) {
          throw new Error(sessionResponse.message || 'Failed to start exam session');
        }
        
        setExam(examResponse.data);
        const timeLimitMinutes = examResponse.data.settings?.timeLimit || examResponse.data.timeLimit || 60;
        setTimeLeft(timeLimitMinutes * 60);
        
        // Load saved progress if any
        const savedAnswers = localStorage.getItem(`exam_${realExamId}_answers`);
        const savedFlags = localStorage.getItem(`exam_${realExamId}_flags`);
        
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
        if (savedFlags) {
          setFlaggedQuestions(new Set(JSON.parse(savedFlags)));
        }
        
      } catch (error) {
        console.error('Exam initialization error:', error);
        setError(error.message || "Error loading exam");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      initializeExam();
    } else {
      setError('No exam ID provided');
      setLoading(false);
    }
    
    return () => {
      if (tokenManager.current) {
        tokenManager.current.endExamSession();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !submitting && exam) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Show warning at 5 minutes
          if (newTime === 300) {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 5000);
          }
          
          return newTime;
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam && !submitting) {
      // Auto-submit when time runs out
      handleSubmit();
    }
  }, [timeLeft, exam, submitting]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (exam) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveProgress();
      }, 30000); // 30 seconds
      
      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [exam, answers, flaggedQuestions]);

  // Debounced save on answer change
  const saveProgress = useCallback(async () => {
    if (!exam) return;
    
    setSaveStatus("saving");
    
    try {
      // Save to localStorage
      localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
      localStorage.setItem(`exam_${examId}_flags`, JSON.stringify([...flaggedQuestions]));
      
      // Optionally save to backend
      await apiClient.post(API_ENDPOINTS.SAVE_PROGRESS(examId), {
        answers,
        flaggedQuestions: [...flaggedQuestions],
        currentQuestion,
        timeLeft
      });
      
      setSaveStatus("saved");
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus("error");
      // Retry after 5 seconds
      setTimeout(() => saveProgress(), 5000);
    }
  }, [exam, examId, answers, flaggedQuestions, currentQuestion, timeLeft]);

  // Handle answer change with debounced save
  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Clear validation error for this question
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
    
    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 2000); // Save 2 seconds after last change
  };

  // Toggle flag
  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newFlags = new Set(prev);
      if (newFlags.has(questionId)) {
        newFlags.delete(questionId);
      } else {
        newFlags.add(questionId);
      }
      return newFlags;
    });
  };

  // Validate answers
  const validateAnswers = () => {
    const errors = {};
    
    exam.questions.forEach((question, index) => {
      const answer = answers[question._id || question.id];
      
      // Check if required question is answered
      if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
        errors[question._id || question.id] = 'This question is required';
      }
      
      // Validate word count for essay questions
      if (question.type === 'essay' && answer) {
        const wordCount = answer.trim().split(/\s+/).length;
        if (wordCount < 250) {
          errors[question._id || question.id] = `Minimum 250 words required (current: ${wordCount})`;
        } else if (wordCount > 500) {
          errors[question._id || question.id] = `Maximum 500 words allowed (current: ${wordCount})`;
        }
      }
      
      // Validate short answer length
      if (question.type === 'short-answer' && answer) {
        if (answer.length > 200) {
          errors[question._id || question.id] = `Maximum 200 characters allowed (current: ${answer.length})`;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit exam
  const handleSubmit = async () => {
    if (submitting) return;
    
    // Validate before submit
    if (!validateAnswers()) {
      alert('Please fix validation errors before submitting');
      return;
    }
    
    // Check for unanswered questions
    const unansweredCount = exam.questions.filter(q => 
      !answers[q._id || q.id] || answers[q._id || q.id].trim() === ''
    ).length;
    
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirm) return;
    }
    
    setSubmitting(true);
    
    try {
      if (!examId || !answers) {
        throw new Error('Missing exam data for submission');
      }
      
      const response = await apiClient.post(API_ENDPOINTS.SUBMIT_EXAM(examId), {
        answers,
        submittedAt: new Date().toISOString()
      });
      
      if (response.success) {
        // Clear saved progress
        localStorage.removeItem(`exam_${examId}_answers`);
        localStorage.removeItem(`exam_${examId}_flags`);
        
        await tokenManager.current.endExamSession();
        navigate(`/exam/${examId}/result`);
      } else {
        throw new Error(response.message || 'Failed to submit exam');
      }
    } catch (error) {
      console.error('Exam submission error:', error);
      setError(error.message || "Error submitting exam");
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get question status
  const getQuestionStatus = (question) => {
    const questionId = question._id || question.id;
    const isAnswered = answers[questionId] && answers[questionId].toString().trim() !== '';
    const isFlagged = flaggedQuestions.has(questionId);
    
    return { isAnswered, isFlagged };
  };

  // Filter questions
  const getFilteredQuestions = () => {
    if (!filters.answered && !filters.flagged && !filters.notAnswered) {
      return exam.questions.map((_, index) => index);
    }
    
    return exam.questions
      .map((question, index) => {
        const { isAnswered, isFlagged } = getQuestionStatus(question);
        
        if (filters.answered && !isAnswered) return null;
        if (filters.flagged && !isFlagged) return null;
        if (filters.notAnswered && isAnswered) return null;
        
        return index;
      })
      .filter(index => index !== null);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );
  if (!exam) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Exam not found</p>
    </div>
  );

  const question = exam.questions[currentQuestion];
  const questionId = question._id || question.id;
  const { isAnswered, isFlagged } = getQuestionStatus(question);
  const filteredQuestionIndices = getFilteredQuestions();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navigation Bar */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex justify-end">
          <button 
            onClick={toggleDarkMode}
            className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-xl transition-colors`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Exam Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {exam.title}
            </h1>
            <div className="flex items-center space-x-4">
              {/* Warning Triangle */}
              <div className="relative" title="Exam is being monitored">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-red-500">
                  <path fill="currentColor" d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
              </div>
              {/* Webcam Status */}
              <div className="relative" title="Webcam active">
                <div className={`w-10 h-7 ${darkMode ? 'bg-gray-700' : 'bg-gray-800'} rounded-md flex items-center justify-center`}>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-6 py-3 rounded-full ${timeLeft <= 300 ? 'animate-pulse' : ''}`}>
            <div className="text-lg">🕐</div>
            <div className={`text-xl font-mono font-semibold ${timeLeft <= 300 ? 'text-red-600' : darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Time Warning */}
      {showWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-yellow-800 text-center font-medium">
            ⚠️ Only 5 minutes remaining!
          </p>
        </div>
      )}

      {/* Save Status */}
      {saveStatus === "saving" && (
        <div className={`${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border-b px-6 py-2`}>
          <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'} text-center`}>
            💾 Saving...
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Question Navigation */}
        <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r min-h-screen p-6`}>
          <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Question Navigation
          </h2>
          
          {/* Question Grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {filteredQuestionIndices.map((index) => {
              const q = exam.questions[index];
              const qId = q._id || q.id;
              const status = getQuestionStatus(q);
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-12 h-12 rounded-lg font-medium text-sm transition-colors ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : status.isAnswered
                        ? darkMode ? 'bg-green-700 text-white' : 'bg-green-200 text-green-800'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  } ${status.isFlagged ? 'ring-2 ring-red-500' : ''}`}
                  title={`Question ${index + 1}${status.isFlagged ? ' (Flagged)' : ''}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          
          {/* Filters */}
          <div className="space-y-3 mb-6 pt-6 border-t border-gray-200">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.answered}
                onChange={(e) => setFilters(prev => ({ ...prev, answered: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Answered
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.flagged}
                onChange={(e) => setFilters(prev => ({ ...prev, flagged: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Flagged
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.notAnswered}
                onChange={(e) => setFilters(prev => ({ ...prev, notAnswered: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Not answered
              </span>
            </label>
          </div>
          
          {/* Review & Submit Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you ready to review and submit your exam?')) {
                // Navigate to last question or show review modal
                setCurrentQuestion(exam.questions.length - 1);
              }
            }}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Review & Submit
          </button>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Question {currentQuestion + 1} of {exam.questions.length}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {question.type === 'multiple-choice' ? 'MULTIPLE CHOICE' : 
                   question.type === 'true-false' ? 'TRUE/FALSE' :
                   question.type === 'short-answer' ? 'SHORT ANSWER' :
                   question.type === 'essay' ? 'ESSAY' : 
                   question.type.toUpperCase()}
                </span>
              </div>
              
              {/* Flag Button */}
              <button
                onClick={() => toggleFlag(questionId)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isFlagged 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>🚩</span>
                <span className="text-sm font-medium">Flag</span>
              </button>
            </div>

            {/* Question Content */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6 mb-6`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                {question.question || question.text}
              </h2>
              
              {/* Multiple Choice */}
              {question.type === 'multiple-choice' && (
                <div className="space-y-3">
                  {(question.options || []).map((option, index) => {
                    const optionValue = option.value || option.text || option;
                    const optionText = option.text || option;
                    
                    return (
                      <label 
                        key={index} 
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          answers[questionId] === optionValue
                            ? 'border-blue-600 bg-blue-50'
                            : darkMode 
                              ? 'border-gray-600 hover:border-gray-500 bg-gray-700' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${questionId}`}
                          value={optionValue}
                          checked={answers[questionId] === optionValue}
                          onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                          className="w-5 h-5 text-blue-600 mt-0.5"
                        />
                        <span className={`flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {optionText}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {question.type === 'true-false' && (
                <div className="space-y-3">
                  {['true', 'false'].map((value) => (
                    <label 
                      key={value}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        answers[questionId] === value
                          ? 'border-blue-600 bg-blue-50'
                          : darkMode 
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${questionId}`}
                        value={value}
                        checked={answers[questionId] === value}
                        onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} capitalize`}>
                        {value}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {question.type === 'short-answer' && (
                <div>
                  <input
                    type="text"
                    value={answers[questionId] || ''}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your answer here..."
                    maxLength={200}
                  />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    {answers[questionId]?.length || 0} / 200 characters
                  </p>
                </div>
              )}

              {/* Essay */}
              {question.type === 'essay' && (
                <div>
                  <textarea
                    value={answers[questionId] || ''}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    className={`w-full h-48 p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your answer here... (250-500 words)"
                  />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    {answers[questionId]?.trim().split(/\s+/).filter(w => w).length || 0} words (Required: 250-500)
                  </p>
                </div>
              )}

              {/* Coding Question */}
              {question.type === 'coding' && (
                <div>
                  <textarea
                    value={answers[questionId] || ''}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    className={`w-full h-64 p-3 border-2 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode 
                        ? 'bg-gray-900 border-gray-600 text-green-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    placeholder="// Write your code here..."
                  />
                </div>
              )}
              
              {/* Validation Error */}
              {validationErrors[questionId] && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">⚠️ {validationErrors[questionId]}</p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentQuestion === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
                    : darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isAnswered ? 'Answered' : 'Not answered'}
              </div>

              {currentQuestion === exam.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Exam"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;
