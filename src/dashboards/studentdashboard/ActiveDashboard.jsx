import { useState, useEffect, useContext, useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IoBookOutline, IoStatsChartOutline } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { apiClient, API_ENDPOINTS } from "../../config/api";
import { Card, LoadingSpinner } from "../../components/shared";

// ─────────────────────────────────────────────
//  Extracted sub-components with React.memo
// ─────────────────────────────────────────────

// Replaces the repeated quick-action button pattern
const QuickActionButton = memo(({ onClick, icon: Icon, label, darkMode }) => (
  <button
    onClick={onClick}
    className={`${
      darkMode
        ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
        : "bg-white border-gray-200 hover:bg-gray-50"
    } border rounded-lg p-4 flex items-center justify-center space-x-3 transition-colors`}
  >
    <Icon className={darkMode ? "text-blue-400" : "text-blue-600"} size={24} />
    <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
      {label}
    </span>
  </button>
));
QuickActionButton.displayName = "QuickActionButton";

// Replaces the repeated result row pattern in Recent Results table
const ResultRow = memo(({ result, index, isLast, darkMode }) => {
  const percentage = result.score?.percentage || result.percentage || 0;
  const passed = result.score?.passed || percentage >= 60;

  return (
    <div
      className={`grid grid-cols-3 gap-4 p-4 ${
        !isLast ? (darkMode ? "border-b border-gray-700" : "border-b border-gray-200") : ""
      }`}
    >
      <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
        {result.exam?.title || result.examTitle || "Unknown Exam"}
      </div>
      <div className={`font-bold ${darkMode ? "text-white" : "text-gray-900"} text-center`}>
        {percentage}%
      </div>
      <div className="text-center">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {passed ? "Pass" : "Fail"}
        </span>
      </div>
    </div>
  );
});
ResultRow.displayName = "ResultRow";

