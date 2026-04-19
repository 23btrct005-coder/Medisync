import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Shield, Zap, Sparkles, 
  ArrowRight, ShieldCheck, ChevronRight,
  Stethoscope, Database, Globe
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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A1A1A] text-white selection:bg-emerald-500/30">
      {/* Dynamic Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Activity size={24} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">MediSync</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-emerald-100/60">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Infrastructure</a>
          <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
          <a href="#ai" className="hover:text-emerald-400 transition-colors">AI Engine</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-sm font-bold hover:text-emerald-400 transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Join Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <Zap size={12} /> Unified Healthcare OS
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-white">
              Secure Healthcare, <br />
              <span className="text-emerald-400 italic">Synced</span> Effortlessly.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
              A production-ready record management system designed for clinical excellence. 
              Powered by AI and secured with enterprise-grade encryption.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/login')}
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-emerald-500/20 active:scale-95"
              >
                Go to Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-lg transition-all active:scale-95"
              >
                Request Demo
              </button>
            </div>

            <div className="flex items-center gap-8 pt-8 opacity-40">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" /> HIPAA Certified
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Globe size={14} className="text-blue-500" /> Global Nodes
              </div>
            </div>
          </motion.div>

          {/* Visual Showcase (Glass Card Stack) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-20 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/40 transition-all duration-700" />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-black">M</div>
                    <div>
                      <h4 className="font-bold text-sm">Patient Unified Node</h4>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Linked ID: 81922534</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Active Sync</div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Blood Glucose", val: "92 mg/dL", color: "text-emerald-400" },
                    { label: "Heart Rate", val: "72 BPM", color: "text-blue-400" },
                    { label: "Clinical AI Score", val: "9.8/10", color: "text-purple-400" },
                    { label: "Sync Latency", val: "14ms", color: "text-orange-400" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{stat.label}</p>
                      <p className={`text-xl font-black ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-emerald-400" />
                    <span className="text-xs font-bold">Cloud Instance Proactive</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* Ghost Cards */}
            <div className="absolute top-8 -right-8 w-full h-full bg-blue-500/10 backdrop-blur-md rounded-[3rem] -z-10 translate-x-4 translate-y-4" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-emerald-500/30 blur-[80px] -z-20" />
          </motion.div>

        </div>
      </main>

      {/* Trust Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter">
            <Stethoscope size={20} className="text-emerald-500" />
            Designed for Hospitals
          </div>
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter text-blue-400">
            <Zap size={20} />
            Instant Deploy 2026
          </div>
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter text-purple-400">
            <Shield size={20} />
            Enterprise Grade
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
