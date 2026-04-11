import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { apiClient, API_ENDPOINTS } from "../../config/api.js";
import { PageLayout, LoadingSpinner, Card, EmptyState } from "../../components/shared";

const StudentResults = () => {
  const { darkMode } = useTheme();
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
        const examsData = examsResponse?.data?.exams || examsResponse?.data || [];

        const resultsData = await Promise.all(
          examsData.map(async (exam) => {
            try {
              const result = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(exam._id));
              return { ...result.data, exam };
            } catch {
              return null;
            }
          }),
        );

        setResults(resultsData.filter(Boolean));
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  //  Wrapped with useMemo — only recalculates when results change
  const subjectPerformance = useMemo(() => {
    const subjects = {};
    results.forEach((result) => {
      const subject = result.exam?.title?.split(" ")[0] || "Other";
      if (!subjects[subject]) subjects[subject] = { total: 0, count: 0 };
      subjects[subject].total += result.score?.percentage || 0;
      subjects[subject].count += 1;
    });
    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      percentage: Math.round(data.total / data.count),
    }));
  }, [results]);

  //  Wrapped with useMemo — only recalculates when results/filters change
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (subjectFilter !== "all") {
      filtered = filtered.filter((r) =>
        r.exam?.title?.toLowerCase().includes(subjectFilter.toLowerCase()),
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((r) => {
        const diffDays = Math.floor(
          (now - new Date(r.submittedAt || r.completedAt || r.createdAt)) /
            (1000 * 60 * 60 * 24),
        );
        if (dateFilter === "week") return diffDays <= 7;
        if (dateFilter === "month") return diffDays <= 30;
        if (dateFilter === "3months") return diffDays <= 90;
        return true;
      });
    }

    return filtered.sort((a, b) => {
      return (
        new Date(b.submittedAt || b.completedAt || b.createdAt) -
        new Date(a.submittedAt || a.completedAt || a.createdAt)
      );
    });
  }, [results, subjectFilter, dateFilter]);

  const recentResults = filteredResults.slice(0, 3);

  //  Wrapped with useMemo — only recalculates when subjectPerformance changes
  const recommendations = useMemo(() => {
    const weakSubjects = subjectPerformance.filter((s) => s.percentage < 70);
    if (weakSubjects.length > 0) {
      const subjects = weakSubjects.map((s) => s.subject).join(", ");
      return `Based on your recent performance, we recommend focusing on: ${subjects}. Practice more and consider taking additional practice exams to reinforce your understanding.`;
    }
    return "Great job! You're performing well across all subjects. Keep up the excellent work and continue practicing regularly.";
  }, [subjectPerformance]);

  const handleViewDetails = (examId) => navigate(`/exam/${examId}/result`);

  //  BEFORE: full page rebuild with Header+Sidebar+spinner inside loading block
  //  AFTER: one line
  if (loading) return <LoadingSpinner fullPage title="Results" />;

  const selectClass = `px-3 py-1.5 rounded-lg border text-sm ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-white border-gray-300 text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const labelClass = `text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  return (
    //  BEFORE: 10 lines of page shell boilerplate
    //  AFTER: PageLayout handles all of it
    <PageLayout title="Results">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
          Results Dashboard
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
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
        //  BEFORE: 20 lines of manual empty-state div
        //  AFTER: EmptyState handles it
        <EmptyState
          icon="📊"
          title="No Results Yet"
          description="Complete an exam to see your results here"
          action={
            <button
              onClick={() => navigate("/student/exams")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Take an Exam
            </button>
          }
        />
      ) : (
        <>
          {/* Filters */}
          {/*  BEFORE: manual dark/light div — AFTER: Card component */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className={labelClass}>Subject:</label>
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className={selectClass}>
                  <option value="all">All Subjects</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className={labelClass}>Date:</label>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={selectClass}>
                  <option value="all">All Time</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="3months">Past 3 Months</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Recent Results */}
          <div className="mb-6">
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
              Recent Results
            </h2>
            <div className="flex flex-col gap-4">
              {recentResults.map((result, index) => {
                const percentage = result.score?.percentage || result.percentage || 0;
                const date = new Date(result.submittedAt || result.completedAt || result.createdAt);

                return (
                  //  BEFORE: manual dark/light div — AFTER: Card
                  <Card key={result._id || index} className="p-6">
                    <div className="mb-2">
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-1`}>
                        {result.exam?.title || "Unknown Exam"}
                      </h3>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Passed</p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(result.exam?._id || result.examId)}
                      className={`text-sm font-medium ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} transition-colors flex items-center`}
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Progress by Subject */}
          <div className="mb-6">
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
              Progress by Subject
            </h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {subjectPerformance.map((subject, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {subject.subject} Performance
                      </h3>
                      <span className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {subject.percentage}%
                      </span>
                    </div>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                      Last 4 Exams: +5%
                    </p>
                    <div className="relative h-32">
                      <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none"
                        className={darkMode ? "text-blue-400" : "text-blue-600"}>
                        <path d="M0,50 Q25,20 50,50 T100,50 T150,50 T200,50 T250,50 T300,50"
                          fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
                        {["Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="p-6">
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-3`}>
              Recommendations
            </h2>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
              {recommendations}
            </p>
          </Card>
        </>
      )}
    </PageLayout>
  );
};

export default StudentResults;
