import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#161616] border border-red-500/20 p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred in the application. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
