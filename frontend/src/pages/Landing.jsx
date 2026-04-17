import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Activity, Shield, Zap, QrCode, Sparkles, 
  ChevronRight, Heart, Brain, Users, ArrowRight,
  ShieldCheck, Smartphone, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LegalFooter from '../components/LegalFooter';

const Landing = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const dashboardPath = userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/dashboard';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 10 }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFE] text-slate-900 font-sans selection:bg-orange-200">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">MEDISYNC</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/ai-disclaimer" className="hidden md:block text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors">How it works</Link>
            {user ? (
              <button 
                onClick={() => navigate(dashboardPath)}
                className="btn-premium bg-slate-900 text-white shadow-xl flex items-center gap-2 hover:bg-black"
              >
                Go to Dashboard <ChevronRight size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => navigate('/login')} className="text-sm font-black text-slate-900 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all">Sign In</button>
                <button onClick={() => navigate('/register')} className="btn-premium bg-orange-500 text-white shadow-lg shadow-orange-500/20 px-6 border-none hover:bg-orange-600">Get Started</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest text-orange-600 mb-8"
          >
            <Sparkles size={14} className="animate-pulse" />
            Empowering the Human Health Bridge
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[1.1] md:leading-[1.05]"
          >
            Your health, <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-rose-500 bg-clip-text text-transparent">Simply Synchronized.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-lg md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Bridge the gap between your diagnostic reports and physician insights with private, AI-powered health telemetry.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              Start Free Syncing <ArrowRight size={22} />
            </button>
            <button 
              onClick={() => navigate('/ai-disclaimer')}
              className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] font-black text-lg hover:bg-slate-50 transition-all"
            >
              Explore AI
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
          >
            <div className="flex items-center gap-2 font-black text-lg tracking-tighter uppercase"><ShieldCheck className="text-emerald-500" /> HIPAA Secure</div>
            <div className="flex items-center gap-2 font-black text-lg tracking-tighter uppercase"><Smartphone className="text-blue-500" /> PWA Ready</div>
            <div className="flex items-center gap-2 font-black text-lg tracking-tighter uppercase"><Layers className="text-orange-500" /> RLS Isolation</div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Storytelling Animation (The Swiggy Flow) ── */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">How MediSync Carries Your Care</h2>
            <p className="text-lg text-slate-500 font-medium uppercase tracking-widest text-[11px]">The CareBridge Protocol</p>
          </div>

          <div className="relative">
            {/* The Path Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-50 hidden lg:block -translate-y-1/2">
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-orange-400 via-blue-400 to-emerald-400 origin-left"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8 relative z-10">
              
              {/* Step 1: Sync */}
              <motion.div 
                whileInView="visible"
                initial="hidden"
                viewport={{ once: true, margin: "-100px" }}
                variants={itemVariants}
                className="text-center space-y-6"
              >
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-orange-100/50 rounded-[2.5rem] border-2 border-orange-200">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="text-orange-600"
                  >
                    <Smartphone size={48} />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">1</div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Secure Capture</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Upload your medical reports or capture vitals. Your data is instantly encrypted and isolated.
                </p>
              </motion.div>

              {/* Step 2: Analyze */}
              <motion.div 
                whileInView="visible"
                initial="hidden"
                viewport={{ once: true, margin: "-100px" }}
                variants={itemVariants}
                className="text-center space-y-6 lg:translate-y-12"
              >
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-blue-100/50 rounded-[2.5rem] border-2 border-blue-200">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="text-blue-600"
                  >
                    <Brain size={48} />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">2</div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">AI Insight Pulse</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Medisync AI distills complex jargon into clear clinical trends, spotting anomalies before they become symptoms.
                </p>
              </motion.div>

              {/* Step 3: Consult */}
              <motion.div 
                whileInView="visible"
                initial="hidden"
                viewport={{ once: true, margin: "-100px" }}
                variants={itemVariants}
                className="text-center space-y-6"
              >
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-emerald-100/50 rounded-[2.5rem] border-2 border-emerald-200">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="text-emerald-600"
                  >
                    <Users size={48} />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">3</div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Synchronized Care</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Your physician accesses your full clinical context instantly, leading to smarter diagnostics and faster recovery.
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Why Use MediSync? (Value Props) ── */}
      <section className="py-32 px-6 bg-[#FAFAFE]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20 items-center">
            
            <motion.div 
               whileInView="visible"
               initial="hidden"
               viewport={{ once: true }}
               variants={containerVariants}
               className="space-y-8"
            >
               <div className="space-y-4">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none italic">Choose Wellness.</h2>
                  <p className="text-xl text-slate-500 font-medium">Why thousands of families trust MediSync with their life-data.</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[
                   { icon: QrCode, title: "Emergency Speed", desc: "Instant access via physical QR keys in critical moments.", color: "orange" },
                   { icon: Shield, title: "Total Privacy", desc: "Your clinical data is RLS-locked. Nobody sees it without your key.", color: "blue" },
                   { icon: Zap, title: "Zero Wait-Times", desc: "Don't wait for office hours. AI analysis is instant, 24/7.", color: "rose" },
                   { icon: Heart, title: "Human Centric", desc: "Built with care to make healthcare feel human again.", color: "emerald" },
                 ].map((prop, i) => (
                   <motion.div 
                     key={i} 
                     variants={itemVariants}
                     className="p-6 bg-white rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group"
                   >
                     <div className={`p-3 bg-${prop.color}-50 text-${prop.color}-600 rounded-2xl w-fit mb-4 group-hover:bg-${prop.color}-500 group-hover:text-white transition-colors`}>
                        <prop.icon size={24} />
                     </div>
                     <h4 className="font-black text-slate-900 mb-2">{prop.title}</h4>
                     <p className="text-xs text-slate-500 font-medium leading-relaxed">{prop.desc}</p>
                   </motion.div>
                 ))}
               </div>
            </motion.div>

            <motion.div 
               initial={{ x: 100, opacity: 0 }}
               whileInView={{ x: 0, opacity: 1 }}
               viewport={{ once: true }}
               className="relative"
            >
               <div className="aspect-square bg-gradient-to-br from-orange-400 to-rose-500 rounded-[4rem] rotate-3 relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-3xl" />
                  <div className="absolute inset-0 p-12 flex flex-col justify-center items-center text-white text-center">
                     <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border border-white/30">
                        <Activity size={50} className="animate-pulse" />
                     </div>
                     <h3 className="text-4xl font-black mb-4">One Vital Pulse.</h3>
                     <p className="text-lg font-medium opacity-80 leading-relaxed">
                        Unified clinical history tracking across all diagnostic providers. One login, every insight.
                     </p>
                  </div>
                  {/* Floating Micro-UI elements */}
                  <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute top-20 right-10 p-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                      <div className="w-12 h-2 bg-white/40 rounded-full" />
                    </div>
                  </motion.div>
               </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Testimonial / Social Proof ── */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-12">
           <div className="flex justify-center -space-x-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-lg">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
           </div>
           <blockquote className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug italic">
             "Finally, an app that makes my medical data feel less like a filing cabinet and more like a partner in my recovery."
           </blockquote>
           <div>
              <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Sarah Jenkins</p>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">Surgical Recovery Lead</p>
           </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 blur-[100px] rounded-full" />
              <div className="relative z-10 space-y-8">
                 <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Ready to Bridge the Gap?</h2>
                 <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto">Join the future of synchronized healthcare today. Private. Powerful. Personal.</p>
                 <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                    <button 
                      onClick={() => navigate('/register')}
                      className="px-12 py-5 bg-orange-500 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all"
                    >
                      Join MediSync
                    </button>
                    <button 
                      onClick={() => navigate('/doctor-login')}
                      className="px-12 py-5 bg-white/10 text-white border border-white/20 backdrop-blur-lg rounded-[2rem] font-black text-xl hover:bg-white/20 transition-all"
                    >
                      Physician Portal
                    </button>
                 </div>
              </div>
          </div>
        </div>
      </section>

      <div className="bg-[#FAFAFE]">
        <LegalFooter />
      </div>

    </div>
  );
};

export default Landing;
