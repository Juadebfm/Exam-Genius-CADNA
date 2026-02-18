import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Signin from "./pages/signin/signin.jsx";
import TwoFactorAuth from "./pages/TwoFactorAuth.jsx";
import RoleSelector from "./pages/registration/RoleSelector.jsx";
import AccountDetails from "./pages/registration/accountdetails.jsx";
import PersonalInfo from "./pages/registration/personalinfo.jsx";
import SecurityAndFinalize from "./pages/registration/securityandfinalize.jsx";
import CreatingAccount from "./pages/registration/CreatingAccount.jsx";
import RegistrationComplete from "./pages/registration/RegistrationComplete.jsx";
import StudentDashboard from "./dashboards/studentdashboard/StudentDashboard.jsx";
import InstructorDashboard from "./dashboards/instructor-dashboards/Dashboard.jsx";
import CreateExamPage from "./dashboards/instructor-dashboards/CreateExamPage.jsx";
import AdminDashboard from "./dashboards/admindashboard/AdminDashboard.jsx";
// import ExamTaking from "./pages/ExamTaking.jsx";
import ExamAccessPage from "./pages/ExamAccessPage.jsx";
import ExamEnrollment from "./pages/ExamEnrollment.jsx";
import ExamOverview from "./pages/exam/ExamOverview.jsx";
import WebcamCheck from "./pages/exam/WebcamCheck.jsx";
import ExamTaking from "./pages/exam/ExamTaking.jsx";
import ExamReview from "./pages/exam/ExamReview.jsx";
import ExamResult from "./pages/exam/ExamResult.jsx";
import StudentExams from "./pages/studentexams/StudentExams.jsx";
import StudentSettings from "./pages/StudentSettings.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import NotFound from "./pages/NotFound.jsx";
import StudentResults from "./pages/studentresults/StudentResults.jsx";

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <Signin />
              </PublicRoute>
            }
          />
          <Route
            path="/2fa"
            element={
              <PublicRoute>
                <TwoFactorAuth />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RoleSelector />
              </PublicRoute>
            }
          />
          <Route
            path="/register/account"
            element={
              <PublicRoute>
                <AccountDetails />
              </PublicRoute>
            }
          />
          <Route
            path="/register/personal"
            element={
              <PublicRoute>
                <PersonalInfo />
              </PublicRoute>
            }
          />
          <Route
            path="/register/security"
            element={
              <PublicRoute>
                <SecurityAndFinalize />
              </PublicRoute>
            }
          />
          <Route
            path="/registration/creating"
            element={
              <PublicRoute>
                <CreatingAccount />
              </PublicRoute>
            }
          />
          <Route
            path="/registration/complete"
            element={
              <PublicRoute>
                <RegistrationComplete />
              </PublicRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/settings"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor"
            element={
              <ProtectedRoute requiredRole="instructor">
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-exam"
            element={
              <ProtectedRoute requiredRole="instructor">
                <CreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/overview"
            element={
              <ProtectedRoute requiredRole="student">
                <ExamOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/webcam-check"
            element={
              <ProtectedRoute requiredRole="student">
                <WebcamCheck />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/taking"
            element={
              <ProtectedRoute requiredRole="student">
                <ExamTaking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/summary"
            element={
              <ProtectedRoute requiredRole="student">
                <ExamReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/result"
            element={
              <ProtectedRoute requiredRole="student">
                <ExamResult />
              </ProtectedRoute>
            }
          />
          <Route path="/exam/link/:examLink" element={<ExamEnrollment />} />
          <Route path="/exam/:examLink" element={<ExamEnrollment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
