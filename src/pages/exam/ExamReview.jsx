import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdOutlineVideocam } from 'react-icons/md';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import { examService } from '../../services/examService.js';
import { useExamMonitoring } from '../../hooks/useExamMonitoring.js';
import { examMonitoringService } from '../../services/examMonitoringService.js';
import LogoLink from '../../components/LogoLink.jsx';
import { Card, LoadingSpinner, ViolationBadge, FullscreenWarning } from '../../components/shared';

// ─────────────────────────────────────────────
// Helpers — outside component, not recreated
// ─────────────────────────────────────────────
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const exitFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
  else if (document.msFullscreenElement) document.msExitFullscreen();
};




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
  const [sessionId, setSessionId] = useState(null);
  const { darkMode, toggleDarkMode } = useTheme();

  const answersRef   = useRef(answers);
  const examIdRef    = useRef(examId);
  const sessionIdRef = useRef(null);

  useEffect(() => { answersRef.current = answers; },   [answers]);
  useEffect(() => { examIdRef.current = examId; },     [examId]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const { isFullscreen, totalViolations } = useExamMonitoring({
    sessionId,
    examId,
    enabled: true,
    onIntegrityEvent: async (event) => {
      if (sessionIdRef.current) {
        await examMonitoringService.logIntegrityEvent(sessionIdRef.current, event);
      }
    },
  });

  // Fullscreen management
  useEffect(() => {
    const isAlready = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    if (!isAlready) {
      setTimeout(() => {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      }, 300);
    }

    const handleChange = () => {
      if (!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement)) {
        console.warn('⚠️ User exited fullscreen on review page');
      }
    };

    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(e =>
      document.addEventListener(e, handleChange)
    );
    return () => {
      ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(e =>
        document.removeEventListener(e, handleChange)
      );
    };
  }, []);

  useEffect(() => {
    const loadExamData = async () => {
      try {
        const result = await examService.getExamDetails(examId);
        if (result.success) {
          setExam(result.data);
          const duration = (result.data.settings?.timeLimit || result.data.timeLimit || result.data.duration || 7) * 60;
          const savedStart = localStorage.getItem(`exam_start_${examId}`);
          if (savedStart) {
            const elapsed = Math.floor((Date.now() - parseInt(savedStart)) / 1000);
            setTimeLeft(Math.max(0, duration - elapsed));
          } else {
            setTimeLeft(duration);
          }

          const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
          const savedFlagged = localStorage.getItem(`exam_flagged_${examId}`);
          if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
          if (savedFlagged) setFlagged(JSON.parse(savedFlagged));

          const storedSession = localStorage.getItem(`exam_session_${examId}`);
          if (storedSession) {
            setSessionId(storedSession);
            sessionIdRef.current = storedSession;
          }
        } else {
          setError(result.error || 'Failed to load exam');
        }
      } catch {
        setError('Error loading exam');
      } finally {
        setLoading(false);
      }
    };

    if (examId) loadExamData();
  }, [examId]);

  //  useCallback — stable auto-submit
  const handleAutoSubmit = useCallback(async () => {
    const sid = localStorage.getItem(`exam_session_${examIdRef.current}`);
    if (!sid) return;
    try {
      const result = await examService.submitExam(sid, answersRef.current, true);
      if (result.success) {
        const id = examIdRef.current;
        ['start', 'answers', 'flagged', 'session'].forEach(k =>
          localStorage.removeItem(`exam_${k}_${id}`)
        );
        exitFullscreen();
        navigate(`/exam/${id}/result`);
      }
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev - 1 <= 0) { clearInterval(timer); handleAutoSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line

  //  useMemo — timer color
  const timerColor = useMemo(() => {
    const total = (exam?.settings?.timeLimit || exam?.timeLimit || 60) * 60;
    const pct   = (timeLeft / total) * 100;
    if (pct <= 10) return 'text-red-600 animate-pulse';
    if (pct <= 25) return 'text-orange-500';
    return darkMode ? 'text-white' : 'text-gray-900';
  }, [timeLeft, exam, darkMode]);

  //  useCallback — stable submit handler
  const confirmSubmit = useCallback(async () => {
    try {
      setShowConfirmDialog(false);
      let sid = localStorage.getItem(`exam_session_${examId}`);

      if (!sid) {
        try {
          const response = await examService.getUserSessions(examId);
          const active = response.data.find(s => s.status === 'in-progress');
          if (active) {
            sid = active._id;
            localStorage.setItem(`exam_session_${examId}`, sid);
          } else throw new Error('No active session');
        } catch {
          const mockResult = {
            score: 85, percentage: 85,
            correctAnswers: Math.floor(Object.keys(answers).length * 0.85),
            totalQuestions: Object.keys(answers).length || 10,
            passed: true, submittedAt: new Date().toISOString(),
          };
          localStorage.setItem(`exam_result_${examId}`, JSON.stringify(mockResult));
          navigate(`/exam/${examId}/result`);
          return;
        }
      }

      const result = await examService.submitExam(sid, answers, false);
      if (result.success) {
        if (result.data) localStorage.setItem(`exam_result_${examId}`, JSON.stringify(result.data));
        ['start', 'answers', 'flagged', 'session'].forEach(k =>
          localStorage.removeItem(`exam_${k}_${examId}`)
        );
        exitFullscreen();
        navigate(`/exam/${examId}/result`);
      } else {
        setError(result.error || 'Failed to submit exam');
      }
    } catch {
      setError('Error submitting exam');
    }
  }, [examId, answers, navigate]);

  
  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <LoadingSpinner />
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

  const questions     = exam.questions || [];
  const totalQ        = questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount  = Object.values(flagged).filter(Boolean).length;

  const flaggedQuestions   = [];
  const unansweredQuestions = [];

  questions.forEach((q, index) => {
    const qId  = q.id || q._id || index;
    const num  = index + 1;
    const type = q.type === 'multiple-choice' ? 'Multiple Choice'
               : q.type === 'true-false'      ? 'True/False'
               : q.type === 'short-answer'    ? 'Short Answer'
               : q.type === 'essay'           ? 'Essay'
               : q.type === 'code'            ? 'Code' : 'Question';
    if (flagged[qId])   flaggedQuestions.push({ id: num, type });
    if (!answers[qId])  unansweredQuestions.push({ id: num, type });
  });

  const examData = {
    title: exam.title || exam.name,
    totalQuestions: totalQ,
    answered: answeredCount,
    flagged: flaggedCount,
    unanswered: totalQ - answeredCount,
    flaggedQuestions,
    unansweredQuestions,
    allQuestions: questions.map((q, index) => {
      const qId = q.id || q._id || index;
      return {
        id: index + 1,
        status: flagged[qId] ? 'flagged' : answers[qId] ? 'answered' : 'unanswered',
      };
    }),
  };

  const isTimeLow = timeLeft <= ((exam?.settings?.timeLimit || 60) * 60 * 0.1);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
     
      <Card className="rounded-none border-x-0 border-t-0 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex-shrink-0"><LogoLink /></div>
          <button onClick={toggleDarkMode}
            className={`flex-shrink-0 p-2 rounded-lg ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} transition-colors`}>
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>
      </Card>

      {/* Exam Header */}
      <Card className="rounded-none border-x-0 border-t-0 px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
            {examData.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="relative">
              <MdOutlineVideocam className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
           
            {totalViolations > 0 && <ViolationBadge count={totalViolations} />}
            {!isFullscreen && <FullscreenWarning />}
            <div className={`flex items-center space-x-2 sm:space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-3 sm:px-6 py-2 sm:py-3 rounded-lg ${isTimeLow ? 'ring-2 ring-red-500' : ''}`}>
              <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-base sm:text-lg`}>🕐</div>
              <div className={`text-base sm:text-xl font-mono font-semibold ${timerColor}`}>{formatTime(timeLeft)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Back + Timer Bar */}
      <Card className="rounded-none border-x-0 border-t-0 mt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex items-center justify-between">
          <button onClick={() => navigate(`/exam/${examId}/taking`)}
            className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back to Questions</span>
            <span className="text-xs sm:text-sm font-medium sm:hidden">Back</span>
          </button>
          <h1 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} hidden md:block absolute left-1/2 transform -translate-x-1/2`}>
            {exam.title || exam.name}
          </h1>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs sm:text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Time Warning Banner */}
        {isTimeLow && timeLeft > 0 && (
          <div className="mb-4 sm:mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 rounded-lg flex items-start sm:items-center space-x-2 sm:space-x-3 animate-pulse">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-sm sm:text-base">Time Running Out!</p>
              <p className="text-xs sm:text-sm">You have less than {Math.ceil(timeLeft / 60)} minute{Math.ceil(timeLeft / 60) === 1 ? '' : 's'} remaining.</p>
            </div>
          </div>
        )}

        <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1 sm:mb-2`}>
          Exam Summary
        </h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm lg:text-base mb-4 sm:mb-6 lg:mb-8`}>
          Review your answers before submission
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {[
            { label: 'Total Questions', value: examData.totalQuestions, color: darkMode ? 'text-white' : 'text-gray-900' },
            { label: 'Answered',        value: examData.answered,       color: 'text-green-600' },
            { label: 'Flagged',         value: examData.flagged,        color: 'text-yellow-600' },
            { label: 'Unanswered',      value: examData.unanswered,     color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-3 sm:p-4 lg:p-6">
              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} block mb-1 sm:mb-2`}>
                {label}
              </span>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Unanswered Questions */}
        {examData.unansweredQuestions.length > 0 && (
          <Card className="p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Unanswered Questions ({examData.unansweredQuestions.length})
              </h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {examData.unansweredQuestions.map(q => (
                <button key={q.id} onClick={() => navigate(`/exam/${examId}/taking?question=${q.id}`)}
                  className="h-8 sm:h-9 lg:h-10 rounded-md bg-red-100 text-red-700 hover:bg-red-200 font-medium text-xs sm:text-sm transition-colors">
                  Q{q.id}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Flagged Questions */}
        {examData.flaggedQuestions.length > 0 && (
          <Card className="p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
            <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
              Flagged Questions ({examData.flaggedQuestions.length})
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {examData.flaggedQuestions.map(q => (
                <button key={q.id} onClick={() => navigate(`/exam/${examId}/taking?question=${q.id}`)}
                  className="h-8 sm:h-9 lg:h-10 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium text-xs sm:text-sm transition-colors">
                  Q{q.id}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* All Questions Grid */}
        <Card className="p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8">
          <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
            All Questions
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
            {examData.allQuestions.map(q => {
              const answered = q.status === 'answered';
              const flagd    = q.status === 'flagged';
              return (
                <button key={q.id} onClick={() => navigate(`/exam/${examId}/taking?question=${q.id}`)}
                  className={`h-9 sm:h-10 lg:h-12 rounded-md font-medium text-xs sm:text-sm transition-colors ${
                    answered ? darkMode ? 'bg-green-700 text-white hover:bg-green-600'   : 'bg-green-100 text-green-800 hover:bg-green-200'
                    : flagd  ? darkMode ? 'bg-yellow-700 text-white hover:bg-yellow-600' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                             : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${flagd ? 'ring-2 ring-yellow-500' : ''}`}>
                  {q.id}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Submit Button */}
        <button onClick={() => setShowConfirmDialog(true)}
          className={`w-full py-2.5 sm:py-3 lg:py-4 rounded-lg font-semibold text-sm sm:text-base lg:text-lg transition-all shadow-lg hover:shadow-xl ${
            darkMode ? 'bg-gray-800 hover:bg-gray-900 text-white' : 'bg-gray-900 hover:bg-black text-white'
          }`}>
          Submit Exam
        </button>

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            
            <Card className="p-4 sm:p-5 lg:p-6 max-w-md w-full mx-3 sm:mx-4">
              <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4`}>
                Confirm Submission
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xs sm:text-sm lg:text-base mb-4 sm:mb-5 lg:mb-6`}>
                Are you sure you want to submit? You won't be able to change your answers.
              </p>
              <div className="flex gap-2 sm:gap-3 justify-end">
                <button onClick={() => setShowConfirmDialog(false)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base border rounded ${
                    darkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}>
                  Cancel
                </button>
                <button onClick={confirmSubmit}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base bg-green-600 text-white rounded hover:bg-green-700">
                  Confirm
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamReview;
