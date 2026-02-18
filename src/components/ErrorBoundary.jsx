import { Component } from 'react';
import { AuthContext } from '../context/AuthContextDefinition.js';

class ErrorBoundary extends Component {
  static contextType = AuthContext;
  
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('Error caught by boundary:', errorDetails);
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      // Replace with actual error reporting service
      console.error('Production error:', JSON.stringify(errorDetails));
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };
  
  handleGoHome = () => {
    const user = this.context?.user;
    if (user) {
      window.location.href = user.role === 'admin' ? '/admin' : '/student';
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-white">
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-8">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            
            <div className="space-x-4">
              <button
                onClick={this.handleRefresh}
                className="px-6 py-3 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2D6AC9]"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
