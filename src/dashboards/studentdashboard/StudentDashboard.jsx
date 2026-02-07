import { useState, useContext } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import Header from "../../components/Layout/Header";
import Sidebar from "../../components/Layout/Sidebar";
import ActiveDashboard from "./ActiveDashboard.jsx";
import EmptyDashboard from "./EmptyDashboard.jsx";

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();

  // Determine if student has activity (enrolled in exams or has results)
  
  
  const hasActivity = true;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        title="Dashboard"
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        userRole="student" 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="lg:ml-64 pt-20">
        {hasActivity ? (
          <ActiveDashboard />
        ) : (
          <EmptyDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
