import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import Header from "../Layout/Header.jsx";
import Sidebar from "../Layout/Sidebar.jsx";

/**
 * Shared PageLayout component — eliminates the repeated Header + Sidebar + main shell
 * that appears in StudentExams, StudentResults, ExamResult, and StudentDashboard.
 *
 * BEFORE (repeated in every page):
 *   <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
 *     <Header onMenuToggle={...} title="..." darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />
 *     <Sidebar isOpen={sidebarOpen} userRole="student" onClose={...} />
 *     <main className="lg:ml-64 pt-20 px-4 sm:px-6 lg:px-8 py-6">
 *       {children}
 *     </main>
 *   </div>
 *
 * AFTER:
 *   <PageLayout title="Exams">
 *     {children}
 *   </PageLayout>
 *
 * Props:
 *   title       — passed to Header
 *   userRole    — passed to Sidebar (default "student")
 *   mainClass   — extra classes on <main> (default "px-4 sm:px-6 lg:px-8 py-6")
 *   children    — page content
 */
const PageLayout = ({
  title,
  userRole = "student",
  mainClass = "px-4 sm:px-6 lg:px-8 py-6",
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <Header
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        title={title}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <Sidebar
        isOpen={sidebarOpen}
        userRole={userRole}
        onClose={() => setSidebarOpen(false)}
      />
      <main className={`lg:ml-64 pt-20 ${mainClass}`}>{children}</main>
    </div>
  );
};

export default PageLayout;
