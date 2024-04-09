import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, stack:'' };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: error };
  }

  componentDidCatch(error, info) {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    console.error(error, info.componentStack);
    this.setState({ stack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div> Es ist ein Fehler aufgetreten: {this.state.hasError.message || this.state.hasError.toString()}
      <div style={{fontSize:'0.8em'}}>{this.state.stack}</div>
      </div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
