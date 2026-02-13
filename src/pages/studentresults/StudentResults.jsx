import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import Header from "../../components/Layout/Header.jsx";
import Sidebar from "../../components/Layout/Sidebar.jsx";
import { apiClient, API_ENDPOINTS } from "../../config/api.js";

const StudentResults = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);

        const examsResponse = await apiClient.get(API_ENDPOINTS.EXAMS);
        const examsData =
          examsResponse?.data?.exams || examsResponse?.data || [];

        const resultsPromises = examsData.map(async (exam) => {
          try {
            const result = await apiClient.get(
              API_ENDPOINTS.RESULT_BY_EXAM(exam._id),
            );
            return {
              ...result.data,
              exam: exam,
            };
          } catch (error) {
            return null;
          }
        });

        const resultsData = await Promise.all(resultsPromises);
        const validResults = resultsData.filter((result) => result !== null);

        setResults(validResults);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Calculate subject performance
  const getSubjectPerformance = () => {
    const subjects = {};

    results.forEach((result) => {
      const subject = result.exam?.title?.split(" ")[0] || "Other";
      if (!subjects[subject]) {
        subjects[subject] = { total: 0, count: 0 };
      }
      subjects[subject].total += result.score?.percentage || 0;
      subjects[subject].count += 1;
    });

    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      percentage: Math.round(data.total / data.count),
    }));
  };

  // Filter results
  const getFilteredResults = () => {
    let filtered = [...results];

    if (subjectFilter !== "all") {
      filtered = filtered.filter((r) =>
        r.exam?.title?.toLowerCase().includes(subjectFilter.toLowerCase()),
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((r) => {
        const resultDate = new Date(
          r.submittedAt || r.completedAt || r.createdAt,
        );
        const diffDays = Math.floor((now - resultDate) / (1000 * 60 * 60 * 24));

        if (dateFilter === "week") return diffDays <= 7;
        if (dateFilter === "month") return diffDays <= 30;
        if (dateFilter === "3months") return diffDays <= 90;
        return true;
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.completedAt || a.createdAt);
      const dateB = new Date(b.submittedAt || b.completedAt || b.createdAt);
      return dateB - dateA;
    });
  };

  // Get recommendations based on performance
  const getRecommendations = () => {
    const subjectPerf = getSubjectPerformance();
    const weakSubjects = subjectPerf.filter((s) => s.percentage < 70);

    if (weakSubjects.length > 0) {
      const subjects = weakSubjects.map((s) => s.subject).join(", ");
      return `Based on your recent performance, we recommend focusing on the following areas for improvement: Review the concepts of ${subjects}. Practice more on physics and chemistry in Science. Consider taking additional practice exams to reinforce your understanding.`;
    }

    return "Great job! You're performing well across all subjects. Keep up the excellent work and continue practicing regularly to maintain your strong performance.";
  };

  const handleViewDetails = (examId) => {
    navigate(`/exam/${examId}/result`);
  };

  const filteredResults = getFilteredResults();
  const subjectPerformance = getSubjectPerformance();
  const recentResults = filteredResults.slice(0, 3);

  if (loading) {
    return (
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
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
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
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
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            } mb-2`}
          >
            Results Dashboard
          </h1>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Track your progress and identify areas for improvement.
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
          <div
            className={`${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border rounded-lg p-12 text-center`}
          >
            <div className="text-6xl mb-4">📊</div>
            <h2
              className={`text-xl font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              } mb-2`}
            >
              No Results Yet
            </h2>
            <p
              className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-6`}
            >
              Complete an exam to see your results here
            </p>
            <button
              onClick={() => navigate("/student/exams")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Take an Exam
            </button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border rounded-lg p-4 mb-6`}
            >
              <div className="flex flex-wrap gap-4">
                {/* Subject Filter */}
                <div className="flex items-center space-x-2">
                  <label
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Subject:
                  </label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="all">All Subjects</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="biology">Biology</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="flex items-center space-x-2">
                  <label
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Date:
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="all">All Time</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="3months">Past 3 Months</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recent Results */}
            <div className="mb-6">
              <h2
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                } mb-4`}
              >
                Recent Results
              </h2>
              <div className="flex flex-col gap-4">
                {recentResults.map((result, index) => {
                  const percentage =
                    result.score?.percentage || result.percentage || 0;
                  const date = new Date(
                    result.submittedAt ||
                      result.completedAt ||
                      result.createdAt,
                  );
                  const passed = result.score?.passed || percentage >= 60;

                  return (
                    <div
                      key={result._id || index}
                      className={`${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      } border rounded-lg p-6`}
                    >
                      <div className="mb-2">
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <h3
                          className={`font-semibold ${
                            darkMode ? "text-white" : "text-gray-900"
                          } mb-1`}
                        >
                          {result.exam?.title || "Unknown Exam"}
                        </h3>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Passed
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleViewDetails(result.exam?._id || result.examId)
                        }
                        className={`text-sm font-medium ${
                          darkMode
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-700"
                        } transition-colors flex items-center`}
                      >
                        View Details
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress by Subject */}
            <div className="mb-6">
              <h2
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                } mb-4`}
              >
                Progress by Subject
              </h2>
              <div
                className={`${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } border rounded-lg p-6`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {subjectPerformance.map((subject, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <h3
                          className={`font-semibold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {subject.subject} Performance
                        </h3>
                        <span
                          className={`text-2xl font-bold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {subject.percentage}%
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        } mb-4`}
                      >
                        Last 4 Exams: +5%
                      </p>

                      {/* Simple Wave Chart Placeholder */}
                      <div className="relative h-32">
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 300 100"
                          preserveAspectRatio="none"
                          className={
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }
                        >
                          <path
                            d="M0,50 Q25,20 50,50 T100,50 T150,50 T200,50 T250,50 T300,50"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>

                        {/* Month labels */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
                          <span>Jul</span>
                          <span>Aug</span>
                          <span>Sep</span>
                          <span>Oct</span>
                          <span>Nov</span>
                          <span>Dec</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div
              className={`${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border rounded-lg p-6`}
            >
              <h2
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                } mb-3`}
              >
                Recommendations
              </h2>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                } leading-relaxed`}
              >
                {getRecommendations()}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentResults;
