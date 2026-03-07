import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdOutlineVideocam } from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext.jsx';
import ExamHeader from '../../components/Layout/ExamHeader.jsx';
import { examService } from '../../services/examService.js';
import { useExamMonitoring } from '../../hooks/useExamMonitoring.js';
import { examMonitoringService } from '../../services/examMonitoringService.js';
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

const SAVING_STYLES = {
  saved:  'bg-green-100 text-green-700',
  saving: 'bg-blue-100 text-blue-700',
  error:  'bg-red-100 text-red-700',
  local:  'bg-gray-100 text-gray-700',
};

// ─────────────────────────────────────────────
// Small extracted components
// ─────────────────────────────────────────────




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

  const sessionIdRef = useRef(sessionId);
  const answersRef  = useRef(answers);
  const examIdRef   = useRef(examId);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { answersRef.current = answers; },   [answers]);
  useEffect(() => { examIdRef.current = examId; },     [examId]);

  const { isFullscreen, totalViolations } = useExamMonitoring({
    sessionId,
    examId,
    enabled: true,
    onIntegrityEvent: async (event) => {
      if (sessionIdRef.current) {
        try {
          await examMonitoringService.logIntegrityEvent(sessionIdRef.current, event);
        } catch { /* silently fail */ }
      }
    },
  });

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
            const examDuration = (
              sessionResult.data.exam?.settings?.timeLimit ||
              sessionResult.data.exam?.timeLimit ||
              sessionResult.data.exam?.duration || 60
            ) * 60;

            const savedStart = localStorage.getItem(`exam_start_${examId}`);
            if (savedStart) {
              const elapsed = Math.floor((Date.now() - parseInt(savedStart)) / 1000);
              setTimeLeft(Math.max(0, examDuration - elapsed));
            } else {
              localStorage.setItem(`exam_start_${examId}`, Date.now().toString());
              setTimeLeft(examDuration);
            }

            const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
            const savedFlagged = localStorage.getItem(`exam_flagged_${examId}`);
            if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
            if (savedFlagged) setFlagged(JSON.parse(savedFlagged));

            const questionParam = new URLSearchParams(window.location.search).get('question');
            if (questionParam) {
              const idx = parseInt(questionParam) - 1;
              if (!isNaN(idx) && idx >= 0) setCurrentQuestion(idx);
            }
          }
        }
      } catch {
        setError('Error loading exam');
      } finally {
        setLoading(false);
      }
    };

    if (examId) initializeExam();
  }, [examId]);

  // ✅ useCallback — stable reference for auto-submit
  const handleAutoSubmit = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      const result = await examService.submitExam(sessionIdRef.current, answersRef.current, true);
      if (result.success) {
        const id = examIdRef.current;
        ['start', 'answers', 'flagged', 'session'].forEach(k =>
          localStorage.removeItem(`exam_${k}_${id}`)
        );
        navigate(`/exam/${id}/result`);
      }
    } catch { /* auto-submit failed */ }
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

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (sessionId && Object.keys(answers).length > 0) {
        try {
          const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
            questionId, answer, timeSpent: 0,
          }));
          await examService.syncAnswers(sessionId, answersArray);
        } catch { /* retry next interval */ }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, answers]);

  // ✅ useMemo — timer color only recalculates when timeLeft/exam changes
  const timerColor = useMemo(() => {
    const total = (exam?.settings?.timeLimit || exam?.timeLimit || 60) * 60;
    const pct = (timeLeft / total) * 100;
    if (pct <= 10) return 'text-red-600 animate-pulse';
    if (pct <= 25) return 'text-orange-500';
    return darkMode ? 'text-white' : 'text-gray-900';
  }, [timeLeft, exam, darkMode]);

  // ✅ useCallback — stable reference
  const saveAnswer = useCallback(async (questionId, answer) => {
    const newAnswers = { ...answersRef.current, [questionId]: answer };
    setAnswers(newAnswers);
    localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(newAnswers));
    setSavingStatus('saving');

    if (sessionIdRef.current) {
      try {
        await examService.submitAnswer(sessionIdRef.current, questionId, answer, 0);
        setSavingStatus('saved');
      } catch {
        setSavingStatus('error');
      }
    } else {
      setSavingStatus('local');
    }
    setTimeout(() => setSavingStatus(''), 2000);
  }, [examId]);

  const handleAnswerSelect = useCallback((questionId, answer) => {
    if (answersRef.current[questionId] === answer) return;
    saveAnswer(questionId, answer);
  }, [saveAnswer]);

  const handleFlagToggle = useCallback((questionId) => {
    setFlagged(prev => {
      const updated = { ...prev, [questionId]: !prev[questionId] };
      localStorage.setItem(`exam_flagged_${examId}`, JSON.stringify(updated));
      return updated;
    });
  }, [examId]);

  const handleNext     = useCallback(() => setCurrentQuestion(p => p + 1), []);
  const handlePrevious = useCallback(() => setCurrentQuestion(p => p - 1), []);

  const handleSubmitExam = useCallback(async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) return;
    if (!sessionId) return;
    try {
      const result = await examService.submitExam(sessionId, answers, false);
      if (result.success) {
        ['start', 'answers', 'flagged', 'session'].forEach(k =>
          localStorage.removeItem(`exam_${k}_${examId}`)
        );
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        navigate(`/exam/${examId}/result`);
      }
    } catch { /* submission failed */ }
  }, [sessionId, answers, examId, navigate]);

  // ✅ BEFORE: manual dark/light loading div — AFTER: LoadingSpinner
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

  const questions = exam.questions || [];
  const currentQ  = questions[currentQuestion];

  if (!questions.length || !currentQ) {
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

  const qId       = currentQ.id || currentQ._id;
  const isAnswered = answers[qId] && answers[qId].toString().trim() !== '';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ExamHeader darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />

      {/* Top Bar */}
      {/* ✅ BEFORE: manual dark/light div — AFTER: Card */}
      <Card className="mt-16 rounded-none border-x-0 border-t-0">
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
            <div className="relative" title="Webcam monitoring active">
              <MdOutlineVideocam className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* ✅ BEFORE: repeated violation badge markup — AFTER: ViolationBadge component */}
            {totalViolations > 0 && <ViolationBadge count={totalViolations} />}

            {/* ✅ BEFORE: repeated fullscreen warning markup — AFTER: FullscreenWarning component */}
            {!isFullscreen && <FullscreenWarning />}

            {savingStatus && (
              <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium ${SAVING_STYLES[savingStatus]}`}>
                {savingStatus === 'saving' && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                <span className="hidden sm:inline">{savingStatus === 'saving' ? 'Saving...' : savingStatus === 'saved' ? 'Saved' : 'Saved locally'}</span>
              </div>
            )}

            <div className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm sm:text-base font-medium ${timerColor}`}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Navigation Bar */}
      <div className={`lg:hidden px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} border-b flex items-center justify-between`}>
        <button onClick={handlePrevious} disabled={currentQuestion === 0}
          className="px-3 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50 text-sm font-medium">
          ← Prev
        </button>
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Question {currentQuestion + 1} / {questions.length}
        </span>
        <button onClick={handleNext} disabled={currentQuestion === questions.length - 1}
          className="px-3 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50 text-sm font-medium">
          Next →
        </button>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar — Desktop Only */}
        {/* ✅ BEFORE: manual dark/light div — AFTER: Card */}
        <Card className="hidden lg:block w-80 rounded-none border-t-0 border-b-0 border-l-0 p-6">
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4 uppercase tracking-wide`}>
            Question Navigation
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {questions.map((q, index) => {
              const id = q.id || q._id;
              const isCurrent  = index === currentQuestion;
              const isAnsw     = answers[id] && answers[id].toString().trim() !== '';
              return (
                <button key={index} onClick={() => setCurrentQuestion(index)}
                  className={`h-12 rounded-md font-medium text-sm transition-colors ${
                    isCurrent  ? 'bg-blue-600 text-white'
                    : isAnsw   ? darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                               : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
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
              {['Answered', 'Flagged', 'Not answered'].map(label => (
                <label key={label} className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                </label>
              ))}
            </div>
            <button onClick={() => navigate(`/exam/${examId}/summary`)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm font-medium transition-colors">
              Review & Submit
            </button>
          </div>
        </Card>

        {/* Question Area */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold uppercase ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {currentQ.type === 'multiple-choice' ? 'MULTIPLE CHOICE'
                  : currentQ.type === 'true-false'   ? 'TRUE/FALSE'
                  : currentQ.type === 'essay'         ? 'ESSAY'
                  : currentQ.type === 'short-answer'  ? 'SHORT ANSWER'
                  : currentQ.type || 'QUESTION'}
              </span>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={!!flagged[qId]} onChange={() => handleFlagToggle(qId)}
                className="w-4 h-4 rounded border-gray-300" />
              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Flag Question
              </span>
            </label>
          </div>

          {/* ✅ BEFORE: manual dark/light div — AFTER: Card */}
          <Card className="shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <h2 className={`text-base sm:text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6 lg:mb-8`}>
              {currentQ.text || currentQ.question || currentQ.title || 'Question text not available'}
            </h2>

            {(currentQ.type === 'multiple-choice' || currentQ.type === 'true-false') && (
              <div className="space-y-2 sm:space-y-3">
                {(currentQ.options || (currentQ.type === 'true-false' ? ['True', 'False'] : [])).map((option, index) => {
                  const text  = typeof option === 'string' ? option : option.text;
                  const value = typeof option === 'string' ? option : option.value || option.text;
                  const selected = answers[qId] === value;
                  return (
                    <label key={index} className={`flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selected ? 'border-blue-600 bg-blue-50'
                        : darkMode ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                   : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name={`question-${qId}`} value={value} checked={selected}
                        onChange={() => handleAnswerSelect(qId, value)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {(currentQ.type === 'essay' || currentQ.type === 'short-answer') && (
              <textarea
                value={answers[qId] || ''}
                onChange={(e) => handleAnswerSelect(qId, e.target.value)}
                className={`w-full p-3 sm:p-4 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base ${
                  currentQ.type === 'essay' ? 'h-48' : 'h-24'
                }`}
                placeholder="Type your answer here..."
              />
            )}
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <button onClick={handlePrevious} disabled={currentQuestion === 0}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium transition-colors ${
                currentQuestion === 0
                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                  : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}>
              Previous
            </button>
            <span className={`text-xs sm:text-sm font-medium ${isAnswered ? darkMode ? 'text-green-400' : 'text-green-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isAnswered ? 'Answered' : 'Not answered'}
            </span>
            <button onClick={handleNext} disabled={currentQuestion === questions.length - 1}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium transition-colors ${
                currentQuestion === questions.length - 1
                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Review Button — Mobile Only */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button onClick={() => navigate(`/exam/${examId}/summary`)}
          className="px-6 py-3 rounded-full font-semibold text-sm shadow-lg bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl flex items-center space-x-2 transition-all">
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