// Replaces the repeated subject progress bar pattern
const SubjectProgressBar = memo(({ subject, darkMode }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 ${subject.color} rounded-sm`}></div>
        <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
          {subject.subject}
        </span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {subject.percentage}%
        </span>
        <p className="text-xs text-gray-500">
          {subject.examsCompleted} out of {subject.totalExams} exams taken
        </p>
      </div>
    </div>
    <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
      <div
        className={`${subject.color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${subject.percentage}%` }}
      />
    </div>
  </div>
));
SubjectProgressBar.displayName = "SubjectProgressBar";

// ─────────────────────────────────────────────
// Static data — defined outside component to
// avoid recreation on every render
// ─────────────────────────────────────────────
const STUDY_RESOURCES = [
  { subject: "Mathematics", title: "Algebra Practice Problems", type: "PDF" },
  { subject: "English",     title: "Literacy Analysis Guide",   type: "Video" },
  { subject: "Science",     title: "Science Video Tutorials",   type: "Video" },
];

const SUBJECT_COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500"];

// ─────────────────────────────────────────────
// Helpers — defined outside component so they
// are not recreated on every render
// ─────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return "Not scheduled";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const formatTime = (minutes) => {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0
    ? `${hours} hour${hours > 1 ? "s" : ""} ${mins > 0 ? `${mins} min` : ""}`
    : `${mins} min`;
};

const calculateSubjectProgress = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    return [
      { subject: "Mathematics", percentage: 85, examsCompleted: 4, totalExams: 5, color: "bg-blue-500" },
      { subject: "Physics",     percentage: 92, examsCompleted: 3, totalExams: 4, color: "bg-green-500" },
      { subject: "ICT",         percentage: 75, examsCompleted: 3, totalExams: 4, color: "bg-purple-500" },
    ];
  }

  const subjectMap = {};
  results.forEach((result) => {
    const subject = result.exam?.title || result.examTitle || "Unknown";
    const percentage = result.score?.percentage || result.percentage || 0;
    if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0, subject };
    subjectMap[subject].total += percentage;
    subjectMap[subject].count += 1;
  });

  return Object.values(subjectMap)
    .map((data, index) => ({
      subject: data.subject,
      percentage: Math.round(data.total / data.count),
      examsCompleted: data.count,
      totalExams: data.count + 1,
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    }))
    .slice(0, 3);
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const ActiveDashboard = memo(() => {
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [upcomingExams, setUpcomingExams] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const examsResponse = await apiClient.get(API_ENDPOINTS.EXAMS);
        const examsData = examsResponse?.data?.exams || examsResponse?.data || [];

        setUpcomingExams(examsData.slice(0, 2));

        const resultsData = await Promise.all(
          examsData.map(async (exam) => {
            try {
              const result = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(exam._id));
              return result.data;
            } catch {
              return null;
            }
          }),
        );

        setAllResults(resultsData.filter(Boolean));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  //  useMemo — only recalculates when allResults changes
  const recentResults = useMemo(() => allResults.slice(0, 3), [allResults]);

  //  useMemo — only recalculates when allResults changes
  const progressBySubject = useMemo(() => calculateSubjectProgress(allResults), [allResults]);

  //  useCallback — stable reference, won't cause child re-renders
  const handleTakeExam = useCallback((examId) => {
    navigate(examId ? `/exam/${examId}/overview` : "/student/exams");
  }, [navigate]);

  //  useCallback — stable reference
  const handleViewAllResults = useCallback(() => {
    if (allResults.length > 0) {
      const examId = allResults[0].exam?._id || allResults[0].examId;
      navigate(examId ? `/exam/${examId}/result` : "/student/exams");
    } else {
      navigate("/student/exams");
    }
  }, [allResults, navigate]);

  //  BEFORE: full manual loading div — AFTER: LoadingSpinner
  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} px-4 sm:px-6 lg:px-8 py-6`}>

      {/* Greeting */}
      <div className="mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
          Hello {user?.firstName || "Joy"},
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Focus on your progress, ready your next exam
        </p>
      </div>

      {/* Quick Actions */}
      {/*  BEFORE: 2 repeated button blocks — AFTER: QuickActionButton component */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <QuickActionButton
            onClick={() => handleTakeExam(null)}
            icon={IoBookOutline}
            label="Take Exam"
            darkMode={darkMode}
          />
          <QuickActionButton
            onClick={handleViewAllResults}
            icon={IoStatsChartOutline}
            label="View All Results"
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
          Upcoming Exams
        </h2>

        {upcomingExams.length === 0 ? (
          //  BEFORE: manual dark/light div — AFTER: Card
          <Card className="p-6 text-center">
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              No upcoming exams at the moment
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingExams.map((exam, index) => (
              //  BEFORE: manual dark/light div — AFTER: Card
              <Card key={exam._id || index} className="p-5">
                <div className="mb-4">
                  <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-1`}>
                    {exam.title || "Untitled Exam"}
                  </h3>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {exam.description || "No description"}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                      📅 {formatDate(exam.schedule?.startDate)}
                    </span>
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                      ⏱️ {formatTime(exam.settings?.timeLimit || exam.timeLimit)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                      📝 {exam.questions?.length || 0} questions
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleTakeExam(exam._id)}
                  className={`w-full ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  } py-2 px-4 rounded-lg font-medium transition-colors`}
                >
                  Take Exam
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
          Recent Results
        </h2>

        {/*  BEFORE: manual dark/light div — AFTER: Card */}
        <Card className="overflow-hidden">
          {/* Table Header */}
          <div className={`grid grid-cols-3 gap-4 p-4 ${
            darkMode ? "border-b border-gray-700 bg-gray-750" : "border-b border-gray-200 bg-gray-50"
          }`}>
            {["Subject", "Score", "Status"].map((heading, i) => (
              <div
                key={heading}
                className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"} ${
                  i > 0 ? "text-center" : ""
                }`}
              >
                {heading}
              </div>
            ))}
          </div>

          {/* Table Body */}
          {/*  BEFORE: repeated result row divs — AFTER: ResultRow component */}
          {recentResults.length === 0 ? (
            <div className="p-6 text-center">
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No results yet</p>
            </div>
          ) : (
            recentResults.map((result, index) => (
              <ResultRow
                key={result._id || index}
                result={result}
                index={index}
                isLast={index === recentResults.length - 1}
                darkMode={darkMode}
              />
            ))
          )}
        </Card>
      </div>

      {/* Progress by Subject */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
          Progress by Subject
        </h2>

        {/*  BEFORE: manual dark/light div — AFTER: Card */}
        <Card className="p-6">
          {progressBySubject.length === 0 ? (
            <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              No progress data available
            </p>
          ) : (
            <div className="space-y-6">
              {/*  BEFORE: repeated progress bar blocks — AFTER: SubjectProgressBar component */}
              {progressBySubject.map((subject, index) => (
                <SubjectProgressBar key={index} subject={subject} darkMode={darkMode} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recommended Study Resources */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
          Recommended Study Resources
        </h2>

        {/*  BEFORE: manual dark/light div — AFTER: Card */}
        <Card className="p-6">
          <div className="space-y-4">
            {/*  BEFORE: inline array defined inside JSX — AFTER: STUDY_RESOURCES constant outside component */}
            {STUDY_RESOURCES.map((resource, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${
                  darkMode ? "bg-gray-750 border-gray-700" : "bg-gray-50 border-gray-200"
                } border rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}
              >
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{resource.subject}</p>
                  <h3 className={`font-medium ${darkMode ? "text-blue-400" : "text-blue-600"} mb-1`}>
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gray-500">{resource.type}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
});

ActiveDashboard.displayName = "ActiveDashboard";

export default ActiveDashboard;
