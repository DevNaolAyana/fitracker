import React from 'react';

/**
 * ErrorBoundary
 * Class component that wraps the app shell. Catches unexpected render errors
 * and shows a friendly recovery UI instead of a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--bg-color, #0B0B0F)',
          color: 'var(--text-color, #F5F5F5)',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255,82,54,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            marginBottom: '0.5rem',
          }}
        >
          ⚡
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted-color, #888)', maxWidth: '380px', margin: 0 }}>
          An unexpected error occurred. Your data is safe — this is just a display
          issue. Try reloading the page.
        </p>
        {this.state.error && (
          <details
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted-color, #888)',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              maxWidth: '480px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
              Error details
            </summary>
            <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.toString()}
            </code>
          </details>
        )}
        <button
          onClick={this.handleReload}
          style={{
            marginTop: '0.5rem',
            padding: '0.625rem 1.5rem',
            borderRadius: '12px',
            background: '#FF5236',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
