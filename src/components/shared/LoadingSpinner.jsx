import { useTheme } from "../../context/ThemeContext.jsx";
import Header from "../Layout/Header.jsx";
import Sidebar from "../Layout/Sidebar.jsx";
import { useState } from "react";

/**
 * Shared LoadingSpinner component — replaces the repeated pattern:
 * `<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>`
 *
 * Props:
 *   fullPage   — if true, renders the full page shell (Header + Sidebar + centered spinner)
 *                used in StudentResults, ExamResult loading states
 *   title      — page title passed to Header (only used when fullPage=true)
 *   onMenuToggle, onDarkModeToggle — Header callbacks (only used when fullPage=true)
 *   userRole   — passed to Sidebar (default "student")
 */
const LoadingSpinner = ({
  fullPage = false,
  title = "",
  userRole = "student",
  onMenuToggle,
  onDarkModeToggle,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const spinner = (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  );

  if (!fullPage) return spinner;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <Header
        onMenuToggle={onMenuToggle || (() => setSidebarOpen((p) => !p))}
        title={title}
        darkMode={darkMode}
        onDarkModeToggle={onDarkModeToggle || toggleDarkMode}
      />
      <Sidebar
        isOpen={sidebarOpen}
        userRole={userRole}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="lg:ml-64 pt-20 flex items-center justify-center min-h-screen">
        {spinner}
      </main>
    </div>
  );
};

export default LoadingSpinner;
