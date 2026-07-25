import { Component } from 'react';

/**
 * Catches render errors from anywhere below it and shows a fallback instead of
 * a blank page. Must be a class component — only class lifecycles can catch
 * render errors in React.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this is where you'd forward to an error-reporting service.
    console.error('Render error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container notfound">
          <div className="glass notfound-card">
            <h1 className="gradient-text">Something went wrong</h1>
            <p className="muted">Please reload the page to continue.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
