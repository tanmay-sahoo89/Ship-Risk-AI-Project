import { Component, type ErrorInfo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You can log the error to an error reporting service here
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-darkBg flex items-center justify-center px-4"
        >
          <div className="card max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-risk-high/20">
                <AlertTriangle className="w-8 h-8 text-risk-high" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-light mb-4">
              We encountered an unexpected error. Please try again.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-black/30 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-risk-critical font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReset}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/")}
                className="btn-secondary flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
