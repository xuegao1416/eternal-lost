import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: 32,
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 16, color: 'var(--danger)' }}>
            出错了
          </h1>
          <pre style={{
            background: 'var(--bg-secondary)', padding: 16, borderRadius: 8,
            fontSize: '0.85rem', maxWidth: 600, overflow: 'auto',
            color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error?.message}
          </pre>
          <button
            className="btn-primary"
            style={{ marginTop: 24 }}
            onClick={() => { this.setState({ hasError: false, error: null }); }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
