import { useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContextDefinition.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import { apiClient, API_ENDPOINTS } from "../../config/api";
import ActiveExams from "./ActiveExams";
import EmptyExams from "./EmptyExams";
import Header from "../../components/Layout/Header";
import Sidebar from "../../components/Layout/Sidebar";
import Loading from "../../components/UI/Loading";
import { IoSearchOutline } from "react-icons/io5";

const StudentExams = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();
  
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        
        const response = await apiClient.get(API_ENDPOINTS.EXAMS);
        console.log('Exams response:', response);
        
        let examsList = [];
        
        if (response && response.success && response.data) {
          if (Array.isArray(response.data)) {
            examsList = response.data;
          } else if (response.data.exams && Array.isArray(response.data.exams)) {
            examsList = response.data.exams;
          } else {
            examsList = [response.data];
          }
        } else if (response && Array.isArray(response.data)) {
          examsList = response.data;
        } else if (Array.isArray(response)) {
          examsList = response;
        }
        
        setExams(examsList);
        setFilteredExams(examsList);
        setError("");
      } catch (error) {
        console.error('API Error:', error);
        setError("Failed to connect to server");
        setExams([]);
        setFilteredExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);
  
  // Filter exams based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredExams(exams);
    } else {
      const filtered = exams.filter(exam =>
        exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExams(filtered);
    }
  }, [searchQuery, exams]);
  
  const hasExams = Array.isArray(filteredExams) && filteredExams.length > 0;
  
  if (loading) return <Loading />;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header 
        onMenuToggle={() => setSidebarOpen(prev => !prev)} 
        title="Exams" 
        darkMode={darkMode} 
        onDarkModeToggle={toggleDarkMode} 
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        userRole="student" 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="lg:ml-64 pt-20 px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Exams
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <IoSearchOutline 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
              size={20} 
            />
            <input
              type="text"
              placeholder="Search exams"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Available Exams Heading */}
        <div className="mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Available Exams
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {hasExams ? (
          <ActiveExams user={user} exams={filteredExams} />
        ) : (
          <EmptyExams user={user} searchQuery={searchQuery} />
        )}
      </main>
    </div>
  );
};

export default StudentExams;
