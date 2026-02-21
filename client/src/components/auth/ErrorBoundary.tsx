'use client';

import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error);
    console.error('Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center p-8 bg-white rounded-2xl sm:rounded-3xl shadow-lg max-w-md mx-4">
              <div className="mb-6">
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Критическая ошибка
                </h1>
                <p className="text-gray-600 mb-4">
                  В приложении произошла неожиданная ошибка. Наша команда уже уведомлена об этом.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-left bg-red-50 p-3 rounded border border-red-200 text-sm text-red-700">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Детали ошибки (only in dev)
                    </summary>
                    <pre className="overflow-auto text-xs">{this.state.error.message}</pre>
                  </details>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Попробовать снова</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Вернуться на главную</span>
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
