import { Component } from 'react';
import { motion } from 'framer-motion';

// ThemeContext consumer for class component
import { createContext } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { isDark = true } = this.props;
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      const errorStack = this.state.error?.stack?.split('\n').slice(0, 5).join('\n') || '';

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-lg border ${
            isDark
              ? 'bg-[#0a0a0f] border-[#3a1a1a]'
              : 'bg-white border-red-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            {isDark ? (
              <span className="text-[#ff0055] font-mono text-lg" style={{ textShadow: '0 0 8px #ff005580' }}>
                ⚠ ERROR
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500 text-lg">⚠</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
              </div>
            )}
          </div>

          {/* Error message */}
          <div className={`p-4 rounded mb-4 font-mono text-xs overflow-x-auto ${
            isDark
              ? 'bg-[#1a0a0a] border border-[#3a1a1a] text-[#ff6b6b]'
              : 'bg-red-50 border border-red-100 text-red-700'
          }`}>
            <p className="font-bold mb-2">{errorMessage}</p>
            {errorStack && (
              <pre className={`text-[10px] mt-2 whitespace-pre-wrap ${
                isDark ? 'text-[#7a4a4a]' : 'text-red-400'
              }`}>
                {errorStack}
              </pre>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={this.handleReset}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              isDark
                ? 'bg-[#00ff4115] border border-[#00ff4140] text-[#00ff41] hover:bg-[#00ff4125] font-mono'
                : 'bg-gray-900 text-white hover:bg-gray-800 rounded-full'
            }`}
            style={isDark ? { textShadow: '0 0 8px #00ff4180' } : {}}
          >
            {isDark ? '> TRY_AGAIN' : 'Try Again'}
          </button>

          {isDark && (
            <p className="mt-3 text-[10px] font-mono text-[#4a7a4a]">
              // component crashed — click above to reset state
            </p>
          )}
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
