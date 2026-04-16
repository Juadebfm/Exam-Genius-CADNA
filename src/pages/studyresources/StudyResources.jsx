import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import Header from "../../components/Layout/Header.jsx";
import Sidebar from "../../components/Layout/Sidebar.jsx";
import { apiClient, API_ENDPOINTS } from "../../config/api";
import {
  IoSearchOutline,
  IoSparklesOutline,
  IoBookOutline,
  IoPlayCircleOutline,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoFilterOutline,
  IoChevronForwardOutline,
  IoTimeOutline,
  IoBarChartOutline,
  IoBulbOutline,
} from "react-icons/io5";

const CATEGORIES = [
  {
    id: "practice-quiz",
    label: "Practice Quizzes",
    icon: IoHelpCircleOutline,
    description: "Test your knowledge with mock exams",
    route: "/student/resources/practice-quizzes",
  },
  {
    id: "video-lesson",
    label: "Video Lessons",
    icon: IoPlayCircleOutline,
    description: "Learn from expert-led video content",
    route: "/student/resources/video-lessons",
  },
  {
    id: "study-guide",
    label: "Study Guides",
    icon: IoBookOutline,
    description: "Comprehensive guides to help you master concepts.",
    route: "/student/resources/study-guides",
  },
  {
    id: "past-question",
    label: "Past Questions",
    icon: IoDocumentTextOutline,
    description: "Practice with previous exam questions",
    route: "/student/resources/past-questions",
  },
];

const TYPE_LABELS = {
  "practice-quiz": "Quiz",
  "video-lesson": "Video",
  "study-guide": "Guide",
  "past-question": "Past Q",
};

