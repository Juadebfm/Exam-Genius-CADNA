
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IoBookOutline, IoStatsChartOutline } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { apiClient, API_ENDPOINTS } from "../../config/api";

const ActiveDashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [progressBySubject, setProgressBySubject] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch enrolled exams
        const examsResponse = await apiClient.get(API_ENDPOINTS.EXAMS);
        const examsData = examsResponse?.data?.exams || examsResponse?.data || [];
        
        // Filter upcoming exams (show all enrolled exams)
        // Students only see exams they're enrolled in (backend already filters)
        const upcoming = examsData.slice(0, 2); 
        
        setUpcomingExams(upcoming);
        
        // Fetch results for each exam using /:examId endpoint
        const resultsPromises = examsData.map(async (exam) => {
          try {
            const result = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(exam._id));
            return result.data;
          } catch (error) {
            // Exam might not have results yet, skip it
            return null;
          }
        });
        
        // Wait for all results to complete
        const resultsData = await Promise.all(resultsPromises);
        
        // Filter out null results (exams without results)
        const validResults = resultsData.filter(result => result !== null);
        
        // Get recent results (latest 3)
        const recent = validResults.slice(0, 3);
        
        setRecentResults(recent);
        
        // Calculate progress by subject
        const subjectProgress = calculateSubjectProgress(validResults);
        setProgressBySubject(subjectProgress);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const calculateSubjectProgress = (results) => {
    if (!Array.isArray(results) || results.length === 0) {
      return [
        { subject: 'Mathematics', percentage: 85, examsCompleted: 4, totalExams: 5, color: 'bg-blue-500' },
        { subject: 'Physics', percentage: 92, examsCompleted: 3, totalExams: 4, color: 'bg-green-500' },
        { subject: 'ICT', percentage: 75, examsCompleted: 3, totalExams: 4, color: 'bg-purple-500' }
      ];
    }

    // Group results by subject/exam title
    const subjectMap = {};
    
    results.forEach(result => {
      const subject = result.exam?.title || result.examTitle || 'Unknown';
      const percentage = result.score?.percentage || result.percentage || 0;
      
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          total: 0,
          count: 0,
          subject: subject
        };
      }
      
      subjectMap[subject].total += percentage;
      subjectMap[subject].count += 1;
    });

    // Calculate averages and format for display
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    
    return Object.values(subjectMap)
      .map((data, index) => ({
        subject: data.subject,
        percentage: Math.round(data.total / data.count),
        examsCompleted: data.count,
        totalExams: data.count + 1, 
        color: colors[index % colors.length]
      }))
      .slice(0, 3); 
  };

  const handleTakeExam = (examId) => {
    if (examId) {
      navigate(`/exam/${examId}/overview`);
    } else {
      navigate('/student/exams');
    }
  };

  const handleViewAllResults = () => {
    // Navigate to most recent exam result
    if (recentResults.length > 0) {
      const mostRecentResult = recentResults[0];
      const examId = mostRecentResult.exam?._id || mostRecentResult.examId;
      if (examId) {
        navigate(`/exam/${examId}/result`);
      } else {
        // Fallback to exams page if no exam ID
        navigate('/student/exams');
      }
    } else {
      // No results yet, go to exams
      navigate('/student/exams');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min` : ''}`;
    }
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} px-4 sm:px-6 lg:px-8 py-6`}>
      {/* Greeting Section */}
      <div className="mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          Hello {user?.firstName || 'Joy'},
        </h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
         Focus on your progress, ready your next exam
        </p>
      </div>

      
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <button
            onClick={() => handleTakeExam(null)}
            className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-lg p-4 flex items-center justify-center space-x-3 transition-colors`}
          >
            <IoBookOutline className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Take Exam</span>
          </button>
          <button
            onClick={handleViewAllResults}
            className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-lg p-4 flex items-center justify-center space-x-3 transition-colors`}
          >
            <IoStatsChartOutline className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>View All Results</span>
          </button>
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Upcoming Exams
        </h2>
        
        {upcomingExams.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 text-center`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No upcoming exams at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingExams.map((exam, index) => (
              <div
                key={exam._id || index}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-5`}
              >
                <div className="mb-4">
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {exam.title || 'Untitled Exam'}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {exam.description || 'No description'}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      📅 {formatDate(exam.schedule?.startDate)}
                    </span>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ⏱️ {formatTime(exam.settings?.timeLimit || exam.timeLimit)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      📝 {exam.questions?.length || 0} questions
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleTakeExam(exam._id)}
                  className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} py-2 px-4 rounded-lg font-medium transition-colors`}
                >
                  Take Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Recent Results
        </h2>
        
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden`}>
          {/* Table Header */}
          <div className={`grid grid-cols-3 gap-4 p-4 ${darkMode ? 'border-b border-gray-700 bg-gray-750' : 'border-b border-gray-200 bg-gray-50'}`}>
            <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subject
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>
              Score
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>
              Status
            </div>
          </div>

          {/* Table Body */}
          {recentResults.length === 0 ? (
            <div className="p-6 text-center">
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No results yet
              </p>
            </div>
          ) : (
            <div>
              {recentResults.map((result, index) => {
                const percentage = result.score?.percentage || result.percentage || 0;
                const passed = result.score?.passed || percentage >= 60;
                
                return (
                  <div
                    key={result._id || index}
                    className={`grid grid-cols-3 gap-4 p-4 ${
                      index !== recentResults.length - 1 
                        ? darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200' 
                        : ''
                    }`}
                  >
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {result.exam?.title || result.examTitle || 'Unknown Exam'}
                    </div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-center`}>
                      {percentage}%
                    </div>
                    <div className="text-center">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        passed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Progress by Subject */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Progress by Subject
        </h2>
        
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          {progressBySubject.length === 0 ? (
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No progress data available
            </p>
          ) : (
            <div className="space-y-6">
              {progressBySubject.map((subject, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 ${subject.color} rounded-sm`}></div>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {subject.subject}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {subject.percentage}%
                      </span>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {subject.examsCompleted} out of {subject.totalExams} exams taken
                      </p>
                    </div>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div
                      className={`${subject.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${subject.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Study Resources */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Recommended Study Resources
        </h2>
        
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <div className="space-y-4">
            {[
              { subject: 'Mathematics', title: 'Algebra Practice Problems', type: 'PDF' },
              { subject: 'English', title: 'Literacy Analysis Guide', type: 'Video' },
              { subject: 'Science', title: 'Science Video Tutorials', type: 'Video' }
            ].map((resource, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}
              >
                <div className="flex-1">
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    {resource.subject}
                  </p>
                  <h3 className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-1`}>
                    {resource.title}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {resource.type}
                  </p>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDashboard;
