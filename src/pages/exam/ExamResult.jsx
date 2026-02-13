import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { apiClient, API_ENDPOINTS } from "../../config/api";
import { FiArrowLeft } from "react-icons/fi";
import Header from "../../components/Layout/Header";
import Sidebar from "../../components/Layout/Sidebar";

const ExamResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        
        // Fetch exam details WITH CORRECT ANSWERS (for results view)
        const examResponse = await apiClient.get(API_ENDPOINTS.EXAM_WITH_ANSWERS(examId));
        if (examResponse.success && examResponse.data) {
          setExam(examResponse.data);
        } else if (examResponse.data) {
          setExam(examResponse.data);
        }
        
        // Fetch result
        const resultResponse = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(examId));
        if (resultResponse.success || resultResponse.data) {
          const resultData = resultResponse.data || resultResponse;
          setResult(resultData);
          
          // Fetch the exam session to get user answers
          if (resultData.examSession) {
            try {
              const sessionResponse = await apiClient.get(
                API_ENDPOINTS.EXAM_SESSION(resultData.examSession)
              );
              setSession(sessionResponse.data || sessionResponse);
            } catch (err) {
              console.error('Failed to fetch session:', err);
            }
          }
        } else {
          setError('Result not found');
        }
      } catch (error) {
        console.error('Failed to fetch result:', error);
        setError('Failed to load exam result');
      } finally {
        setLoading(false);
      }
    };
    
    if (examId) {
      fetchResult();
    }
  }, [examId]);

  // Calculate stats from result
  const getStats = () => {
    if (!result || !exam) return null;
    
    const totalScore = result.score?.totalPoints || 100;
    const earnedScore = result.score?.earnedPoints || 0;
    const percentage = result.score?.percentage || 0;
    const timeSpent = result.analytics?.timeSpent || 0;
    const questionsAttempted = result.analytics?.questionsAttempted || exam.questions?.length || 0;
    const totalQuestions = exam.questions?.length || 0;
    
    // Format time
    const hours = Math.floor(timeSpent / 3600);
    const minutes = Math.floor((timeSpent % 3600) / 60);
    const timeFormatted = hours > 0 
      ? `${hours} hour ${minutes} minutes` 
      : `${minutes} minutes`;
    
    const accuracy = totalQuestions > 0 
      ? Math.round((questionsAttempted / totalQuestions) * 100) 
      : 0;
    
    return {
      totalScore: `${earnedScore}/${totalScore}`,
      timeSpent: timeFormatted,
      accuracy: `${accuracy}%`,
      percentage
    };
  };

  // Get question breakdown with proper answer mapping
  const getQuestionBreakdown = () => {
    if (!exam || !session) return [];
    
    const questions = exam.questions || [];
    const answers = session.answers || [];
    
    console.log('Questions:', questions.length);
    console.log('Answers:', answers.length);
    console.log('Sample answer:', answers[0]);
    console.log('Sample question:', questions[0]);
    
    return questions.map((question, index) => {
      // Find user's answer by matching questionId
      const userAnswer = answers.find(a => {
        const answerQuestionId = a.questionId?._id || a.questionId;
        const currentQuestionId = question._id || question.id;
        return answerQuestionId?.toString() === currentQuestionId?.toString();
      });
      
      const isCorrect = userAnswer?.isCorrect || false;
      const difficulty = question.difficulty || 'medium';
      const type = question.type || 'multiple-choice';
      
      // Get user's answer value
      let yourAnswerText = '-';
      if (userAnswer && userAnswer.answer !== undefined && userAnswer.answer !== null) {
        if (typeof userAnswer.answer === 'boolean') {
          yourAnswerText = userAnswer.answer ? 'True' : 'False';
        } else if (typeof userAnswer.answer === 'string') {
          yourAnswerText = userAnswer.answer;
        } else {
          yourAnswerText = String(userAnswer.answer);
        }
      }
      
      // Get correct answer - improved logic
      let correctAnswerText = '-';
      
      // Method 1: Check correctAnswer field (works for all types)
      if (question.correctAnswer !== undefined && question.correctAnswer !== null && question.correctAnswer !== '') {
        if (typeof question.correctAnswer === 'boolean') {
          correctAnswerText = question.correctAnswer ? 'True' : 'False';
        } else if (typeof question.correctAnswer === 'string') {
          correctAnswerText = question.correctAnswer.trim(); // Trim whitespace
        } else if (typeof question.correctAnswer === 'number') {
          correctAnswerText = String(question.correctAnswer);
        } else {
          correctAnswerText = String(question.correctAnswer);
        }
      } 
      // Method 2: Check options array for isCorrect flag (for MCQ/True-False)
      else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        const correctOption = question.options.find(o => o.isCorrect === true);
        if (correctOption) {
          correctAnswerText = correctOption.text || correctOption.value || '-';
        }
      }
      // Method 3: For short answer/essay, try alternative fields
      else if (question.type === 'short-answer' || question.type === 'essay') {
        correctAnswerText = question.answerKey || question.expectedAnswer || question.solution || 'See instructor feedback';
      }
      // Method 4: For coding questions
      else if (question.type === 'coding') {
        correctAnswerText = 'See test cases';
      }
      
      // If still not found, log for debugging
      if (correctAnswerText === '-') {
        console.warn(`No correct answer found for Question ${index + 1}:`, {
          type: question.type,
          hasCorrectAnswer: question.correctAnswer !== undefined,
          correctAnswerValue: question.correctAnswer,
          correctAnswerType: typeof question.correctAnswer,
          hasOptions: !!question.options,
          optionsLength: question.options?.length,
          question: question
        });
      }
      
      // Determine topic - use actual topic or derive from question text
      let topic = 'General';
      if (question.topic) {
        topic = question.topic;
      } else {
        // Try to extract subject from exam title
        const examTitle = exam.title || '';
        if (examTitle.includes('Mathematics') || examTitle.includes('Math')) {
          topic = 'Mathematics';
        } else if (examTitle.includes('Physics')) {
          topic = 'Physics';
        } else if (examTitle.includes('Chemistry')) {
          topic = 'Chemistry';
        } else if (examTitle.includes('Biology')) {
          topic = 'Biology';
        } else {
          // Capitalize the question type as fallback
          topic = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
      
      return {
        number: index + 1,
        topic: topic,
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        yourAnswer: yourAnswerText,
        correctAnswer: correctAnswerText,
        result: isCorrect ? 'Correct' : 'Incorrect'
      };
    });
  };

  const stats = getStats();
  const questionBreakdown = getQuestionBreakdown();

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          title="Exam Result"
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
        />
        <Sidebar 
          isOpen={sidebarOpen} 
          userRole="student" 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="lg:ml-64 pt-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          title="Exam Result"
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
        />
        <Sidebar 
          isOpen={sidebarOpen} 
          userRole="student" 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="lg:ml-64 pt-20 px-4 sm:px-6 lg:px-8 py-6">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-12 text-center`}>
            <div className="text-6xl mb-4">❌</div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              Result Not Found
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {error || 'No result available for this exam'}
            </p>
            <button
              onClick={() => navigate('/student/results')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Results
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        title="Exam Result"
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        userRole="student" 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="lg:ml-64 pt-20 px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/results')}
          className={`flex items-center space-x-2 mb-6 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Results</span>
        </button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Results
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Exam Overview
          </p>
        </div>

        {/* Main Content */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          {/* Exam Overview Section */}
          <div className="mb-8">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              Exam Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Score */}
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  Total Score
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats?.totalScore || '0/100'}
                </p>
              </div>

              {/* Time Spent */}
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  Time Spent
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats?.timeSpent || '0 minutes'}
                </p>
              </div>

              {/* Accuracy */}
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  Accuracy
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats?.accuracy || '0%'}
                </p>
              </div>
            </div>
          </div>

          {/* Question Breakdown Section */}
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Question Breakdown
            </h2>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Question
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Topic
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Difficulty
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Your Answer
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Correct Answer
                    </th>
                    <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questionBreakdown.map((q, index) => (
                    <tr
                      key={index}
                      className={`${
                        index !== questionBreakdown.length - 1 
                          ? darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200' 
                          : ''
                      }`}
                    >
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Question {q.number}
                      </td>
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {q.topic}
                      </td>
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {q.difficulty}
                      </td>
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {q.yourAnswer}
                      </td>
                      <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {q.correctAnswer}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          q.result === 'Correct'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {q.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {questionBreakdown.map((q, index) => (
                <div
                  key={index}
                  className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                        Question {q.number}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {q.topic} • {q.difficulty}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      q.result === 'Correct'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {q.result}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                        Your Answer:
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {q.yourAnswer}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                        Correct Answer:
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {q.correctAnswer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamResult;
