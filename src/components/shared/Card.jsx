import { useTheme } from "../../context/ThemeContext.jsx";

/**
 * Shared Card component — replaces the repeated pattern:
 * `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg`
 *
 * Props:
 *   className  — extra classes (e.g. "p-6", "p-12", "mb-6")
 *   children   — card content
 *   onClick    — optional click handler
 */
const Card = ({ children, className = "", onClick }) => {
  const { darkMode } = useTheme();

  return (
    <div
      onClick={onClick}
      className={`${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border rounded-lg ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
