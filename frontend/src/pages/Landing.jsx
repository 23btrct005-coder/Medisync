import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, QrCode, Shield, Zap, Sparkles, 
  ArrowRight, ShieldCheck, Smartphone, Brain 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [step, setStep] = useState(1);

  const dashboardPath = userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/dashboard';

  useEffect(() => {
    // 1. Immediate redirect for logged-in users
    if (!loading && user) {
      navigate(dashboardPath);
      return;
    }

    // 2. Splash Sequence
    if (!loading && !user) {
      const t1 = setTimeout(() => setStep(2), 1500); // Shift to 'Why' after 1.5s
      const t2 = setTimeout(() => navigate('/login'), 3500); // Shift to Login after 3.5s total

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [user, loading, navigate, dashboardPath]);

  // Page 1: "The What"
  const PageOne = () => (
    <motion.div 
      key="page-one"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center space-y-8 h-full"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 bg-orange-500 text-white rounded-[2rem] shadow-2xl shadow-orange-500/30"
      >
        <Activity size={48} />
      </motion.div>
      
      <div className="space-y-2">
        <motion.h1 
          className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-tight"
        >
          Your health, <br />
          <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-rose-500 bg-clip-text text-transparent italic">
            Simply Synchronized.
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-2xl text-slate-400 font-bold uppercase tracking-[0.2em]"
        >
          The Clinical Bridge
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-8 grayscale opacity-50"
      >
        <div className="flex items-center gap-2 font-black text-xs tracking-widest uppercase"><ShieldCheck size={16} className="text-emerald-500" /> HIPAA Secure</div>
        <div className="flex items-center gap-2 font-black text-xs tracking-widest uppercase"><Brain size={16} className="text-blue-500" /> AI Insights</div>
      </motion.div>
    </motion.div>
  );

  // Page 2: "The Why"
  const PageTwo = () => (
    <motion.div 
      key="page-two"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center space-y-12 h-full max-w-5xl mx-auto px-6"
    >
      <div className="space-y-2">
         <motion.h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Why MediSync?</motion.h2>
         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Better Care. Faster Recovery.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
         {[
           { icon: QrCode, title: "Emergency Speed", desc: "Life-saving data via QR keys.", color: "orange" },
           { icon: Brain, title: "AI Intelligence", desc: "Clinical reports made simple.", color: "blue" },
           { icon: Shield, title: "Total Privacy", desc: "Secure RLS-locked sync.", color: "emerald" }
         ].map((item, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.15 }}
             className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4"
           >
             <div className={`p-4 bg-${item.color}-50 text-${item.color}-500 rounded-2xl`}>
                <item.icon size={32} />
             </div>
             <h4 className="font-black text-slate-900 text-lg">{item.title}</h4>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
           </motion.div>
         ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "linear" }}
            className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
          />
        </div>
        <div className="flex items-center gap-2 text-primary font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">
          Redirecting to Portal <Zap size={10} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) return null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAFAFE] relative selection:bg-orange-200">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <main className="h-full w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 ? <PageOne key="p1" /> : <PageTwo key="p2" />}
        </AnimatePresence>
      </main>

      {/* Mini Branding Footer */}
      <div className="absolute bottom-8 w-full flex justify-center items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
        <div className="p-1.5 bg-slate-900 text-white rounded-lg"><Activity size={14} /></div>
        <span className="text-xs font-black tracking-tighter text-slate-900 uppercase">MediSync Clinical Engine</span>
      </div>
    </div>
  );
};

export default Landing;
