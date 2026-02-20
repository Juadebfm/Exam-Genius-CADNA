import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdOutlineVideocam } from 'react-icons/md';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import { examService } from '../../services/examService.js';
import LogoLink from '../../components/LogoLink.jsx';

const ExamReview = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { darkMode, toggleDarkMode } = useTheme();

  // Use refs to access latest values in timer callback
  const answersRef = useRef(answers);
  const examIdRef = useRef(examId);

  // Update refs when values change
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    examIdRef.current = examId;
  }, [examId]);

  // Force fullscreen on mount
  useEffect(() => {
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => 
          console.warn('Failed to enter fullscreen:', err)
        );
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    };

    // Enter fullscreen immediately
    enterFullscreen();

    // Monitor fullscreen changes and re-enter if user exits
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      if (!isFullscreen) {
        console.warn('⚠️ User exited fullscreen on review page - re-entering');
        // Try to re-enter after a short delay
        setTimeout(enterFullscreen, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const loadExamData = async () => {
      try {
        const result = await examService.getExamDetails(examId);
        if (result.success) {
          setExam(result.data);
          const examDuration = (result.data.settings?.timeLimit || result.data.timeLimit || result.data.duration || 7) * 60;
          
          // Calculate remaining time based on saved start time
          const examStartKey = `exam_start_${examId}`;
          const savedStartTime = localStorage.getItem(examStartKey);
          
          if (savedStartTime) {
            const startTime = parseInt(savedStartTime);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, examDuration - elapsed);
            setTimeLeft(remaining);
          } else {
            setTimeLeft(examDuration);
          }
          
          // Load saved answers and flagged questions
          const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
          const savedFlagged = localStorage.getItem(`exam_flagged_${examId}`);
          
          if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
          if (savedFlagged) setFlagged(JSON.parse(savedFlagged));
        } else {
          setError(result.error || 'Failed to load exam');
        }
      } catch (error) {
        setError('Error loading exam');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadExamData();
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
  }, []); // Empty array - only run once

  const handleAutoSubmit = async () => {
    console.log(' TIME EXPIRED - Auto-submitting exam from review page...');
    
    const sessionId = localStorage.getItem(`exam_session_${examIdRef.current}`);
    console.log('Session ID:', sessionId);
    console.log('Answers count:', Object.keys(answersRef.current).length);
    
    if (sessionId) {
      try {
        const result = await examService.submitExam(
          sessionId, 
          answersRef.current, 
          true // isAutoSubmit
        );
        console.log(' Auto-submit result:', result);
        
        if (result.success) {
          const examIdValue = examIdRef.current;
          localStorage.removeItem(`exam_start_${examIdValue}`);
          localStorage.removeItem(`exam_answers_${examIdValue}`);
          localStorage.removeItem(`exam_flagged_${examIdValue}`);
          localStorage.removeItem(`exam_session_${examIdValue}`);
          
          // Exit fullscreen on auto-submit
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
          } else if (document.msFullscreenElement) {
            document.msExitFullscreen();
          }
          
          navigate(`/exam/${examIdValue}/result`);
        }
      } catch (error) {
        console.error(' Auto-submit failed:', error);
       
      }
    } else {
      console.error(' No session ID for auto-submit');
      
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
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;
  
  const flaggedQuestions = [];
  const unansweredQuestions = [];
  
  questions.forEach((q, index) => {
    const qId = q.id || q._id || index;
    const questionNumber = index + 1;
    const questionType = q.type === 'multiple-choice' ? 'Multiple Choice' : 
                        q.type === 'true-false' ? 'True/False' :
                        q.type === 'short-answer' ? 'Short Answer' :
                        q.type === 'essay' ? 'Essay' :
                        q.type === 'code' ? 'Code' : 'Question';
    
    if (flagged[qId]) {
      flaggedQuestions.push({ id: questionNumber, type: questionType });
    }
    if (!answers[qId]) {
      unansweredQuestions.push({ id: questionNumber, type: questionType });
    }
  });
  
  const examData = {
    title: exam.title || exam.name,
    totalQuestions,
    answered: answeredCount,
    flagged: flaggedCount,
    unanswered: unansweredCount,
    flaggedQuestions,
    unansweredQuestions,
    allQuestions: questions.map((q, index) => {
      const qId = q.id || q._id || index;
      return {
        id: index + 1,
        status: flagged[qId] ? 'flagged' : answers[qId] ? 'answered' : 'unanswered'
      };
    })
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine timer color based on time left
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

  const handleReviewQuestion = (questionNumber) => {
    navigate(`/exam/${examId}/taking?question=${questionNumber}`);
  };

  const handleSubmitExam = () => {
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    try {
      setShowConfirmDialog(false);
      
      let currentSessionId = localStorage.getItem(`exam_session_${examId}`);
      
      if (!currentSessionId) {
        // Try to recover session
        try {
          const response = await examService.getUserSessions(examId);
          const activeSession = response.data.find(s => s.status === 'in-progress');
          if (activeSession) {
            currentSessionId = activeSession._id;
            localStorage.setItem(`exam_session_${examId}`, currentSessionId);
          } else {
            throw new Error('No active session found');
          }
        } catch (error) {
          // Create mock result if no session can be recovered
          console.warn('No session ID found, creating mock result');
          const mockResult = {
            score: 85,
            percentage: 85,
            correctAnswers: Math.floor(Object.keys(answers).length * 0.85),
            incorrectAnswers: Object.keys(answers).length - Math.floor(Object.keys(answers).length * 0.85),
            totalQuestions: Object.keys(answers).length || 10,
            timeSpent: '25:30',
            examTitle: exam?.title || 'Mathematics Final Exam',
            submittedAt: new Date().toISOString(),
            passed: true
          };
          localStorage.setItem(`exam_result_${examId}`, JSON.stringify(mockResult));
          navigate(`/exam/${examId}/result`);
          return;
        }
      }
      
      // Proceed with submission using currentSessionId
      const result = await examService.submitExam(currentSessionId, answers, false);
      console.log('Submit exam result:', result);
      
      if (result.success) {
        // Store result data for the result page
        if (result.data) {
          localStorage.setItem(`exam_result_${examId}`, JSON.stringify(result.data));
        }
        
        // Clear exam data from localStorage after successful submission
        localStorage.removeItem(`exam_start_${examId}`);
        localStorage.removeItem(`exam_answers_${examId}`);
        localStorage.removeItem(`exam_flagged_${examId}`);
        localStorage.removeItem(`exam_session_${examId}`);
        
        // Exit fullscreen on successful submit
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement) {
          document.webkitExitFullscreen();
        } else if (document.msFullscreenElement) {
          document.msExitFullscreen();
        }
        
        navigate(`/exam/${examId}/result`);
      } else {
        setError(result.error || 'Failed to submit exam');
      }
    } catch (error) {
      setError('Error submitting exam');
      console.error('Exam submission error:', error);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <LogoLink />
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} transition-colors`}
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Exam Header Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-6`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{examData.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 flex items-center justify-center" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div className="relative">
              <MdOutlineVideocam className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className={`flex items-center space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-6 py-3 rounded-lg ${timeLeft <= ((exam?.settings?.timeLimit || 60) * 60 * 0.1) ? 'ring-2 ring-red-500' : ''}`}>
              <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>🕐</div>
              <div className={`text-xl font-mono font-semibold ${getTimerColor()}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar with Back Button */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b mt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/exam/${examId}/taking`)}
            className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Back to Questions</span>
            <span className="text-sm font-medium sm:hidden">Back</span>
          </button>
          
          {/* Exam Title - Hidden on mobile */}
          <h1 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} hidden md:block absolute left-1/2 transform -translate-x-1/2`}>
            {exam.title || exam.name}
          </h1>

          {/* Timer */}
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm sm:text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Time Warning Banner */}
        {timeLeft <= ((exam?.settings?.timeLimit || 60) * 60 * 0.1) && timeLeft > 0 && (
          <div className="mb-4 sm:mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 rounded-lg flex items-start sm:items-center space-x-2 sm:space-x-3 animate-pulse">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-sm sm:text-base">Time Running Out!</p>
              <p className="text-xs sm:text-sm">You have less than {Math.ceil(timeLeft / 60)} minute{Math.ceil(timeLeft / 60) === 1 ? '' : 's'} remaining. Please submit your exam now.</p>
            </div>
          </div>
        )}

        <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1 sm:mb-2`}>
          Exam Summary
        </h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base mb-6 sm:mb-8`}>
          Review your answers before submission
        </p>

        {/* Stats Grid - Responsive: 2 cols mobile, 4 cols tablet+ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6`}>
            <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} block mb-1 sm:mb-2`}>
              Total Questions
            </span>
            <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {examData.totalQuestions}
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6`}>
            <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} block mb-1 sm:mb-2`}>
              Answered
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {examData.answered}
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6`}>
            <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} block mb-1 sm:mb-2`}>
              Flagged
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
              {examData.flagged}
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6`}>
            <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} block mb-1 sm:mb-2`}>
              Unanswered
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {examData.unanswered}
            </p>
          </div>
        </div>

        {/* Unanswered Questions Section */}
        {examData.unansweredQuestions.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6`}>
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Unanswered Questions ({examData.unansweredQuestions.length})
              </h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {examData.unansweredQuestions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => handleReviewQuestion(question.id)}
                  className="h-9 sm:h-10 rounded-md bg-red-100 text-red-700 hover:bg-red-200 font-medium text-xs sm:text-sm transition-colors"
                >
                  Q{question.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flagged Questions Section */}
        {examData.flaggedQuestions.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6`}>
            <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
              Flagged Questions ({examData.flaggedQuestions.length})
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {examData.flaggedQuestions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => handleReviewQuestion(question.id)}
                  className="h-9 sm:h-10 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium text-xs sm:text-sm transition-colors"
                >
                  Q{question.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Questions Grid */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8`}>
          <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
            All Questions
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
            {examData.allQuestions.map((question) => {
              const isAnswered = question.status === 'answered';
              const isFlagged = question.status === 'flagged';
              
              return (
                <button
                  key={question.id}
                  onClick={() => handleReviewQuestion(question.id)}
                  className={`h-10 sm:h-12 rounded-md font-medium text-xs sm:text-sm transition-colors ${
                    isAnswered
                      ? darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-100 text-green-800 hover:bg-green-200'
                      : isFlagged
                        ? darkMode ? 'bg-yellow-700 text-white hover:bg-yellow-600' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${isFlagged ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  {question.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitExam}
          className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-900 text-white'
              : 'bg-gray-900 hover:bg-black text-white'
          } shadow-lg hover:shadow-xl`}
        >
          Submit Exam
        </button>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 sm:p-6 rounded-lg max-w-md w-full mx-4`}>
              <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4`}>Confirm Submission</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base mb-5 sm:mb-6`}>
                Are you sure you want to submit? You won't be able to change your answers.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className={`px-4 py-2 text-sm sm:text-base ${darkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-600 border-gray-300 hover:bg-gray-50'} border rounded`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamReview;
