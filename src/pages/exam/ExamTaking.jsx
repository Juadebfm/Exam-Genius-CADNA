import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiFlag } from 'react-icons/fi';
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
  const [savingStatus, setSavingStatus] = useState(''); // 'saving', 'saved', ''
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
    enabled: true, // Enable monitoring
    onIntegrityEvent: async (event) => {
      // Log to backend
      if (sessionId) {
        await examMonitoringService.logIntegrityEvent(sessionId, event);
      }
    }
  });

  // Session recovery function
  const recoverSession = async () => {
    try {
      const response = await examService.getUserSessions(examId);
      const sessions = Array.isArray(response.data) ? response.data : response.data?.sessions || [];
      const activeSession = sessions.find(s => s.status === 'in-progress');
      if (activeSession) {
        setSessionId(activeSession._id);
        localStorage.setItem(`exam_session_${examId}`, activeSession._id);
        return activeSession;
      }
    } catch (error) {
      console.warn('Session recovery failed:', error);
    }
    return null;
  };

  useEffect(() => {
    const initializeExam = async () => {
      try {
        // Start new session first to get session ID
        const startResult = await examService.startExam(examId);
        if (startResult.success) {
          const newSessionId = startResult.data._id || startResult.data.sessionId;
          setSessionId(newSessionId);
          localStorage.setItem(`exam_session_${examId}`, newSessionId);
          
          // Get full exam data from session endpoint
          const sessionResult = await examService.getExamSession(newSessionId);
          if (sessionResult.success) {
            setExam(sessionResult.data.exam || sessionResult.data);
            const examDuration = (sessionResult.data.exam?.settings?.timeLimit || sessionResult.data.exam?.timeLimit || sessionResult.data.exam?.duration || 60) * 60;
            
            // Handle timer logic
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
            
            // Load saved answers and flagged questions
            const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
            const savedFlagged = localStorage.getItem(`exam_flagged_${examId}`);
            
            if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
            if (savedFlagged) setFlagged(JSON.parse(savedFlagged));
          }
        }
      } catch (error) {
        setError('Error loading exam');
        console.error('Exam initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      initializeExam();
    }
  }, [examId]);

  // Timer countdown effect with auto-submit
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          // Time expired - auto-submit
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty array - only run once on mount

  const handleAutoSubmit = async () => {
    console.log('⏰ TIME EXPIRED - Auto-submitting exam...');
    console.log('Session ID:', sessionIdRef.current);
    console.log('Answers count:', Object.keys(answersRef.current).length);
    
    if (!sessionIdRef.current) {
      console.error('❌ No session ID for auto-submit');
      alert('Time expired! No active session found. Please contact support.');
      return;
    }
    
    try {
      const result = await examService.submitExam(
        sessionIdRef.current, 
        answersRef.current, 
        true // isAutoSubmit
      );
      console.log('✅ Auto-submit result:', result);
      
      if (result.success) {
        // Clear exam data
        const examIdValue = examIdRef.current;
        localStorage.removeItem(`exam_start_${examIdValue}`);
        localStorage.removeItem(`exam_answers_${examIdValue}`);
        localStorage.removeItem(`exam_flagged_${examIdValue}`);
        localStorage.removeItem(`exam_session_${examIdValue}`);
        
        alert('Time expired! Your exam has been automatically submitted.');
        navigate(`/exam/${examIdValue}/result`);
      } else {
        console.error('❌ Auto-submit failed:', result.error);
        setError('Time expired. Exam auto-submitted but there was an error.');
        alert('Time expired! Submission failed. Please try manual submit.');
      }
    } catch (error) {
      console.error('❌ Auto-submit error:', error);
      setError('Time expired. Please submit your exam manually.');
      alert('Time expired! Please click Submit manually.');
    }
  };

  // Auto-sync timer - Save answers every 30 seconds
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
          console.log('✅ Auto-saved answers:', answersArray.length);
        } catch (error) {
          console.warn('❌ Auto-save failed, will retry');
        }
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [sessionId, answers]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine timer color based on time left
  const getTimerColor = () => {
    const totalDuration = (exam?.settings?.timeLimit || exam?.timeLimit || 60) * 60; // in seconds
    const percentageLeft = (timeLeft / totalDuration) * 100;
    
    if (percentageLeft <= 10) {
      return 'text-red-600 animate-pulse'; // Last 10% - Red and pulsing
    } else if (percentageLeft <= 25) {
      return 'text-orange-500'; // Last 25% - Orange warning
    }
    return darkMode ? 'text-white' : 'text-gray-900'; // Normal
  };

  const saveAnswer = async (questionId, answer, timeSpent = 0) => {
    // Save locally first (instant)
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(newAnswers));
    
    setSavingStatus('saving');
    console.log(`💾 Saving answer for question ${questionId}:`, answer);
    
    // Sync to backend immediately (background)
    if (sessionId) {
      try {
        await examService.submitAnswer(sessionId, questionId, answer, timeSpent);
        console.log(`✅ Answer synced to server for question ${questionId}`);
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus(''), 2000); // Clear after 2 seconds
      } catch (error) {
        console.warn(`❌ Answer sync failed for question ${questionId}, saved locally. Will retry in 30s.`);
        setSavingStatus('error');
        setTimeout(() => setSavingStatus(''), 3000);
      }
    } else {
      console.warn('⚠️ No session ID yet, answer saved locally only');
      setSavingStatus('local');
      setTimeout(() => setSavingStatus(''), 2000);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    // Check if answer actually changed
    const previousAnswer = answers[questionId];
    if (previousAnswer === answer) {
      console.log('ℹ️ Same answer selected, skipping save');
      return;
    }
    
    console.log(`🔄 Answer changed from "${previousAnswer}" to "${answer}"`);
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
    try {
      if (!sessionId) {
        console.error('No session ID found for auto-submit');
        return;
      }
      
      const result = await examService.submitExam(sessionId, answers, true);
      if (result.success) {
        // Clear exam data
        localStorage.removeItem(`exam_start_${examId}`);
        localStorage.removeItem(`exam_answers_${examId}`);
        localStorage.removeItem(`exam_flagged_${examId}`);
        localStorage.removeItem(`exam_session_${examId}`);
        
        navigate(`/exam/${examId}/result`);
      } else {
        setError(result.error || 'Failed to submit exam');
      }
    } catch (error) {
      setError('Error submitting exam');
      console.error('Exam submission error:', error);
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
  const isLastQuestion = currentQuestion === questions.length - 1;

  // Show message if no questions available
  if (questions.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>No questions available for this exam.</p>
          <button onClick={() => navigate('/student')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show message if current question is not available
  if (!currentQ) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Question not found.</p>
          <button onClick={() => navigate('/student')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getWordCount = (text) => {
    return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  };

  const getVisibleQuestionNumbers = () => {
    const groupSize = 3;
    const currentGroup = Math.floor(currentQuestion / groupSize);
    const startIndex = currentGroup * groupSize;
    const endIndex = Math.min(startIndex + groupSize, questions.length);
    return questions.slice(startIndex, endIndex).map((_, index) => startIndex + index);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
     
      <ExamHeader darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />

      {/* Exam Header Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-6 mt-16`}>
        <div className="flex items-center justify-between">
          {/* Exam Title - Left */}
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{exam.title || exam.name}</h1>
          
          {/* Icons - Right */}
          <div className="flex items-center space-x-4">
            {/* Red Triangle Warning Icon */}
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 flex items-center justify-center" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            {/* CCTV Camera Icon with Green Dot */}
            <div className="relative">
              <MdOutlineVideocam className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            {/* Violation Counter */}
            {totalViolations > 0 && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                totalViolations >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{totalViolations} violation{totalViolations !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Fullscreen Status */}
            {!isFullscreen && (
              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Not in fullscreen</span>
              </div>
            )}

            {/* Auto-Save Indicator */}
            {savingStatus && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm ${
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
                    <span>Saved</span>
                  </>
                )}
                {savingStatus === 'saving' && (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                )}
                {savingStatus === 'error' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Saved locally</span>
                  </>
                )}
                {savingStatus === 'local' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    <span>Local save</span>
                  </>
                )}
              </div>
            )}
            {/* Timer */}
            <div className={`flex items-center space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-6 py-3 rounded-lg ${timeLeft <= ((exam?.settings?.timeLimit || 60) * 60 * 0.1) ? 'ring-2 ring-red-500' : ''}`}>
              <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>🕐</div>
              <div className={`text-xl font-mono font-semibold ${getTimerColor()}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Time Warning Banner */}
        {timeLeft <= ((exam?.settings?.timeLimit || 60) * 60 * 0.1) && timeLeft > 0 && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center space-x-3 animate-pulse">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Time Running Out!</p>
              <p className="text-sm">You have less than {Math.ceil(timeLeft / 60)} minute{Math.ceil(timeLeft / 60) === 1 ? '' : 's'} remaining. Please complete your exam.</p>
            </div>
          </div>
        )}

        {/* Question Navigation Section */}
        <div className="flex items-center justify-start mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} disabled:opacity-50 mr-3`}
          >
            <FiChevronLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
          
          <div className="flex items-center space-x-2 mr-3">
            {getVisibleQuestionNumbers().map((questionIndex) => (
              <button
                key={questionIndex}
                onClick={() => setCurrentQuestion(questionIndex)}
                className={`w-12 h-12 rounded-lg border font-medium text-lg ${
                  questionIndex === currentQuestion
                    ? 'bg-blue-600 text-white border-blue-600'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {questionIndex + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentQuestion === questions.length - 1}
            className={`p-2 rounded-lg border ${darkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-100 border-blue-300'} disabled:opacity-50`}
          >
            <FiChevronRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>



        {/* Flag Section */}
        <div className={`flex items-center justify-between mb-6 p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
          <div className="flex items-center space-x-4">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
              {currentQuestion + 1} of {questions.length}
            </span>
            <div className={`px-3 py-1 rounded-full border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} text-sm`}>
              {currentQ.type === 'multiple-choice' ? 'Multiple Choice' : 
               currentQ.type === 'true-false' ? 'True/False' :
               currentQ.type === 'short-answer' ? 'Short Answer' :
               currentQ.type === 'essay' ? 'Essay' :
               currentQ.type === 'code' ? 'Code' : 'Question'}
            </div>
          </div>
          
          <button
            onClick={() => handleFlagToggle(currentQ.id || currentQ._id || currentQuestion)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-medium transition-colors ${
              flagged[currentQ.id || currentQ._id || currentQuestion]
                ? 'bg-red-100 border-red-300 text-red-700'
                : darkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiFlag className="w-4 h-4" />
            <span>Flag</span>
          </button>
        </div>

        {/* Main Question Panel */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} p-6 rounded-lg mb-6`}>
          <div className="mb-6">
            <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>{currentQ.text || currentQ.question || currentQ.title || 'Question text not available'}</h2>
            
            {/* Multiple Choice Questions */}
            {(currentQ.type === 'multiple-choice' || currentQ.type === 'true-false') && (
              <div className="space-y-3">
                {(currentQ.options || (currentQ.type === 'true-false' ? ['True', 'False'] : [])).map((option, index) => {
                  const optionText = typeof option === 'string' ? option : option.text;
                  const optionValue = typeof option === 'string' ? option : option.text;
                  return (
                    <label key={index} className={`flex items-center space-x-3 cursor-pointer p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'} rounded-lg border`}>
                      <input
                        type="radio"
                        name={`question-${currentQ.id || currentQ._id || currentQuestion}`}
                        value={optionValue}
                        checked={answers[currentQ.id || currentQ._id || currentQuestion] === optionValue}
                        onChange={() => handleAnswerSelect(currentQ.id || currentQ._id || currentQuestion, optionValue)}
                        className="h-5 w-5 text-blue-600"
                      />
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{optionText}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Text-based Questions */}
            {(currentQ.type === 'essay' || currentQ.type === 'short-answer' || currentQ.type === 'code') && (
              <div>
                <textarea
                  value={answers[currentQ.id || currentQ._id || currentQuestion] || ''}
                  onChange={(e) => handleAnswerSelect(currentQ.id || currentQ._id || currentQuestion, e.target.value)}
                  className={`w-full p-4 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    currentQ.type === 'short-answer' ? 'h-24' : 
                    currentQ.type === 'code' ? 'h-64 font-mono' : 'h-48'
                  }`}
                  placeholder={
                    currentQ.type === 'short-answer' ? 'Type your short answer here' :
                    currentQ.type === 'code' ? 'Write your code here' :
                    'Type your answer here'
                  }
                />
                <div className={`flex justify-end mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentQ.type === 'essay' && (
                    <span>Word count: {getWordCount(answers[currentQ.id || currentQ._id || currentQuestion])} | Min. 250 words | Max. 500 words</span>
                  )}
                  {currentQ.type === 'short-answer' && (
                    <span>Word count: {getWordCount(answers[currentQ.id || currentQ._id || currentQuestion])} | Max. 50 words</span>
                  )}
                  {currentQ.type === 'code' && (
                    <span>Characters: {(answers[currentQ.id || currentQ._id || currentQuestion] || '').length}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          {currentQuestion > 0 && (
            <button
              onClick={handlePrevious}
              className={`px-12 py-3 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
          )}
          
          <button
            onClick={isLastQuestion ? () => navigate(`/exam/${examId}/summary`) : handleNext}
            className="px-12 py-3 rounded-lg font-medium transition-colors ml-auto bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLastQuestion ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;
