import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import Header from "../../components/Layout/Header.jsx";
import Sidebar from "../../components/Layout/Sidebar.jsx";
import { apiClient } from "../../config/api";
import {
  IoSearchOutline,
  IoArrowBackOutline,
  IoHelpCircleOutline,
  IoTimeOutline,
  IoBarChartOutline,
  IoFilterOutline,
  IoPlayOutline,
} from "react-icons/io5";

const DIFFICULTY_COLORS = {
  easy: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  hard: "text-red-600 bg-red-50",
};

const PracticeQuizzes = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        "/api/study-resources?type=practice-quiz",
      );
      if (res.success) setQuizzes(res.data);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const difficulties = ["all", "easy", "medium", "hard"];

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      !search ||
      q.topic?.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "all" || q.difficulty === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Add this function inside the component
const getUnsplashImage = (topic) => {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  return `https://api.unsplash.com/photos/random?query=${encodeURIComponent(topic)}&orientation=landscape&client_id=${key}`;
};


const [quizImages, setQuizImages] = useState({});

const fetchImage = useCallback(async (topic, id) => {
  try {
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(topic)}&orientation=landscape&client_id=${key}`
    );
    const data = await res.json();
    setQuizImages(prev => ({ ...prev, [id]: data.urls?.regular }));
  } catch {
    // silently fail
  }
}, []);

useEffect(() => {
  quizzes.forEach(quiz => fetchImage(quiz.topic || quiz.subject, quiz._id));
}, [quizzes, fetchImage]);



  const bg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const cardBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const text = darkMode ? "text-white" : "text-gray-900";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400";

  return (
    <div className={`min-h-screen ${bg}`}>
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        title="Study Resources"
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <Sidebar
        isOpen={sidebarOpen}
        userRole="student"
        onClose={() => setSidebarOpen(false)}
      />

      <main className="lg:ml-64 lg:mt-16 pt-16 p-4 sm:p-6 lg:p-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/student/resources")}
          className={`flex items-center gap-1.5 text-sm mb-4 ${subText} hover:text-blue-500 transition-colors`}
        >
          <IoArrowBackOutline size={16} />
          Back
        </button>

        {/* Page Header */}
        <div className={`rounded-xl border p-6 mb-6 ${cardBg}`}>
          <h1 className={`text-xl font-semibold ${text} mb-1`}>
            Practice Quizzes
          </h1>
          <p className={`text-sm ${subText} mb-4`}>
            Test your knowledge with mock exams
          </p>

          {/* Search */}
          <div className="relative">
            <IoSearchOutline
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`}
              size={18}
            />
            <input
              type="text"
              placeholder="Search for resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {difficulties.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === filter
                  ? "bg-blue-600 text-white border-blue-600"
                  : darkMode
                    ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-blue-400"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
              }`}
            >
              <IoFilterOutline size={12} />
              {filter === "all"
                ? "All Filters"
                : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`rounded-xl border overflow-hidden animate-pulse ${cardBg}`}
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${cardBg}`}>
            <IoHelpCircleOutline
              className={`mx-auto mb-3 ${subText}`}
              size={40}
            />
            <p className={`text-sm font-medium ${text} mb-1`}>
              No quizzes found
            </p>
            <p className={`text-xs ${subText} mb-4`}>
              Go back to Study Resources and click Auto Generate to create
              practice quizzes based on your weak areas.
            </p>
            <button
              onClick={() => navigate("/student/resources")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Go to Study Resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                className={`rounded-xl border overflow-hidden transition-all hover:shadow-md hover:border-blue-400 ${cardBg}`}
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img
                    src={quizImages[quiz._id] || ""}
                    alt={quiz.topic}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className={`text-xs ${subText} mb-0.5`}>{quiz.subject}</p>
                  <p className={`text-sm font-semibold ${text} mb-2`}>
                    {quiz.topic}
                  </p>

                  <div
                    className={`flex items-center gap-3 text-xs ${subText} mb-3`}
                  >
                    {quiz.content?.questions?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <IoHelpCircleOutline size={12} />
                        {quiz.content.questions.length} Questions
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <IoTimeOutline size={12} />
                      {quiz.content?.questions?.length
                        ? `${quiz.content.questions.length * 1.5} mins`
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        DIFFICULTY_COLORS[quiz.difficulty] ||
                        "text-gray-600 bg-gray-100"
                      }`}
                    >
                      Difficulty: {quiz.difficulty}
                    </span>
                    <button
                      onClick={() => navigate(`/student/resources/${quiz._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <IoPlayOutline size={12} />
                      Start Quiz
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PracticeQuizzes;
