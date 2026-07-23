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
        <div className="error-boundary">
          <div className="error-boundary__card">
            <h1 className="error-boundary__title">[!] 出错了</h1>
            <pre className="error-boundary__detail">
              {this.state.error?.message}
            </pre>
            <button
              className="btn btn-primary btn-typewriter"
              onClick={() => { this.setState({ hasError: false, error: null }); }}
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
