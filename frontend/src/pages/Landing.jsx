import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Shield, Zap, Sparkles, 
  ArrowRight, ShieldCheck, ChevronRight,
  Stethoscope, Database, Globe, Smartphone, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  const dashboardPath = userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/dashboard';

  if (!loading && user) {
    navigate(dashboardPath);
    return null;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 selection:bg-primary-500/30">
      {/* Dynamic Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <Activity size={24} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase text-slate-900">MediSync</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <a href="#features" className="hover:text-primary-600 transition-colors">Infrastructure</a>
          <a href="#security" className="hover:text-primary-600 transition-colors">Security</a>
          <a href="#ai" className="hover:text-primary-600 transition-colors">AI Engine</a>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-3 md:px-6 py-2 text-xs md:sm font-bold text-slate-600 hover:text-primary-600 transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-4 md:px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs md:sm font-bold transition-all shadow-lg shadow-primary-600/20 active:scale-95"
          >
            Join
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-10 md:pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[10px] font-black uppercase tracking-widest">
              <Zap size={12} /> Unified Healthcare OS
            </div>

            <h1 className="text-5xl md:text-8xl font-black leading-[1] md:leading-[0.9] tracking-tighter text-slate-900">
              Secure Healthcare, <br />
              <span className="text-primary-600 italic">Synced</span> Effortlessly.
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
              A production-ready record management system designed for clinical excellence. 
              Powered by AI and secured with enterprise-grade encryption.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/login')}
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-primary-600/20 active:scale-95"
              >
                Go to Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/doctor-login')}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 text-primary-600 border border-primary-200 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95"
              >
                <Stethoscope size={20} />
                I'm a Physician
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200 mt-4">
              <a 
                href="/downloads/medisync.ipa" download
                className="flex flex-1 items-center justify-center gap-3 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95"
              >
                <Smartphone size={18} />
                Download iOS (.ipa)
              </a>
              <a 
                href="/downloads/medisync.apk" download
                className="flex flex-1 items-center justify-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95"
              >
                <Download size={18} />
                Download Android (.apk)
              </a>
            </div>
          </motion.div>

          {/* Visual Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-20 bg-white border border-slate-200 p-8 rounded-[3rem] shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 blur-3xl rounded-full" />
              
              <div className="space-y-6 text-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center font-black text-white">M</div>
                    <div>
                      <h4 className="font-bold text-sm">Patient Unified Node</h4>
                      <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Linked ID: 81922534</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active Sync</div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Blood Glucose", val: "REAL-TIME", color: "text-primary-600" },
                    { label: "Heart Rate", val: "ACTIVE", color: "text-blue-600" },
                    { label: "Clinical AI Score", val: "SECURED", color: "text-indigo-600" },
                    { label: "Sync Latency", val: "<10ms", color: "text-orange-600" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{stat.label}</p>
                      <p className={`text-xl font-black ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Trust Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter text-slate-700">
            <Stethoscope size={20} className="text-primary-600" />
            Designed for Hospitals
          </div>
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter text-blue-600">
            <Zap size={20} />
            Instant Deploy 2026
          </div>
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter text-indigo-600">
            <Shield size={20} />
            Enterprise Grade
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
