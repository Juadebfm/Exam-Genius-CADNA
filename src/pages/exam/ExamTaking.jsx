import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdOutlineVideocam } from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext.jsx';
import ExamHeader from '../../components/Layout/ExamHeader.jsx';
import { examService } from '../../services/examService.js';
import { useExamMonitoring } from '../../hooks/useExamMonitoring.js';
import { examMonitoringService } from '../../services/examMonitoringService.js';

const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [exam, setExam] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStatus, setSavingStatus] = useState('');
  const { darkMode, toggleDarkMode } = useTheme();

  // Use refs to access latest values in timer callback
  const sessionIdRef = useRef(sessionId);
  const answersRef = useRef(answers);
  const examIdRef = useRef(examId);

  // Update refs when values change
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    examIdRef.current = examId;
  }, [examId]);

  // Anti-cheating monitoring
  const { isFullscreen, violations, totalViolations } = useExamMonitoring({
    sessionId,
    examId,
    enabled: true,
    onIntegrityEvent: async (event) => {
      if (sessionIdRef.current) {
        try {
          await examMonitoringService.logIntegrityEvent(sessionIdRef.current, event);
        } catch (error) {
          // Silently fail - violations logged locally
        }
      }
    }
  });

  // Initialize exam
  useEffect(() => {
    const initializeExam = async () => {
      try {
        const startResult = await examService.startExam(examId);
        if (startResult.success) {
          const newSessionId = startResult.data._id || startResult.data.sessionId;
          setSessionId(newSessionId);
          localStorage.setItem(`exam_session_${examId}`, newSessionId);
          
          const sessionResult = await examService.getExamSession(newSessionId);
          if (sessionResult.success) {
            setExam(sessionResult.data.exam || sessionResult.data);
            const examDuration = (sessionResult.data.exam?.settings?.timeLimit || sessionResult.data.exam?.timeLimit || sessionResult.data.exam?.duration || 60) * 60;
            
            const examStartKey = `exam_start_${examId}`;
            const savedStartTime = localStorage.getItem(examStartKey);
            
            if (savedStartTime) {
              const startTime = parseInt(savedStartTime);
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              const remaining = Math.max(0, examDuration - elapsed);
              setTimeLeft(remaining);
            } else {
              localStorage.setItem(examStartKey, Date.now().toString());
              setTimeLeft(examDuration);
            }
            
            const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
            const savedFlagged = localStorage.getItem(`exam_flagged_${examId}`);
            
            if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
            if (savedFlagged) setFlagged(JSON.parse(savedFlagged));
            
            const urlParams = new URLSearchParams(window.location.search);
            const questionParam = urlParams.get('question');
            if (questionParam) {
              const questionIndex = parseInt(questionParam) - 1;
              if (!isNaN(questionIndex) && questionIndex >= 0) {
                setCurrentQuestion(questionIndex);
              }
            }
          }
        }
      } catch (error) {
        setError('Error loading exam');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      initializeExam();
    }
  }, [examId]);

  // Timer countdown with auto-submit
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoSubmit = async () => {
    if (!sessionIdRef.current) return;
    
    try {
      const result = await examService.submitExam(sessionIdRef.current, answersRef.current, true);
      
      if (result.success) {
        const examIdValue = examIdRef.current;
        localStorage.removeItem(`exam_start_${examIdValue}`);
        localStorage.removeItem(`exam_answers_${examIdValue}`);
        localStorage.removeItem(`exam_flagged_${examIdValue}`);
        localStorage.removeItem(`exam_session_${examIdValue}`);
        
        navigate(`/exam/${examIdValue}/result`);
      }
    } catch (error) {
      // Auto-submit failed
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (sessionId && Object.keys(answers).length > 0) {
        try {
          const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
            questionId, 
            answer, 
            timeSpent: 0
          }));
          await examService.syncAnswers(sessionId, answersArray);
        } catch (error) {
          // Auto-save failed, will retry
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [sessionId, answers]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const totalDuration = (exam?.settings?.timeLimit || exam?.timeLimit || 60) * 60;
    const percentageLeft = (timeLeft / totalDuration) * 100;
    
    if (percentageLeft <= 10) {
      return 'text-red-600 animate-pulse';
    } else if (percentageLeft <= 25) {
      return 'text-orange-500';
    }
    return darkMode ? 'text-white' : 'text-gray-900';
  };

  const saveAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(newAnswers));
    
    setSavingStatus('saving');
    
    if (sessionId) {
      try {
        await examService.submitAnswer(sessionId, questionId, answer, 0);
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus(''), 2000);
      } catch (error) {
        setSavingStatus('error');
        setTimeout(() => setSavingStatus(''), 3000);
      }
    } else {
      setSavingStatus('local');
      setTimeout(() => setSavingStatus(''), 2000);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    const previousAnswer = answers[questionId];
    if (previousAnswer === answer) return;
    
    saveAnswer(questionId, answer);
  };

  const handleFlagToggle = (questionId) => {
    const newFlagged = { ...flagged, [questionId]: !flagged[questionId] };
    setFlagged(newFlagged);
    localStorage.setItem(`exam_flagged_${examId}`, JSON.stringify(newFlagged));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitExam = async () => {
    const confirmSubmit = window.confirm(
      'Are you sure you want to submit your exam? You cannot change your answers after submission.'
    );
    if (!confirmSubmit) return;
    
    try {
      if (!sessionId) return;
      
      const result = await examService.submitExam(sessionId, answers, false);
      if (result.success) {
        localStorage.removeItem(`exam_start_${examId}`);
        localStorage.removeItem(`exam_answers_${examId}`);
        localStorage.removeItem(`exam_flagged_${examId}`);
        localStorage.removeItem(`exam_session_${examId}`);
        
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        
        navigate(`/exam/${examId}/result`);
      }
    } catch (error) {
      // Submission failed
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Exam not found'}</p>
          <button onClick={() => navigate('/student')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = exam.questions || [];
  const currentQ = questions[currentQuestion];

  if (questions.length === 0 || !currentQ) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>No questions available.</p>
          <button onClick={() => navigate('/student')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isAnswered = answers[currentQ.id || currentQ._id] && answers[currentQ.id || currentQ._id].toString().trim() !== '';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ExamHeader darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />

      {/* Top Bar with Exam Title + Icons + Timer */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b mt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
              {exam.title || exam.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto justify-end">
            <div className="hidden sm:flex w-5 h-5 sm:w-6 sm:h-6 items-center justify-center" title="Monitored exam">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="relative" title="Webcam monitoring active">
              <MdOutlineVideocam className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {totalViolations > 0 && (
              <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md ${
                totalViolations >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">{totalViolations} violation{totalViolations !== 1 ? 's' : ''}</span>
              </div>
            )}

            {!isFullscreen && (
              <div className="bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold hidden sm:inline">Not fullscreen</span>
              </div>
            )}

            {savingStatus && (
              <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium ${
                savingStatus === 'saved' ? 'bg-green-100 text-green-700' :
                savingStatus === 'saving' ? 'bg-blue-100 text-blue-700' :
                savingStatus === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {savingStatus === 'saved' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Saved</span>
                  </>
                )}
                {savingStatus === 'saving' && (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                )}
                {savingStatus === 'error' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Saved locally</span>
                  </>
                )}
                {savingStatus === 'local' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    <span className="hidden sm:inline">Saved locally</span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm sm:text-base font-medium ${getTimerColor()}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Question Navigation */}
      <div className={`lg:hidden px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} border-b flex items-center justify-between`}>
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-3 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          ← Prev
        </button>
        
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Question {currentQuestion + 1} / {questions.length}
        </span>
        
        <button
          onClick={handleNext}
          disabled={currentQuestion === questions.length - 1}
          className="px-3 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Next →
        </button>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar - Desktop Only */}
        <div className={`hidden lg:block w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r p-6`}>
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4 uppercase tracking-wide`}>
            Question Navigation
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {questions.map((q, index) => {
              const qId = q.id || q._id;
              const isCurrentQuestion = index === currentQuestion;
              const isQuestionAnswered = answers[qId] && answers[qId].toString().trim() !== '';
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-12 rounded-md font-medium text-sm transition-colors ${
                    isCurrentQuestion
                      ? 'bg-blue-600 text-white'
                      : isQuestionAnswered
                        ? darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className={`pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
              Review & Submit
            </h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Answered</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Flagged</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Not answered</span>
              </label>
            </div>

            <button
              onClick={() => navigate(`/exam/${examId}/summary`)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm font-medium transition-colors"
            >
              Review & Submit
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold uppercase ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {currentQ.type === 'multiple-choice' ? 'MULTIPLE CHOICE' :
                 currentQ.type === 'true-false' ? 'TRUE/FALSE' :
                 currentQ.type === 'essay' ? 'ESSAY' :
                 currentQ.type === 'short-answer' ? 'SHORT ANSWER' :
                 currentQ.type || 'QUESTION'}
              </span>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!flagged[currentQ.id || currentQ._id]}
                onChange={() => handleFlagToggle(currentQ.id || currentQ._id)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Flag Question
              </span>
            </label>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6`}>
            <h2 className={`text-base sm:text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6 lg:mb-8`}>
              {currentQ.text || currentQ.question || currentQ.title || 'Question text not available'}
            </h2>

            {(currentQ.type === 'multiple-choice' || currentQ.type === 'true-false') && (
              <div className="space-y-2 sm:space-y-3">
                {(currentQ.options || (currentQ.type === 'true-false' ? ['True', 'False'] : [])).map((option, index) => {
                  const optionText = typeof option === 'string' ? option : option.text;
                  const optionValue = typeof option === 'string' ? option : option.value || option.text;
                  const qId = currentQ.id || currentQ._id;
                  const isSelected = answers[qId] === optionValue;
                  
                  return (
                    <label
                      key={index}
                      className={`flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : darkMode
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qId}`}
                        value={optionValue}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(qId, optionValue)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                      />
                      <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {(currentQ.type === 'essay' || currentQ.type === 'short-answer') && (
              <textarea
                value={answers[currentQ.id || currentQ._id] || ''}
                onChange={(e) => handleAnswerSelect(currentQ.id || currentQ._id, e.target.value)}
                className={`w-full p-3 sm:p-4 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base ${
                  currentQ.type === 'essay' ? 'h-48' : 'h-24'
                }`}
                placeholder="Type your answer here..."
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium transition-colors ${
                currentQuestion === 0
                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                  : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Previous
            </button>

            <span className={`text-xs sm:text-sm font-medium ${
              isAnswered
                ? darkMode ? 'text-green-400' : 'text-green-600'
                : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {isAnswered ? 'Answered' : 'Not answered'}
            </span>

            <button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium transition-colors ${
                currentQuestion === questions.length - 1
                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Review Button - Mobile Only */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate(`/exam/${examId}/summary`)}
          className={`px-6 py-3 rounded-full font-semibold text-sm shadow-lg transition-all ${
            darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } hover:shadow-xl flex items-center space-x-2`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span>Review</span>
        </button>
      </div>
    </div>
  );
};

export default ExamTaking;
