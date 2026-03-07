import { memo } from "react";
import { 
  FiClock, 
  FiFileText,
  FiEdit3,
  FiTrendingUp
} from "react-icons/fi";
import { IoShieldOutline } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Card } from "../../components/shared";

// ✅ Extracted inner StatCard — replaces the 4 repeated icon+label+value blocks
const StatCard = memo(({ iconBg, Icon, iconColor, label, value }) => {
  const { darkMode } = useTheme();
  return (
    <Card className="p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className={iconColor} size={20} />
        </div>
        <div>
          <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
            {label}
          </p>
          <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = "StatCard";

// ✅ Stat cards config — adding a new stat card is now just one line here
const STAT_CARDS = [
  { iconBg: "bg-[#FBEBFF]", Icon: FiClock,      iconColor: "text-[#86249F]", label: "Upcoming Exams",           value: "-"  },
  { iconBg: "bg-[#FFF4E6]", Icon: FiFileText,   iconColor: "text-[#FF8C00]", label: "Total Certificates Earned", value: "-"  },
  { iconBg: "bg-[#E6F3FF]", Icon: FiEdit3,      iconColor: "text-[#1E90FF]", label: "Completed Exams",           value: "-"  },
  { iconBg: "bg-green-100", Icon: FiTrendingUp, iconColor: "text-green-600",  label: "Performance Score Trend",   value: "-%" },
];

// ✅ Wrapped with React.memo — EmptyDashboard only re-renders if user prop changes
const EmptyDashboard = memo(({ user }) => {
  const { darkMode } = useTheme();

  return (
    <>
      {/* Overview — 4 summary stat cards */}
      {/* ✅ BEFORE: 4 identical manual card divs — AFTER: map over config array */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4 sm:px-8">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* AI Integrity Status */}
      {/* ✅ BEFORE: manual bg-gray-800/white div — AFTER: Card */}
      <Card className="p-6 shadow-sm mb-8 mx-4 sm:mx-8">
        <div className="flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg">
            <IoShieldOutline className="text-red-600" size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
              AI Integrity Status
            </p>
            <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              -
            </p>
          </div>
        </div>
      </Card>

      {/* Ready to Start Journey */}
      <div className="mb-8">
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} text-left mb-6`}>
          Ready to start your journey,{" "}
          {(user?.firstName || "Student").charAt(0).toUpperCase() +
            (user?.firstName || "Student").slice(1)}?
        </p>

        <div className="flex justify-center mb-6">
          <img src="/Brazuca Chart.png" alt="Chart" className="w-64 h-64" />
        </div>

        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} text-center max-w-xs mx-auto`}>
          Your progress, results, and study recommendations will be tracked right
          here once you complete your first exam.
        </p>
      </div>
    </>
  );
});

EmptyDashboard.displayName = "EmptyDashboard";

export default EmptyDashboard;
