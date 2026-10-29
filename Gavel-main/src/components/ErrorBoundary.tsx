import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary, catches render errors and shows a recovery UI
 * instead of crashing the entire application with a white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.props.fallbackMessage || 'An unexpected error occurred. This has been logged for investigation.'}
            </p>
            {this.state.error && (
              <pre className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] font-mono text-red-400 max-w-md text-left overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-foreground/5 border border-border rounded-xl text-sm font-bold hover:bg-foreground/10 transition-all"
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
