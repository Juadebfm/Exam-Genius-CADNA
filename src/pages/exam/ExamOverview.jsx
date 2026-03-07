import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import { AuthContext } from '../../context/AuthContextDefinition.js';
import ExamHeader from '../../components/Layout/ExamHeader.jsx';
import { examService } from '../../services/examService.js';
import { Card, LoadingSpinner } from '../../components/shared';

// Default instructions shown when exam has none
const DEFAULT_INSTRUCTIONS = [
  'Ensure stable internet connection throughout the exam.',
  'Do not refresh or switch browser tabs during the exam.',
  'Complete the exam in one sitting; you cannot return later.',
  'All questions must be answered before submission.',
];

const ExamOverview = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const result = await examService.getExamDetails(examId);
        if (result.success) {
          setExamData(result.data);
        } else {
          console.error('Failed to fetch exam:', result.error);
        }
      } catch (error) {
        console.error('Error fetching exam:', error);
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchExamData();
  }, [examId, user, navigate]);

  const handleBeginExam = () => navigate(`/exam/${examId}/webcam-check`);

  // ✅ BEFORE: manual dark/light loading div — AFTER: LoadingSpinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ✅ Stat info card used twice — extracted to avoid repetition
  const StatBox = ({ label, value }) => (
    // ✅ BEFORE: manual bg-gray-700/gray-50 div — AFTER: Card
    <Card className="p-6 text-center">
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
        {label}
      </div>
      <div className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>
    </Card>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ExamHeader darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />

      {/* Back Button */}
      <div className="px-6 py-4 pt-24">
        <button
          onClick={() => navigate('/student/exams')}
          className={`flex items-center space-x-2 ${
            darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
          } transition-colors`}
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Exams</span>
        </button>
      </div>

      <div className="py-4 px-4">
        <div className="max-w-2xl mx-auto">
          {/* ✅ BEFORE: manual bg-gray-800/white div — AFTER: Card */}
          <Card className="shadow-md p-8">
            <h1
              className={`text-3xl font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } mb-6 text-center`}
            >
              {examData?.title || examData?.name || 'Exam'}
            </h1>

            {/* Duration + Questions stat boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <StatBox
                label="Duration"
                value={`${examData?.settings?.timeLimit || examData?.duration || examData?.timeLimit} minutes`}
              />
              <StatBox
                label="Questions"
                value={examData?.questionCount || examData?.questions?.length || 0}
              />
            </div>

            {/* Instructions */}
            <div className="mb-8">
              <h2
                className={`text-xl font-semibold ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                } mb-4 text-center`}
              >
                Exam Instructions
              </h2>
              <ul
                className={`list-disc pl-6 space-y-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {(examData?.instructions || DEFAULT_INSTRUCTIONS).map(
                  (instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ),
                )}
              </ul>
            </div>

            <button
              onClick={handleBeginExam}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Proceed
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamOverview;
