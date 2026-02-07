import { useTheme } from "../../context/ThemeContext.jsx";

const EmptyExams = ({ user, searchQuery }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-12`}>
      <div className="text-center">
        <div className="mb-6">
          <svg 
            className={`mx-auto h-24 w-24 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          {searchQuery ? 'No Exams Found' : 'No Exams Available'}
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md mx-auto`}>
          {searchQuery 
            ? `No exams match "${searchQuery}". Try a different search term.`
            : 'There are currently no exams scheduled for you. Check back later or contact your instructor for more information.'
          }
        </p>
        
        {!searchQuery && (
          <button 
            onClick={() => window.location.reload()}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyExams;
