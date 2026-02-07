import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";

const ActiveExams = ({ user, exams }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const startExam = (exam) => {
    const examId = exam.id || exam._id || exam.examId;

    // Check if exam has been completed
    const resultData = localStorage.getItem(`exam_result_${examId}`);
    if (resultData) return;

    navigate(`/exam/${examId}/overview`);
  };

  return (
    <div
      className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-lg`}
    >
      <div>
        {exams.map((exam, index) => {
          const examId = exam.id || exam._id || exam.examId;
          const isCompleted = localStorage.getItem(`exam_result_${examId}`);

          return (
            <div
              key={examId || index}
              className={`p-6 flex items-start justify-between ${
                darkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"
              } transition-colors mb-5 last:mb-0 border rounded-lg ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex-1 pr-6 ">
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}
                >
                  {exam.title || exam.name}
                </h3>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-4 leading-relaxed max-w-[404px]`}
                >
                  {exam.description || exam.subject}
                </p>

                <button
                  onClick={() => startExam(exam)}
                  disabled={isCompleted}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveExams;
