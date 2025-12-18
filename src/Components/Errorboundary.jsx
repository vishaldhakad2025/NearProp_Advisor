// src/ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error bg-red-50 text-red-700 p-4 rounded-lg text-center">
          Error: {this.state.error?.message || 'Something went wrong'}
          <button className="btn btn-primary mt-3" onClick={() => this.props.navigate('/property')}>
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;