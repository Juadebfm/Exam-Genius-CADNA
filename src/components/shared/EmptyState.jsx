import { useTheme } from "../../context/ThemeContext.jsx";
import Card from "./Card.jsx";

/**
 * Shared EmptyState component — replaces the repeated empty/no-data pattern
 * found in EmptyExams, StudentResults (no results), and ExamResult (error/not found).
 *
 * Props:
 *   icon        — emoji or string shown large at top (e.g. "📊", "❌")
 *   customIcon  — JSX element to use instead of emoji (e.g. your SVG in EmptyExams)
 *   title       — heading text
 *   description — subtext
 *   action      — optional JSX button/link rendered below description
 *   className   — extra classes on the outer Card (default "p-12")
 */
const EmptyState = ({
  icon,
  customIcon,
  title,
  description,
  action,
  className = "p-12",
}) => {
  const { darkMode } = useTheme();

  return (
    <Card className={className}>
      <div className="text-center">
        {/* Icon */}
        <div className="mb-6">
          {customIcon ? (
            customIcon
          ) : (
            <div className="text-6xl mb-4">{icon}</div>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-xl font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          } mb-2`}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            } mb-6 max-w-md mx-auto`}
          >
            {description}
          </p>
        )}

        {/* Action button (optional) */}
        {action && <div>{action}</div>}
      </div>
    </Card>
  );
};

export default EmptyState;
