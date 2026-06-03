import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Erro ao carregar o app</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, opacity: 0.9 }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
