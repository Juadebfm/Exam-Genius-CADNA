# Exam Genius — CADNA Frontend

> A modern, role-based examination platform built with React 19 and Vite. CADNA enables students to take proctored exams, instructors to create and manage assessments, and administrators to oversee the entire platform — all in one place.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Folder Structure](#folder-structure)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [Pages & Routes](#pages--routes)
- [Key Components](#key-components)
- [Custom Hooks](#custom-hooks)
- [Services](#services)
- [API Integration](#api-integration)
- [Role-Based Access](#role-based-access)
- [Exam Integrity System](#exam-integrity-system)

---

## Project Overview

Exam Genius (CADNA) is a full-featured online examination system with three distinct user roles — **Student**, **Instructor**, and **Admin**. The platform supports:

- Secure, proctored exam sessions with real-time integrity monitoring
- AI-powered study resources including practice quizzes, study guides, video lessons, and past questions
- Multi-step user registration with role selection
- Two-factor authentication (2FA)
- Dark mode support
- Instructor exam creation and analytics
- Admin dashboard for platform oversight

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM v7 |
| HTTP Client | Axios |
| State Management | React Context API |
| Icons | React Icons |
| Code Splitting | React Lazy + Suspense |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/Exam-Genius-CADNA.git

# Navigate into the project
cd Exam-Genius-CADNA

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |

---

## Environment Variables

Create a `.env` file in the project root. Use `.env.example` as a reference.

```env
VITE_API_URL=http://localhost:5000
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

> **Note:** All environment variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL for the CADNA backend API |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API key for resource imagery |

---

## Folder Structure

```
Exam-Genius-CADNA/
├── public/                         # Static assets
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── Layout/                 # Layout wrappers
│   │   │   ├── ExamHeader.jsx      # Header used during exam sessions
│   │   │   ├── Header.jsx          # Global app header
│   │   │   └── Sidebar.jsx         # Navigation sidebar
│   │   ├── shared/                 # Shared utility components
│   │   │   ├── Card.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── FullscreenWarning.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── PageLayout.jsx
│   │   │   └── ViolationBadge.jsx
│   │   ├── UI/                     # Low-level UI elements
│   │   ├── ErrorBoundary.jsx       # Global error boundary
│   │   ├── LogoLink.jsx
│   │   ├── ProtectedRoute.jsx      # Auth + role guard
│   │   └── PublicRoute.jsx         # Redirects logged-in users
│   ├── config/
│   │   └── api.js                  # Axios instance & API endpoint constants
│   ├── constants/                  # App-wide constant values
│   ├── context/
│   │   ├── AuthContext.jsx         # Auth state provider (login, logout, 2FA)
│   │   ├── AuthContextDefinition.js# Auth context creation
│   │   └── ThemeContext.jsx        # Dark mode state provider
│   ├── dashboards/
│   │   ├── admindashboard/         # Admin dashboard views
│   │   ├── instructor-dashboards/  # Instructor dashboard + exam creation
│   │   └── studentdashboard/       # Student dashboard
│   ├── hooks/
│   │   └── useExamMonitoring.js    # Exam integrity & proctoring hook
│   ├── layout/                     # Page layout components
│   ├── pages/
│   │   ├── exam/                   # Full exam flow pages
│   │   │   ├── ExamOverview.jsx
│   │   │   ├── WebcamCheck.jsx
│   │   │   ├── ExamTaking.jsx
│   │   │   ├── ExamReview.jsx
│   │   │   └── ExamResult.jsx
│   │   ├── registration/           # Multi-step registration flow
│   │   │   ├── RoleSelector.jsx
│   │   │   ├── accountdetails.jsx
│   │   │   ├── personalinfo.jsx
│   │   │   ├── securityandfinalize.jsx
│   │   │   ├── CreatingAccount.jsx
│   │   │   └── RegistrationComplete.jsx
│   │   ├── signin/
│   │   │   └── signin.jsx
│   │   ├── studentexams/
│   │   ├── studentresults/
│   │   ├── studyresources/
│   │   │   ├── StudyResources.jsx
│   │   │   ├── PracticeQuizzes.jsx
│   │   │   ├── StudyGuides.jsx
│   │   │   ├── PastQuestions.jsx
│   │   │   └── VideoLessons.jsx
│   │   ├── ContactSupport.jsx
│   │   ├── EditProfile.jsx
│   │   ├── ExamAccessPage.jsx
│   │   ├── ExamEnrollment.jsx
│   │   ├── HelpCenter.jsx
│   │   ├── LandingPage.jsx
│   │   ├── NotFound.jsx
│   │   ├── StudentSettings.jsx
│   │   └── TwoFactorAuth.jsx
│   ├── services/                   # API service layer
│   ├── utils/                      # Utility/helper functions
│   ├── App.jsx                     # Root component with all routes
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
├── .env                            # Environment variables (not committed)
├── .env.example                    # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## State Management

CADNA uses **React Context API** with two global contexts:

### AuthContext
Defined in `src/context/AuthContext.jsx`

Manages all authentication state across the app.

| Value | Type | Description |
|---|---|---|
| `user` | Object | Currently logged-in user data |
| `loading` | Boolean | Whether auth is being initialized |
| `login` | Function | Authenticate with email and password |
| `logout` | Function | Clear session and redirect |
| `register` | Function | Create a new user account |
| `verifyTwoFA` | Function | Complete 2FA verification |

**Token storage:** Auth tokens are stored in `localStorage` under the keys `authToken`, `userData`, and `refreshToken`. The context automatically checks token expiration on load and refreshes every 60 seconds while a user is logged in.

### ThemeContext
Defined in `src/context/ThemeContext.jsx`

Manages dark mode preference, persisted in `localStorage`.

| Value | Type | Description |
|---|---|---|
| `darkMode` | Boolean | Current theme state |
| `toggleDarkMode` | Function | Toggle between light and dark mode |

---

## Authentication Flow

```
User visits /signin
      │
      ▼
POST /api/auth/login
      │
      ├── 2FA required? ──► Store tempToken ──► Redirect to /2fa
      │                                               │
      │                                               ▼
      │                                    POST /api/auth/verify-2fa-login
      │                                               │
      └── No 2FA ──────────────────────────────────── ▼
                                            Store authToken + userData
                                                       │
                                                       ▼
                                            Redirect by role:
                                            /student | /instructor | /admin
```

**Token Expiry Handling:**
- On app load, the token is decoded and its expiry checked locally without an API call
- If expired, a background refresh is attempted using the stored `refreshToken`
- If refresh fails, the user is logged out automatically
- A 60-second interval checks token validity while the user is active

---

## Pages & Routes

### Public Routes
Routes accessible without authentication. Logged-in users are redirected away.

| Path | Page | Description |
|---|---|---|
| `/` | LandingPage | Marketing/home page |
| `/signin` | Signin | Login page |
| `/2fa` | TwoFactorAuth | 2FA verification step |
| `/register` | RoleSelector | Step 1 of registration |
| `/register/account` | AccountDetails | Step 2 — account info |
| `/register/personal` | PersonalInfo | Step 3 — personal info |
| `/register/security` | SecurityAndFinalize | Step 4 — password & finish |
| `/registration/creating` | CreatingAccount | Account creation loading screen |
| `/registration/complete` | RegistrationComplete | Success confirmation |

### Student Routes
Requires authentication with role `student`.

| Path | Page | Description |
|---|---|---|
| `/student` | StudentDashboard | Main student dashboard |
| `/student/exams` | StudentExams | Browse available exams |
| `/student/results` | StudentResults | View past exam results |
| `/student/settings` | StudentSettings | Account settings |
| `/student/edit-profile` | EditProfile | Update profile info |
| `/student/resources` | StudyResources | Study resources hub |
| `/student/resources/practice-quizzes` | PracticeQuizzes | AI-generated quizzes |
| `/student/resources/study-guides` | StudyGuides | AI-generated study guides |
| `/student/resources/past-questions` | PastQuestions | Past exam questions |
| `/student/resources/video-lessons` | VideoLessons | Video learning resources |
| `/student/ContactSupport` | ContactSupport | Contact support team |
| `/HelpCenter` | HelpCenter | Help and FAQs |

### Exam Flow Routes
Full exam session flow — requires `student` role.

| Path | Page | Description |
|---|---|---|
| `/exam/:examId/overview` | ExamOverview | Exam details and rules |
| `/exam/:examId/webcam-check` | WebcamCheck | Camera verification before exam |
| `/exam/:examId/taking` | ExamTaking | Live exam session |
| `/exam/:examId/summary` | ExamReview | Answer review before submit |
| `/exam/:examId/result` | ExamResult | Score and result breakdown |
| `/exam/link/:examLink` | ExamEnrollment | Enroll via shared link |

### Instructor Routes
Requires authentication with role `instructor`.

| Path | Page | Description |
|---|---|---|
| `/instructor` | InstructorDashboard | Instructor overview and analytics |
| `/create-exam` | CreateExamPage | Create a new exam |

### Admin Routes
Requires authentication with role `admin`.

| Path | Page | Description |
|---|---|---|
| `/admin` | AdminDashboard | Platform-wide admin controls |

### Fallback

| Path | Page | Description |
|---|---|---|
| `*` | NotFound | 404 page |

---

## Key Components

### ProtectedRoute
`src/components/ProtectedRoute.jsx`

Wraps any route that requires authentication. Accepts a `requiredRole` prop to enforce role-based access. Redirects unauthenticated users to `/signin` and unauthorized roles to their correct dashboard.

```jsx
<ProtectedRoute requiredRole="student">
  <StudentDashboard />
</ProtectedRoute>
```

### PublicRoute
`src/components/PublicRoute.jsx`

Redirects already-authenticated users away from public pages like `/signin` and `/register`.

### ErrorBoundary
`src/components/ErrorBoundary.jsx`

Wraps the entire app to catch and gracefully display unhandled React errors instead of crashing the UI.

### PageLayout
`src/components/shared/PageLayout.jsx`

Standard page wrapper providing consistent padding, max-width, and layout structure across all pages.

### ViolationBadge
`src/components/shared/ViolationBadge.jsx`

Displays a real-time count of integrity violations during an active exam session.

### FullscreenWarning
`src/components/shared/FullscreenWarning.jsx`

Shown when a student exits fullscreen mode during an exam, prompting them to return.

---

## Custom Hooks

### `useExamMonitoring`
`src/hooks/useExamMonitoring.js`

The core exam proctoring hook. Attaches browser-level event listeners to detect and log cheating attempts in real time.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `sessionId` | String | Active exam session ID |
| `examId` | String | Current exam ID |
| `enabled` | Boolean | Whether monitoring is active |
| `onIntegrityEvent` | Function | Callback fired on each violation |

**Returns:**

| Value | Type | Description |
|---|---|---|
| `isFullscreen` | Boolean | Whether the browser is in fullscreen |
| `violations` | Object | Breakdown of violation counts by type |
| `totalViolations` | Number | Total violation count |
| `isLoading` | Boolean | Whether initial violations are being fetched |
| `logEvent` | Function | Manually log a custom integrity event |

**Monitored Events:**

- Tab switches and window blur
- Fullscreen exit or denial
- Copy, paste, and cut attempts
- Right-click context menu
- DevTools shortcuts (F12, Ctrl+Shift+I)
- Alt+Tab keyboard shortcut

---

## Services

The `src/services/` directory contains all direct API call logic, keeping pages and components clean.

| Service | Description |
|---|---|
| `examMonitoringService` | Logs and retrieves exam integrity events from the backend |

---

## API Integration

### Axios Configuration
`src/config/api.js`

A centralized Axios instance is configured with the base URL from `VITE_API_URL`. All API calls go through this instance, which automatically attaches the `authToken` from `localStorage` as a Bearer token on every request.

### Endpoint Constants
All API endpoints are defined as named constants in `src/config/api.js`, for example:

```js
API_ENDPOINTS.LOGIN     // → /api/auth/login
API_ENDPOINTS.REGISTER  // → /api/auth/register
```

This prevents hardcoded URLs scattered across the codebase.

### Backend Base URL
```
Production: https://cadna-backend-kpgj.onrender.com
Local:      http://localhost:5000
```

### Backend postman URL
https://documenter.getpostman.com/view/49543429/2sBXigKsHi#d957595f-3d5c-47d8-a21d-9bd6bee770e3

---

## Role-Based Access

The app supports three user roles, each with its own dashboard and accessible routes:

| Role | Dashboard Route | Access Level |
|---|---|---|
| `student` | `/student` | Exams, results, study resources |
| `instructor` | `/instructor` | Exam creation, student analytics |
| `admin` | `/admin` | Full platform control |

Role is stored in the user object returned from the backend on login and saved to `localStorage`. The `ProtectedRoute` component reads this role to enforce access control on every protected page.

---

## Exam Integrity System

CADNA implements a client-side proctoring system that runs throughout every exam session.

**How it works:**

1. When a student starts an exam, `useExamMonitoring` is initialized with the active `sessionId`
2. The hook fetches any existing violations from the backend for that session
3. Browser event listeners are attached to monitor for suspicious activity
4. Each detected violation is logged locally (for immediate UI feedback) and sent to the backend via `onIntegrityEvent`
5. Violations are categorized by type and severity and stored against the exam session

**Violation Types & Severity:**

| Event | Severity |
|---|---|
| Tab switch | High |
| Fullscreen exit | High |
| DevTools attempt | High |
| Window blur | Medium |
| Fullscreen denied | Medium |
| Copy / Cut attempt | Low |
| Paste attempt | Low |
| Right-click | Low |

Instructors and admins can view integrity reports per session from the backend analytics dashboard.