import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { apiClient, API_ENDPOINTS } from "../../config/api";
import { FiArrowLeft } from "react-icons/fi";
import { PageLayout, LoadingSpinner, Card, EmptyState } from "../../components/shared";

const ExamResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);

  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);

        const examResponse = await apiClient.get(API_ENDPOINTS.EXAM_WITH_ANSWERS(examId));
        setExam(examResponse?.data || null);

        const resultResponse = await apiClient.get(API_ENDPOINTS.RESULT_BY_EXAM(examId));
        if (resultResponse.success || resultResponse.data) {
          const resultData = resultResponse.data || resultResponse;
          setResult(resultData);

          if (resultData.examSession) {
            try {
              const sessionResponse = await apiClient.get(API_ENDPOINTS.EXAM_SESSION(resultData.examSession));
              setSession(sessionResponse.data || sessionResponse);
            } catch (err) {
              console.error("Failed to fetch session:", err);
            }
          }
        } else {
          setError("Result not found");
        }
      } catch (error) {
        console.error("Failed to fetch result:", error);
        setError("Failed to load exam result");
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchResult();
  }, [examId]);

  const getStats = () => {
    if (!result || !exam) return null;
    const earnedScore = result.score?.earnedPoints || 0;
    const totalScore = result.score?.totalPoints || 100;
    const percentage = result.score?.percentage || 0;
    const timeSpent = result.analytics?.timeSpent || 0;
    const hours = Math.floor(timeSpent / 3600);
    const minutes = Math.floor((timeSpent % 3600) / 60);
    return {
      totalScore: `${earnedScore}/${totalScore}`,
      timeSpent: hours > 0 ? `${hours} hour ${minutes} minutes` : `${minutes} minutes`,
      accuracy: `${percentage}%`,
      percentage,
    };
  };

  const getQuestionBreakdown = () => {
    if (!exam || !session) return [];
    const questions = exam.questions || [];
    const answers = session.answers || [];

    return questions.map((question, index) => {
      const userAnswer = answers.find((a) => {
        const answerQId = a.questionId?._id || a.questionId;
        const currQId = question._id || question.id;
        return answerQId?.toString() === currQId?.toString();
      });

      const isCorrect = userAnswer?.isCorrect || false;

      let yourAnswerText = "-";
      if (userAnswer?.answer !== undefined && userAnswer?.answer !== null) {
        yourAnswerText =
          typeof userAnswer.answer === "boolean"
            ? userAnswer.answer ? "True" : "False"
            : String(userAnswer.answer);
      }

      let correctAnswerText = "-";
      if (question.correctAnswer !== undefined && question.correctAnswer !== null && question.correctAnswer !== "") {
        correctAnswerText =
          typeof question.correctAnswer === "boolean"
            ? question.correctAnswer ? "True" : "False"
            : String(question.correctAnswer).trim();
      } else if (question.options?.length) {
        const opt = question.options.find((o) => o.isCorrect === true);
        if (opt) correctAnswerText = opt.text || opt.value || "-";
      } else if (question.type === "short-answer" || question.type === "essay") {
        correctAnswerText = question.answerKey || question.expectedAnswer || "See instructor feedback";
      } else if (question.type === "coding") {
        correctAnswerText = "See test cases";
      }

      let topic = question.topic || "General";
      if (!question.topic) {
        const t = exam.title || "";
        if (t.includes("Mathematics") || t.includes("Math")) topic = "Mathematics";
        else if (t.includes("Physics")) topic = "Physics";
        else if (t.includes("Chemistry")) topic = "Chemistry";
        else if (t.includes("Biology")) topic = "Biology";
        else topic = (question.type || "general").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }

      return {
        number: index + 1,
        topic,
        difficulty: (question.difficulty || "medium").charAt(0).toUpperCase() + (question.difficulty || "medium").slice(1),
        yourAnswer: yourAnswerText,
        correctAnswer: correctAnswerText,
        result: isCorrect ? "Correct" : "Incorrect",
      };
    });
  };

  const stats = getStats();
  const questionBreakdown = getQuestionBreakdown();

 
  if (loading) return <LoadingSpinner fullPage title="Exam Result" />;

 
  if (error || !result) {
    return (
      <PageLayout title="Exam Result">
        <EmptyState
          icon="❌"
          title="Result Not Found"
          description={error || "No result available for this exam"}
          action={
            <button
              onClick={() => navigate("/student/results")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Results
            </button>
          }
        />
      </PageLayout>
    );
  }

  const cellClass = `py-3 px-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const thClass = `text-left py-3 px-4 text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const borderClass = darkMode ? "border-b border-gray-700" : "border-b border-gray-200";

  return (
    
    <PageLayout title="Exam Result">
      {/* Back Button */}
      <button
        onClick={() => navigate("/student/results")}
        className={`flex items-center space-x-2 mb-6 ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
      >
        <FiArrowLeft className="w-5 h-5" />
        <span>Back to Results</span>
      </button>

      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
          Results
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Exam Overview
        </p>
      </div>

     
      <Card className="p-6">
        {/* Exam Overview */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-6`}>
            Exam Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Score", value: stats?.totalScore || "0/100" },
              { label: "Time Spent", value: stats?.timeSpent || "0 minutes" },
              { label: "Accuracy", value: stats?.accuracy || "0%" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-2`}>{label}</p>
                <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Question Breakdown */}
        <div>
          <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
            Question Breakdown
          </h2>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={borderClass}>
                  {["Question","Topic","Difficulty","Your Answer","Correct Answer","Result"].map((h) => (
                    <th key={h} className={thClass}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questionBreakdown.map((q, index) => (
                  <tr key={index} className={index !== questionBreakdown.length - 1 ? borderClass : ""}>
                    <td className={cellClass}>Question {q.number}</td>
                    <td className={cellClass}>{q.topic}</td>
                    <td className={cellClass}>{q.difficulty}</td>
                    <td className={cellClass}>{q.yourAnswer}</td>
                    <td className={cellClass}>{q.correctAnswer}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        q.result === "Correct" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {q.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {questionBreakdown.map((q, index) => (
             
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-1`}>
                      Question {q.number}
                    </p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {q.topic} • {q.difficulty}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    q.result === "Correct" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {q.result}
                  </span>
                </div>
                <div className="space-y-2">
                  {[["Your Answer", q.yourAnswer], ["Correct Answer", q.correctAnswer]].map(([label, val]) => (
                    <div key={label}>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>{label}:</p>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </PageLayout>
  );
};

export default ExamResult;
