import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Card } from "../../components/shared";

// ✅ Wrapped with React.memo — prevents re-render when parent re-renders
//    but exams list hasn't changed
const ActiveExams = memo(({ user, exams }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const startExam = (exam) => {
    const examId = exam.id || exam._id || exam.examId;
    const resultData = localStorage.getItem(`exam_result_${examId}`);
    if (resultData) return;
    navigate(`/exam/${examId}/overview`);
  };

  return (
    // ✅ BEFORE: manual bg-gray-800/white div — AFTER: Card
    <Card>
      <div>
        {exams.map((exam, index) => {
          const examId = exam.id || exam._id || exam.examId;
          const isCompleted = localStorage.getItem(`exam_result_${examId}`);

          return (
            // ✅ BEFORE: repeated manual dark/light border div — AFTER: Card
            <Card
              key={examId || index}
              className="p-6 flex items-start justify-between mb-5 last:mb-0 hover:opacity-90 transition-opacity"
            >
              <div className="flex-1 pr-6">
                <h3
                  className={`text-lg font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  } mb-2`}
                >
                  {exam.title || exam.name}
                </h3>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mb-4 leading-relaxed max-w-[404px]`}
                >
                  {exam.description || exam.subject}
                </p>

                <button
                  onClick={() => startExam(exam)}
                  disabled={!!isCompleted}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCompleted
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : darkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {isCompleted ? "Completed" : "Start Exam"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
});

ActiveExams.displayName = "ActiveExams";

export default ActiveExams;
