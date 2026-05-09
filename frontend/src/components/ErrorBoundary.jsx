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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-rose-100 to-rose-50 rounded-[4rem] blur-3xl opacity-50" />
            <div className="relative bg-white/80 backdrop-blur-2xl rounded-[3rem] p-12 text-center shadow-2xl border border-white">
              <div className="relative w-24 h-24 mx-auto mb-10">
                <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping" />
                <div className="relative w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center border border-rose-100">
                  <AlertCircle size={40} className="text-rose-500" />
                </div>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Node Offline</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Clinical Protocol Exception</p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                An unexpected interruption occurred in the clinical rendering engine. The event has been logged for administrative audit.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
              >
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                Attempt System Reboot
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
