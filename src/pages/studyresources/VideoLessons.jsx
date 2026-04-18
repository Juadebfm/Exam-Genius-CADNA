import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import Header from "../../components/Layout/Header.jsx";
import Sidebar from "../../components/Layout/Sidebar.jsx";
import { apiClient } from "../../config/api";
import {
  IoSearchOutline,
  IoArrowBackOutline,
  IoPlayCircleOutline,
  IoTimeOutline,
  IoFilterOutline,
  IoBarChartOutline,
} from "react-icons/io5";

const DIFFICULTY_COLORS = {
  easy: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  hard: "text-red-600 bg-red-50",
};

const VideoLessons = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        "/api/study-resources?type=video-lesson"
      );
      if (res.success) setVideos(res.data);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const difficulties = ["all", "easy", "medium", "hard"];

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      !search ||
      v.topic?.toLowerCase().includes(search.toLowerCase()) ||
      v.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "all" || v.difficulty === activeFilter;
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

      <main className="lg:ml-64 mt-16 pt-16 p-4 sm:p-6 lg:p-8">
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
            Video Lessons
          </h1>
          <p className={`text-sm ${subText} mb-4`}>
            Seamless Video Lesson Progress Tracking
          </p>

          {/* Search */}
          <div className="relative">
            <IoSearchOutline
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`}
              size={18}
            />
            <input
              type="text"
              placeholder="Search for videos..."
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

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        ) : filteredVideos.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${cardBg}`}>
            <IoPlayCircleOutline
              className={`mx-auto mb-3 ${subText}`}
              size={40}
            />
            <p className={`text-sm font-medium ${text} mb-1`}>
              No video lessons found
            </p>
            <p className={`text-xs ${subText} mb-4`}>
              Go back to Study Resources and click Auto Generate to create
              video lessons based on your weak areas.
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
            {filteredVideos.map((video) => (
              <div
                key={video._id}
                className={`rounded-xl border overflow-hidden transition-all hover:shadow-md hover:border-blue-400 ${cardBg}`}
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gray-100 relative overflow-hidden group">
                  {video.content?.thumbnailUrl ? (
                    <img
                      src={video.content.thumbnailUrl}
                      alt={video.topic}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <IoPlayCircleOutline className="text-blue-400" size={48} />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <IoPlayCircleOutline className="text-blue-600" size={28} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className={`text-xs ${subText} mb-0.5`}>{video.subject}</p>
                  <p className={`text-sm font-semibold ${text} mb-2`}>
                    {video.content?.videoTitle || video.topic}
                  </p>

                  <div
                    className={`flex items-center gap-3 text-xs ${subText} mb-3`}
                  >
                    <span className="flex items-center gap-1">
                      <IoPlayCircleOutline size={12} />
                      Video
                    </span>
                    {video.content?.videoDuration && (
                      <span className="flex items-center gap-1">
                        <IoTimeOutline size={12} />
                        {video.content.videoDuration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <IoBarChartOutline size={12} />
                      {video.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        DIFFICULTY_COLORS[video.difficulty] ||
                        "text-gray-600 bg-gray-100"
                      }`}
                    >
                      Difficulty: {video.difficulty}
                    </span>
                    <button
                      onClick={() =>
                        window.open(video.content?.videoUrl, "_blank")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <IoPlayCircleOutline size={12} />
                      Watch Video
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

export default VideoLessons;