import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-gray-900 border border-red-500 rounded-2xl p-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">Something Went Wrong</h1>
              
              <p className="text-gray-300 mb-6">
                The application encountered an unexpected error. This has been logged for debugging.
              </p>
              
              {this.state.error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-red-400 font-medium mb-2">Error Details:</h4>
                  <code className="text-red-300 text-sm">
                    {this.state.error.name}: {this.state.error.message}
                  </code>
                </div>
              )}
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600 flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </button>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                If this issue persists, please contact support with the error details above.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;