import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiUsers,
  FiShield,
  FiTrendingUp,
  FiBookOpen,
  FiMonitor,
  FiSmartphone,
  FiAward,
  FiEdit,
  FiLock,
  FiSettings,
  FiBarChart,
  FiCheckCircle,
} from "react-icons/fi";

// Add line-clamp utility
const addLineClampStyles = () => {
  if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.textContent = `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize line-clamp styles
addLineClampStyles();

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "Role-Based Dashboards",
      description:
        "Customized interfaces for students, instructors, and administrators with relevant tools and insights.",
    },
    {
      icon: <FiAward className="w-6 h-6" />,
      title: "AI Auto grading",
      description:
        "Intelligent grading system that handles objective and subjective questions with high accuracy.",
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Real-Time Integrity Checks",
      description:
        "Webcam monitoring, face detection, box-switch alerts, and behavioral analysis for exam security.",
    },
    {
      icon: <FiTrendingUp className="w-6 h-6" />,
      title: "AI powered insights",
      description:
        "Deep analytics on student performance, question difficulty, and learning outcomes.",
    },
    {
      icon: <FiBookOpen className="w-6 h-6" />,
      title: "Comprehensive Question Bank",
      description:
        "Extensive library of pre-built questions across subjects with easy import and export.",
    },
    {
      icon: <FiMonitor className="w-6 h-6" />,
      title: "Study Resource Recommendations",
      description:
        "AI suggests personalized learning materials based on student performance and weak areas.",
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Secure Exam Player",
      description:
        "Locked browser environment prevents cheating with screenshot blocking and restricted navigation.",
    },
    {
      icon: <FiSmartphone className="w-6 h-6" />,
      title: "Cross-Device Access",
      description:
        "Seamless experience across desktop, tablet, and mobile with responsive design.",
    },
  ];

  const steps = [
    {
      icon: <FiEdit className="w-6 h-6" />,
      title: "Create Your Exam",
      description:
        "Build assessments using your question bank or create custom questions with multiple formats including MCQ, essay, and coding challenge.",
      color: "blue",
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Secure exam delivery",
      description:
        "Students take exams with AI-powered proctoring including face detection, tab-switch alerts, and webcam monitoring for complete integrity.",
      color: "purple",
    },
    {
      icon: <FiSettings className="w-6 h-6" />,
      title: "AI- Auto grading",
      description:
        "Advanced AI instantly grades objective questions and provides intelligent scoring suggestions for subjective answers.",
      color: "green",
    },
    {
      icon: <FiBarChart className="w-6 h-6" />,
      title: "Analytics & Insights",
      description:
        "Get comprehensive performance analytics, identify learning gaps, and generate detailed reports for informed decision making.",
      color: "orange",
    },
  ];

  const benefits = [
    {
      title: "Always On Reliability",
      description:
        "We guarantee near-perfect uptime with a powerful backup system that ensures your critical exams start and finish without interruption.",
    },
    {
      title: "Peak Load Ready",
      description:
        "The platform is engineered to handle your highest traffic spikes without slowing down, guaranteeing a smooth experience for every student.",
    },
    {
      title: "Fully Accessible Platform",
      description:
        "Designed for ALL learners. Built to meet the highest global standards for accessibility, guaranteeing that all students, including those with specialized needs can successfully access and complete their assessments.",
    },
    {
      title: "80% Faster Grading",
      description:
        "AI–powered automation reduces grading time dramatically, letting educators focus on teaching.",
    },
    {
      title: "Multi-Format Support",
      description:
        "Easily create and grade diverse exam types, including multiple choice (MCQ), essay, and coding questions to perfectly match your curriculum needs.",
    },
  ];

  const bgColorMap = {
    blue: "bg-blue-50",
    purple: "bg-purple-50",
    green: "bg-green-50",
    orange: "bg-orange-50",
  };

  const iconColorMap = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    orange: "text-orange-500",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 h-16">
        <div className="mx-auto px-6 md:px-20">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src="/logo.png" alt="Assess Acad" className="w-8 h-8" />
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#home"
                className="text-blue-600 font-medium text-sm border-b-2 border-blue-600 pb-1"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-blue-600 font-medium text-sm hover:border-b-2 hover:border-blue-600 pb-1"
              >
                How it works
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600 font-medium text-sm hover:border-b-2 hover:border-blue-600 pb-1"
              >
                Testimonials
              </a>
              <a
                href="#support"
                className="text-gray-600 hover:text-blue-600 font-medium text-sm hover:border-b-2 hover:border-blue-600 pb-1"
              >
                Support
              </a>
            </nav>

            {/* Sign In Button */}
            <button
              onClick={() => navigate("/signin")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-white py-6 md:py-16 mt-16">
        <div className="mx-auto px-6 md:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <div>
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-2 bg-[#DBEAFE] rounded-full px-3 py-1.5 mb-4">
                <FiCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  Trusted by 500+ institutions
                </span>
              </div>

              {/* Primary Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
                Revolutionize
                <br />
                Assessments with AI-
                <br />
                Powered Integrity
              </h1>

              {/* Supporting Description */}
              <p className="text-base md:text-lg text-gray-600 mb-6 max-w-lg leading-relaxed">
                Conduct secure, intelligent exams with real-time proctoring,
                automated grading and comprehensive analytics. Transform how you
                assess knowledge.
              </p>

              {/* Primary CTA Button */}
              <button
                onClick={() => navigate("/register")}
                className="bg-blue-600 text-white px-7 py-3.5 rounded-lg hover:bg-blue-700 font-medium text-base transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Right Column - Hero Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="rounded-2xl overflow-hidden max-w-md lg:max-w-lg">
                <img
                  src="/landing page image.png"
                  alt="Professional woman using laptop in modern office"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="bg-[#D9F5FF] py-6 md:py-16">
        <div className="mx-auto px-6 text-center">
          {/* User Avatars */}
          <div className="flex items-center justify-center -space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500"></div>
            <div className="w-10 h-10 rounded-full bg-purple-500"></div>
            <div className="w-10 h-10 rounded-full bg-green-500"></div>
            <div className="w-10 h-10 rounded-full bg-orange-500"></div>
          </div>

          {/* Primary Metric Text */}
          <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            50,000+ active users
          </p>

          {/* Secondary Text */}
          <p className="text-sm md:text-base text-gray-600">
            Join users worldwide
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-6 md:py-16">
        <div className="mx-auto px-6 md:px-20">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, secure, and intelligent assessment process in four easy
              steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="text-center bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="w-full flex justify-center mb-3">
                  <div
                    className={`w-16 h-16 ${step.color === "blue" ? "bg-blue-600" : step.color === "purple" ? "bg-purple-600" : step.color === "green" ? "bg-green-600" : "bg-orange-600"} rounded-2xl flex items-center justify-center`}
                  >
                    <div className="text-white">{step.icon}</div>
                  </div>
                </div>
                <div className="w-full mb-3">
                  <span className="inline-block bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="w-full text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="w-full text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-6 md:py-16">
        <div className="mx-auto px-6 md:px-20">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Why Choose assess acad?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for reliability, security, and performance at scale
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left side - Benefits list */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1 relative">
                    <div className="absolute inset-0 border-2 border-green-600 rounded-full"></div>
                    <FiCheck className="w-5 h-5 text-green-600 relative z-10" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed border-b border-gray-200 pb-2">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side - Feature cards */}
            <div className="relative">
              {/* Background card (tilted) */}
              <div className="absolute inset-0 bg-blue-100 rounded-2xl transform rotate-3 w-96 h-96"></div>

              {/* Main card */}
              <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 w-96 h-96">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiShield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Enterprise Security
                  </h3>
                  <p className="text-gray-600 mt-2 border-b border-gray-200 pb-2">
                    Bank-level encryption and compliance
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Uptime Guarantee</span>
                    <span className="font-semibold text-gray-900">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Data Centers</span>
                    <span className="font-semibold text-gray-900">Global</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Support</span>
                    <span className="font-semibold text-gray-900">24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="bg-white py-6 md:py-16">
        <div className="mx-auto px-6 md:px-20">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Everything you need to access better
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive assessment tools designed for modern education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className="w-full flex justify-center mb-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <div className="text-blue-600">{feature.icon}</div>
                  </div>
                </div>
                <h3 className="w-full text-center font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="w-full text-center text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Insights Section */}
      <section className="bg-white py-6 md:py-16">
        <div className="mx-auto px-6 md:px-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Personalized{" "}
              <span className="text-blue-600">Insights & Tools</span>
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Customized features for students, instructors, and admins giving
              every role the exact features and data they need.
            </p>
          </div>

          {/* Role-specific sections */}
          <div className="mt-10 space-y-16">
            {/* Student Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Student Dashboard
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Clean, intuitive interface for tracking progress, results, and
                  personalized study recommendations with real-time analytics.
                </p>

                {/* Feature highlights */}
                <ul className="space-y-3 mb-6" role="list">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-blue-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      Progress tracking with visual analytics
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-blue-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      AI-powered study recommendations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-blue-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      Performance insights and weak area identification
                    </span>
                  </li>
                </ul>

                {/* Demo CTA */}
                <button
                  onClick={() => navigate("/demo/student")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  See Student Demo →
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src="/landing page image.png"
                  alt="Student dashboard showing progress tracking, study recommendations, and performance analytics"
                  width="600"
                  height="400"
                  className="w-full object-cover aspect-[3/2]"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Instructor Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="lg:order-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Instructor Dashboard
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Comprehensive exam creation and management tools with advanced
                  analytics and automated grading capabilities.
                </p>

                {/* Feature highlights */}
                <ul className="space-y-3 mb-6" role="list">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-purple-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      Question bank management and AI generation
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-purple-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      Real-time proctoring and integrity monitoring
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-purple-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      Automated grading with detailed analytics
                    </span>
                  </li>
                </ul>

                {/* Demo CTA */}
                <button
                  onClick={() => navigate("/demo/instructor")}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  See Instructor Demo →
                </button>
              </div>

              <div className="lg:order-1 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src="/landing page image.png"
                  alt="Instructor dashboard showing exam creation tools, analytics, and grading interface"
                  width="600"
                  height="400"
                  className="w-full object-cover aspect-[3/2]"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Admin Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Admin Dashboard
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Enterprise-level management console with comprehensive
                  reporting, user management, and system analytics.
                </p>

                {/* Feature highlights */}
                <ul className="space-y-3 mb-6" role="list">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-green-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      Institution-wide analytics and reporting
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-green-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      User management and role-based permissions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                      <FiCheck
                        className="w-3 h-3 text-green-700"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      System monitoring and security oversight
                    </span>
                  </li>
                </ul>

                {/* Demo CTA */}
                <button
                  onClick={() => navigate("/demo/admin")}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  See Admin Demo →
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src="/landing page image.png"
                  alt="Admin dashboard showing system analytics, user management, and institutional reporting"
                  width="600"
                  height="400"
                  className="w-full object-cover aspect-[3/2]"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Explore All Tools CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate("/features")}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
            >
              Explore All Tools →
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-white py-6 md:py-16">
        <div className="mx-auto px-6 md:px-20">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Trusted by Leading Institutions
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              See what educators and learners say about AssessAcad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="w-full flex items-center mb-3">
                <div className="text-blue-600 text-3xl font-bold">99</div>
              </div>
              <blockquote className="w-full text-gray-700 mb-3 leading-relaxed">
                "assess acad has transformed how we conduct online assessments.
                The AI proctoring gives us confidence in exam integrity while
                the automated grading saves hours of work."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold">DR</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Dr. Sarah Mitchell
                  </div>
                  <div className="text-gray-600 text-sm">
                    Professor, Stanford University
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="w-full flex items-center mb-3">
                <div className="text-blue-600 text-3xl font-bold">99</div>
              </div>
              <blockquote className="w-full text-gray-700 mb-3 leading-relaxed">
                "The platform is incredibly user-friendly. Students love the
                clean interface and I appreciate the detailed analytics that
                help me understand their performance better."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-semibold">MJ</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Michael Johnson
                  </div>
                  <div className="text-gray-600 text-sm">
                    High School Teacher, NYC
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="w-full flex items-center mb-3">
                <div className="text-blue-600 text-3xl font-bold">99</div>
              </div>
              <blockquote className="w-full text-gray-700 mb-3 leading-relaxed">
                "As an IT administrator, I'm impressed by the platform's
                security features and reliability. Zero downtime during our peak
                exam periods."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-semibold">LC</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa Chen</div>
                  <div className="text-gray-600 text-sm">
                    IT Director, UC Berkeley
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Top */}
          <div className="mt-8 text-center">
            <a
              href="#home"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#home")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              Back to Top
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200">
        <div className="mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-white">
                  assess acad
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                AI-powered assessment platform for modern education. Secure,
                intelligent, and accessible for all.
              </p>
            </div>

            {/* Product Column */}
            <nav aria-label="Product links">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/features"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="/security"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="/integration"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Integration
                  </a>
                </li>
              </ul>
            </nav>

            {/* Resources Column */}
            <nav aria-label="Resources links">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">
                Resources
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/docs"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="/help"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/case-studies"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Case Studies
                  </a>
                </li>
              </ul>
            </nav>

            {/* Contact Column */}
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-3">
                Contact
              </h4>
              <address className="not-italic text-sm text-slate-300 space-y-2">
                <div>
                  <a
                    href="tel:+2348038355340"
                    className="hover:text-white transition-colors"
                  >
                    +234 803 835 5340
                  </a>
                </div>
                <div>
                  <a
                    href="mailto:support@assessacad.ng"
                    className="hover:text-white transition-colors"
                  >
                    support@assessacad.ng
                  </a>
                </div>
                <div>Lagos, Nigeria</div>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    24/7 Support
                  </span>
                </div>
              </address>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800 py-6">
          <div className="mx-auto px-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-slate-400 mb-4 sm:mb-0">
              © 2025 AssessAcad. All rights reserved.
            </div>
            <div className="flex space-x-6 text-xs text-slate-400">
              <a
                href="/privacy"
                className="hover:text-slate-200 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="hover:text-slate-200 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/cookies"
                className="hover:text-slate-200 transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
