import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SlideX React ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#f87171',
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', maxWidth: '600px', width: '100%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: '#ef4444' }}>
              ⚠️ SlideX UI Render Exception
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              An uncaught rendering error occurred in the React application.
            </p>
            <pre style={{
              background: '#1e293b',
              padding: '14px',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '12px',
              textAlign: 'left',
              overflowX: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔄 Reload SlideX Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

