import { useContext, memo } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { PageLayout } from "../../components/shared";
import ActiveDashboard from "./ActiveDashboard.jsx";
import EmptyDashboard from "./EmptyDashboard.jsx";

// ✅ Wrapped with React.memo — won't re-render unless user/darkMode changes
const StudentDashboard = memo(() => {
  const { user } = useContext(AuthContext);
  const { darkMode } = useTheme();

  const hasActivity = true;

  return (
    // ✅ BEFORE: manual sidebarOpen state + Header + Sidebar + min-h-screen div (15 lines)
    // ✅ AFTER: PageLayout handles all of it — sidebarOpen state lives inside PageLayout
    <PageLayout title="Dashboard" mainClass="">
      {hasActivity ? (
        <ActiveDashboard />
      ) : (
        <EmptyDashboard user={user} />
      )}
    </PageLayout>
  );
});

StudentDashboard.displayName = "StudentDashboard";

export default StudentDashboard;
