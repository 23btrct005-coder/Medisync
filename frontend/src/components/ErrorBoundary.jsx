import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Clinical System UI crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-red-100">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 flex items-center justify-center mb-8 animate-pulse">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Interface Failure
            </h1>
            
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              A critical error occurred while rendering the clinical interface. Our systems have logged the fault.
            </p>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg"
            >
              Attempt System Reboot
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
