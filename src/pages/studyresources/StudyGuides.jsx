import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import Header from "../../components/Layout/Header.jsx";
import Sidebar from "../../components/Layout/Sidebar.jsx";
import { apiClient } from "../../config/api";
import {
  IoSearchOutline,
  IoArrowBackOutline,
  IoBookOutline,
  IoFilterOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoEyeOutline,
} from "react-icons/io5";

const DIFFICULTY_COLORS = {
  easy: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  hard: "text-red-600 bg-red-50",
};

const StudyGuides = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedGuide, setExpandedGuide] = useState(null);

  const fetchGuides = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/study-resources?type=study-guide");
      if (res.success) setGuides(res.data);
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const difficulties = ["all", "easy", "medium", "hard"];

  const filteredGuides = guides.filter((g) => {
    const matchesSearch =
      !search ||
      g.topic?.toLowerCase().includes(search.toLowerCase()) ||
      g.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "all" || g.difficulty === activeFilter;
    return matchesSearch && matchesFilter;
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
            Study Guides
          </h1>
          <p className={`text-sm ${subText} mb-4`}>
            Your personalized curriculum, simplified.
          </p>

          {/* Search */}
          <div className="relative">
            <IoSearchOutline
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`}
              size={18}
            />
            <input
              type="text"
              placeholder="Search for guides..."
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

        {/* Guides Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`rounded-xl border overflow-hidden animate-pulse ${cardBg}`}
              >
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${cardBg}`}>
            <IoBookOutline className={`mx-auto mb-3 ${subText}`} size={40} />
            <p className={`text-sm font-medium ${text} mb-1`}>
              No study guides found
            </p>
            <p className={`text-xs ${subText} mb-4`}>
              Go back to Study Resources and click Auto Generate to create
              study guides based on your weak areas.
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
            {filteredGuides.map((guide) => (
              <div
                key={guide._id}
                className={`rounded-xl border overflow-hidden transition-all hover:shadow-md hover:border-blue-400 ${cardBg}`}
              >
                {/* Card Header */}
                <div className={`p-4 border-b flex items-start justify-between ${
                  darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <IoDocumentTextOutline className="text-blue-500" size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        Mastery Guide
                      </p>
                      <p className={`text-xs ${subText}`}>{guide.subject}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    PDF Document
                  </span>
                </div>

                {/* Document Preview */}
                <div className={`h-32 flex items-center justify-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <IoDocumentTextOutline
                    className={subText}
                    size={48}
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className={`text-sm font-semibold ${text} mb-1`}>
                    {guide.topic}
                  </p>
                  <p className={`text-xs ${subText} mb-3 line-clamp-2`}>
                    {guide.content?.summary ||
                      `A comprehensive guide focusing on ${guide.topic}, covering key concepts and detailed explanations.`}
                  </p>

                  {/* Key Points */}
                  {guide.content?.keyPoints?.length > 0 && (
                    <div className="mb-3">
                      {expandedGuide === guide._id ? (
                        <ul className={`text-xs ${subText} space-y-1 mb-2`}>
                          {guide.content.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}

                  <div className={`flex items-center gap-1 text-xs ${subText} mb-3`}>
                    <IoEyeOutline size={12} />
                    <span>{guide.content?.keyPoints?.length || 0} key points</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        DIFFICULTY_COLORS[guide.difficulty] ||
                        "text-gray-600 bg-gray-100"
                      }`}
                    >
                      {guide.difficulty}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedGuide(
                            expandedGuide === guide._id ? null : guide._id
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <IoEyeOutline size={12} />
                        {expandedGuide === guide._id ? "Hide" : "View"}
                      </button>
                      <button
                        className={`p-1.5 rounded-lg border transition-colors ${
                          darkMode
                            ? "border-gray-600 hover:border-blue-400 text-gray-400"
                            : "border-gray-200 hover:border-blue-400 text-gray-500"
                        }`}
                        title="Download"
                      >
                        <IoDownloadOutline size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedGuide === guide._id &&
                  guide.content?.detailedExplanation && (
                    <div
                      className={`px-4 pb-4 border-t pt-3 ${
                        darkMode
                          ? "border-gray-700 text-gray-300"
                          : "border-gray-100 text-gray-600"
                      }`}
                    >
                      <p className="text-xs leading-relaxed">
                        {guide.content.detailedExplanation}
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyGuides;