import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  IoHomeOutline, 
  IoDocumentTextOutline, 
  IoStatsChartOutline, 
  IoSettingsOutline,
  IoPeopleOutline,
  IoCreateOutline,
  IoLibraryOutline,
  IoChatbubbleOutline,
  IoLogOutOutline
} from "react-icons/io5";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContextDefinition.js";

const Sidebar = ({ isOpen, userRole = "student", onClose, darkMode }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const dm = darkMode ?? (() => {
    try { return JSON.parse(localStorage.getItem('userPrefs') || '{}').darkMode ?? false; }
    catch { return false; }
  })();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const studentLinks = [
    { to: "/student", icon: IoHomeOutline, label: "Dashboard" },
    { to: "/student/exams", icon: IoDocumentTextOutline, label: "Exams" },
    { to: "/student/results", icon: IoStatsChartOutline, label: "Results" },
    { to: "/student/resources", icon: IoLibraryOutline, label: "Study Resources" },
    { to: "/student/settings", icon: IoSettingsOutline, label: "Settings" }
  ];

  const adminLinks = [
    { to: "/admin", icon: IoHomeOutline, label: "Dashboard" },
    { to: "/admin/exams", icon: IoCreateOutline, label: "Manage Exams" },
    { to: "/admin/students", icon: IoPeopleOutline, label: "Students" },
    { to: "/admin/analytics", icon: IoStatsChartOutline, label: "Analytics" },
    { to: "/admin/settings", icon: IoSettingsOutline, label: "Settings" }
  ];

  const links = userRole === "admin" ? adminLinks : studentLinks;

  // Mobile open background: dark or light
  const mobileOpenBg   = dm ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const mobileTextBase = dm ? "text-gray-200" : "text-gray-700";
  const mobileHover    = dm ? "hover:bg-gray-700 hover:text-white" : "hover:bg-gray-100 hover:text-gray-900";
  const mobileActive   = dm ? "bg-gray-700 text-white" : "bg-blue-100 text-blue-600";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-16 bottom-0 left-0 z-50
          shadow-lg border-r
          transition-transform duration-300 ease-in-out
          w-64
          ${isOpen 
            ? `translate-x-0 ${mobileOpenBg}` 
            : "-translate-x-full lg:translate-x-0 lg:bg-blue-500 lg:border-blue-600"
          }
        `}
      >
        <nav className="space-y-2 flex-1 overflow-y-auto h-full flex flex-col pt-4">
          <div className="flex-1">
            {links.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || (to !== `/${userRole}` && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => window.innerWidth < 1024 && onClose && onClose()}
                  className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                    isActive
                      ? isOpen
                        ? mobileActive
                        : "bg-black bg-opacity-30 text-white"
                      : isOpen
                        ? `${mobileTextBase} ${mobileHover}`
                        : "text-white text-opacity-80 hover:bg-black hover:bg-opacity-20 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </NavLink>
              );
            })}
          </div>
          
          {/* Logout at bottom */}
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 px-6 py-3 transition-colors mt-auto ${
              isOpen 
                ? `${mobileTextBase} ${mobileHover}`
                : "text-white text-opacity-80 hover:bg-black hover:bg-opacity-20 hover:text-white"
            }`}
          >
            <IoLogOutOutline size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
