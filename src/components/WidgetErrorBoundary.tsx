import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  widgetId: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for Dashboard Widgets
 * Catches errors in widget render/lifecycle and displays a fallback UI
 * Prevents a single widget crash from taking down the entire dashboard
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Widget "${this.props.widgetId}" crashed:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-accent-red/10 dark:bg-accent-red/20 border border-accent-red/50 dark:border-accent-red/60 rounded-button">
          <div className="text-center">
            <span className="text-3xl mb-3 block">⚠️</span>
            <h3 className="text-sm font-semibold text-accent-red dark:text-accent-red mb-2">
              Widget Error
            </h3>
            <p className="text-xs text-accent-red/80 dark:text-accent-red/90 mb-4 max-w-[200px]">
              This widget encountered an error and couldn't load.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-3 py-1.5 text-xs font-medium bg-accent-red hover:bg-accent-red-hover text-white rounded-button transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
