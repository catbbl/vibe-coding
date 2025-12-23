import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Automatically log to console.error, which is intercepted by our Logger
    console.error('Uncaught Exception in Component', {
      componentStack: errorInfo.componentStack,
      originalError: error.message
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-800 rounded-lg m-4 border border-red-200">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <p className="mb-4">The error has been logged automatically.</p>
          <button 
            onClick={() => {
                this.setState({ hasError: false }); 
                window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
