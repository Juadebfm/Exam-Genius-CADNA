import { useTheme } from "../../context/ThemeContext.jsx";
import { EmptyState } from "../../components/shared";

const EmptyExams = ({ user, searchQuery }) => {
  const { darkMode } = useTheme();

 
  return (
    <EmptyState
      customIcon={
        <svg
          className={`mx-auto h-24 w-24 ${darkMode ? "text-gray-600" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      }
      title={searchQuery ? "No Exams Found" : "No Exams Available"}
      description={
        searchQuery
          ? `No exams match "${searchQuery}". Try a different search term.`
          : "There are currently no exams scheduled for you. Check back later or contact your instructor for more information."
      }
      action={
        !searchQuery && (
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            Refresh Page
          </button>
        )
      }
    />
  );
};

export default EmptyExams;