const StudyResources = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestions, setSuggestions] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch AI suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      setSuggestionsLoading(true);
      const res = await apiClient.get("/api/study-resources/suggestions");
      if (res.success) setSuggestions(res.data);
    } catch {
      // silently fail
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  // Fetch study resources
  const fetchResources = useCallback(async (type = "") => {
    try {
      setLoading(true);
      const endpoint =
        type && type !== "all"
          ? `/api/study-resources?type=${type}`
          : "/api/study-resources";
      const res = await apiClient.get(endpoint);
      if (res.success) setResources(res.data);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
    fetchResources();
  }, [fetchSuggestions, fetchResources]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchResources(filter === "all" ? "" : filter);
  };

  const handleAutoGenerate = async () => {
    try {
      setGenerating(true);
      await apiClient.post("/api/study-resources/auto-generate", {});
      await fetchResources();
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    if (!search) return true;
    return (
      r.topic?.toLowerCase().includes(search.toLowerCase()) ||
      r.subject?.toLowerCase().includes(search.toLowerCase())
    );
  });

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
        {/* Page Header */}
        <div className={`rounded-xl border p-6 mb-6 ${cardBg}`}>
          <h1 className={`text-xl font-semibold ${text} mb-1`}>
            Find your Learning Resources
          </h1>
          <p className={`text-sm ${subText} mb-4`}>
            Personalized learning materials to help you prepare for your
            upcoming exams
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

          {/* AI Suggestions Banner */}
          <div
            className={`mt-4 border rounded-lg p-4 flex items-start gap-3 ${
              darkMode
                ? "bg-blue-900/20 border-blue-800"
                : "bg-blue-50 border-blue-100"
            }`}
          >
            <IoBulbOutline
              className="text-blue-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  darkMode ? "text-dark-300" : "text-dark-800"
                }`}
              >
                AI-Powered Suggestions
              </p>
              {suggestionsLoading ? (
                <p
                  className={`text-sm mt-0.5 ${
                    darkMode ? "text-dark-400" : "text-dark-600"
                  }`}
                >
                  Loading suggestions...
                </p>
              ) : suggestions?.hasResults === false ? (
                <p
                  className={`text-sm mt-0.5 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  Take some exams to get personalized recommendations.
                </p>
              ) : suggestions?.allPassing ? (
                <p
                  className={`text-sm mt-0.5 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  Great job! No weak areas detected. Keep it up!
                </p>
              ) : suggestions?.suggestions?.length > 0 ? (
                <p
                  className={`text-sm mt-0.5 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  Based on your recent activity, we recommend looking into:{" "}
                  {suggestions.suggestions.map((s, i) => (
                    <span key={i}>
                      <button
                        onClick={() => setSearch(s.topic)}
                        className={`font-semibold underline ${
                          darkMode
                            ? "text-blue-300 hover:text-blue-100"
                            : "text-blue-700 hover:text-blue-900"
                        }`}
                      >
                        {s.topic}
                      </button>
                      {i < suggestions.suggestions.length - 1 ? " and " : ""}
                    </span>
                  ))}
                </p>
              ) : (
                <p
                  className={`text-sm mt-0.5 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  No suggestions available yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="mb-6">
          <h2 className={`text-base font-semibold ${text} mb-4`}>
            Resource Categories
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(({ id, label, icon: Icon, description, route }) => (
              <button
                key={id}
                onClick={() => navigate(route)}
                className={`text-left rounded-xl border p-4 transition-all hover:shadow-md hover:border-blue-400 ${cardBg}`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <Icon className="text-blue-500" size={20} />
                </div>
                <p className={`text-sm font-semibold ${text} mb-1`}>{label}</p>
                <p className={`text-xs ${subText} leading-relaxed`}>
                  {description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* All Study Resources */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-base font-semibold ${text}`}>
              All Study Resources
            </h2>
            <button
              onClick={handleAutoGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <IoSparklesOutline size={14} />
              {generating ? "Generating..." : "Auto Generate"}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all"].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === filter
                    ? "bg-blue-600 text-white border-blue-600"
                    : darkMode
                      ? "bg-gray-800 text-gray-300 border-gray-700 hover:border-blue-400"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                <IoFilterOutline size={12} />
                {filter === "all" ? "All Filters" : TYPE_LABELS[filter]}
              </button>
            ))}
          </div>

          {/* Resources List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 animate-pulse ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-4 w-48 bg-gray-200 rounded" />
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className={`rounded-xl border p-12 text-center ${cardBg}`}>
              <IoBookOutline className={`mx-auto mb-3 ${subText}`} size={40} />
              <p className={`text-sm font-medium ${text} mb-1`}>
                No resources found
              </p>
              <p className={`text-xs ${subText} mb-4`}>
                Click "Auto Generate" to create personalized study resources
                based on your exam results.
              </p>
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Resources"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((resource) => (
                <button
                  key={resource._id}
                  onClick={() => {
                    if (resource.type === "video-lesson") {
                      window.open(resource.content?.videoUrl, "_blank");
                    } else {
                      navigate(`/student/resources/${resource._id}`);
                    }
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md hover:border-blue-400 ${cardBg}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${subText} mb-0.5`}>
                        {resource.subject}
                      </p>
                      <p
                        className={`text-sm font-semibold ${text} truncate mb-1`}
                      >
                        {resource.topic}
                      </p>
                      <div
                        className={`flex items-center gap-3 text-xs ${subText}`}
                      >
                        <span className="flex items-center gap-1">
                          <IoDocumentTextOutline size={12} />
                          {TYPE_LABELS[resource.type] || resource.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <IoBarChartOutline size={12} />
                          {resource.difficulty}
                        </span>
                        {resource.content?.questions?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <IoHelpCircleOutline size={12} />
                            {resource.content.questions.length} questions
                          </span>
                        )}
                        {resource.content?.videoDuration && (
                          <span className="flex items-center gap-1">
                            <IoTimeOutline size={12} />
                            {resource.content.videoDuration}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {resource.content?.thumbnailUrl ? (
                        <img
                          src={resource.content.thumbnailUrl}
                          alt={resource.topic}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center">
                          {resource.type === "video-lesson" ? (
                            <IoPlayCircleOutline
                              className="text-blue-400"
                              size={24}
                            />
                          ) : resource.type === "study-guide" ? (
                            <IoBookOutline
                              className="text-blue-400"
                              size={24}
                            />
                          ) : (
                            <IoHelpCircleOutline
                              className="text-blue-400"
                              size={24}
                            />
                          )}
                        </div>
                      )}
                      <IoChevronForwardOutline className={subText} size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudyResources;
