import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import Header from "../../components/Layout/Header";
import Sidebar from "../../components/Layout/Sidebar";
import { apiClient, API_ENDPOINTS } from "../../config/api";

const StudentResults = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // Fetch all enrolled exams
        const examsResponse = await apiClient.get(API_ENDPOINTS.EXAMS);
        const examsData = examsResponse?.data?.exams || examsResponse?.data || [];
        
        // Fetch results for each exam
        const resultsPromises = examsData.map(async (exam) => {
          try {
            const result = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(exam._id));
            return {
              ...result.data,
              exam: exam
            };
          } catch (error) {
            return null;
          }
        });
        
        const resultsData = await Promise.all(resultsPromises);
        const validResults = resultsData.filter(result => result !== null);
        
        setResults(validResults);
      } catch (error) {
        console.error('Failed to fetch results:', error);
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, []);

  const handleViewDetails = (examId) => {
    navigate(`/exam/${examId}/result`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          title="Results"
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        title="Results"
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        userRole="student" 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="lg:ml-64 pt-20 px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Exam Results
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View all your exam results and performance
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {results.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-12 text-center`}>
            <div className="text-6xl mb-4">📊</div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No Results Yet
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Complete an exam to see your results here
            </p>
            <button
              onClick={() => navigate('/student/exams')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Take an Exam
            </button>
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden`}>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              {/* Table Header */}
              <div className={`grid grid-cols-5 gap-4 p-4 ${darkMode ? 'border-b border-gray-700 bg-gray-750' : 'border-b border-gray-200 bg-gray-50'}`}>
                <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Exam Title
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>
                  Score
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>
                  Status
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>
                  Date
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>
                  Action
                </div>
              </div>

              {/* Table Body */}
              {results.map((result, index) => {
                const percentage = result.score?.percentage || result.percentage || 0;
                const passed = result.score?.passed || percentage >= 60;
                const date = new Date(result.submittedAt || result.completedAt || result.createdAt);
                
                return (
                  <div
                    key={result._id || index}
                    className={`grid grid-cols-5 gap-4 p-4 ${
                      index !== results.length - 1 
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
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                      {date.toLocaleDateString()}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => handleViewDetails(result.exam?._id || result.examId)}
                        className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {results.map((result, index) => {
                const percentage = result.score?.percentage || result.percentage || 0;
                const passed = result.score?.passed || percentage >= 60;
                const date = new Date(result.submittedAt || result.completedAt || result.createdAt);
                
                return (
                  <div
                    key={result._id || index}
                    className={`p-4 ${
                      index !== results.length - 1 
                        ? darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200' 
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {result.exam?.title || result.examTitle || 'Unknown Exam'}
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {date.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        passed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {percentage}%
                      </div>
                      <button
                        onClick={() => handleViewDetails(result.exam?._id || result.examId)}
                        className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentResults;
