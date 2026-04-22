import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";


import NotFound from "./pages/NotFound.jsx";





// Auth & Landing
const LandingPage         = lazy(() => import("./pages/LandingPage.jsx"));
const Signin              = lazy(() => import("./pages/signin/signin.jsx"));
const TwoFactorAuth       = lazy(() => import("./pages/TwoFactorAuth.jsx"));

// Registration
const RoleSelector        = lazy(() => import("./pages/registration/RoleSelector.jsx"));
const AccountDetails      = lazy(() => import("./pages/registration/accountdetails.jsx"));
const PersonalInfo        = lazy(() => import("./pages/registration/personalinfo.jsx"));
const SecurityAndFinalize = lazy(() => import("./pages/registration/securityandfinalize.jsx"));
const CreatingAccount     = lazy(() => import("./pages/registration/CreatingAccount.jsx"));
const RegistrationComplete= lazy(() => import("./pages/registration/RegistrationComplete.jsx"));

// Student
const StudentDashboard    = lazy(() => import("./dashboards/studentdashboard/StudentDashboard.jsx"));
const StudentExams        = lazy(() => import("./pages/studentexams/StudentExams.jsx"));
const StudentResults      = lazy(() => import("./pages/studentresults/StudentResults.jsx"));
const StudentSettings     = lazy(() => import("./pages/StudentSettings.jsx"));
const StudyResources = lazy(() => import("./pages/studyresources/StudyResources.jsx"));
const PracticeQuizzes = lazy(() => import("./pages/studyresources/PracticeQuizzes.jsx"));
const VideoLessons = lazy(() => import("./pages/studyresources/VideoLessons.jsx")); 
const HelpCenter = lazy(() => import("./pages/HelpCenter.jsx"));
const ContactSupport = lazy(() => import("./pages/ContactSupport.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.jsx"));

// Exam flow
const ExamOverview        = lazy(() => import("./pages/exam/ExamOverview.jsx"));
const WebcamCheck         = lazy(() => import("./pages/exam/WebcamCheck.jsx"));
const ExamTaking          = lazy(() => import("./pages/exam/ExamTaking.jsx"));
const ExamReview          = lazy(() => import("./pages/exam/ExamReview.jsx"));
const ExamResult          = lazy(() => import("./pages/exam/ExamResult.jsx"));
const ExamEnrollment      = lazy(() => import("./pages/ExamEnrollment.jsx"));
const ExamAccessPage      = lazy(() => import("./pages/ExamAccessPage.jsx"));

// Instructor
const InstructorDashboard = lazy(() => import("./dashboards/instructor-dashboards/Dashboard.jsx"));
const CreateExamPage      = lazy(() => import("./dashboards/instructor-dashboards/CreateExamPage.jsx"));

// Admin
const AdminDashboard      = lazy(() => import("./dashboards/admindashboard/AdminDashboard.jsx"));

// ─────────────────────────────────────────────
// Simple fullscreen loading fallback shown
// while a lazy page is being fetched
// ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        {/*  Suspense shows PageLoader while any lazy page loads */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<PublicRoute><Signin /></PublicRoute>} />
            <Route path="/2fa" element={<PublicRoute><TwoFactorAuth /></PublicRoute>} />

            {/* Registration */}
            <Route path="/register"                element={<PublicRoute><RoleSelector /></PublicRoute>} />
            <Route path="/register/account"        element={<PublicRoute><AccountDetails /></PublicRoute>} />
            <Route path="/register/personal"       element={<PublicRoute><PersonalInfo /></PublicRoute>} />
            <Route path="/register/security"       element={<PublicRoute><SecurityAndFinalize /></PublicRoute>} />
            <Route path="/registration/creating"   element={<PublicRoute><CreatingAccount /></PublicRoute>} />
            <Route path="/registration/complete"   element={<PublicRoute><RegistrationComplete /></PublicRoute>} />

            {/* Student */}
            <Route path="/student"         element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/exams"   element={<ProtectedRoute requiredRole="student"><StudentExams /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute requiredRole="student"><StudentResults /></ProtectedRoute>} />
            <Route path="/student/settings"element={<ProtectedRoute requiredRole="student"><StudentSettings /></ProtectedRoute>} />
            <Route path="/student/resources" element={<ProtectedRoute requiredRole="student"><StudyResources /></ProtectedRoute>} />
            <Route path="/student/resources/practice-quizzes" element={<ProtectedRoute requiredRole="student"><PracticeQuizzes /></ProtectedRoute>} />
            <Route path="/student/resources/video-lessons" element={<ProtectedRoute requiredRole="student"><VideoLessons /></ProtectedRoute>} />
            <Route path="/HelpCenter" element={<ProtectedRoute requiredRole="student"><HelpCenter /></ProtectedRoute>} />
            <Route path="/student/ContactSupport" element={<ProtectedRoute requiredRole="student"><ContactSupport /></ProtectedRoute>} />
            <Route path="/student/edit-profile" element={<ProtectedRoute requiredRole="student"><EditProfile /></ProtectedRoute>} />

            {/* Exam flow */}
            <Route path="/exam/:examId/overview"     element={<ProtectedRoute requiredRole="student"><ExamOverview /></ProtectedRoute>} />
            <Route path="/exam/:examId/webcam-check" element={<ProtectedRoute requiredRole="student"><WebcamCheck /></ProtectedRoute>} />
            <Route path="/exam/:examId/taking"       element={<ProtectedRoute requiredRole="student"><ExamTaking /></ProtectedRoute>} />
            <Route path="/exam/:examId/summary"      element={<ProtectedRoute requiredRole="student"><ExamReview /></ProtectedRoute>} />
            <Route path="/exam/:examId/result"       element={<ProtectedRoute requiredRole="student"><ExamResult /></ProtectedRoute>} />
            <Route path="/exam/link/:examLink"       element={<ExamEnrollment />} />
            <Route path="/exam/:examLink"            element={<ExamEnrollment />} />

            {/* Instructor */}
            <Route path="/instructor"  element={<ProtectedRoute requiredRole="instructor"><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/create-exam" element={<ProtectedRoute requiredRole="instructor"><CreateExamPage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
