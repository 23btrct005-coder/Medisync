import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Lock, User, Eye, EyeOff, 
  ChevronRight, ShieldCheck, Zap 
} from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if(!username || !password) {
        setError('Node identifier and key required.');
        setIsLoading(false);
        return;
    }

    const result = await login(username, password);
    if (result.success) {
      if (result.role === 'ROLE_ADMIN') {
        navigate('/admin-dashboard');
      } else if (result.role === 'ROLE_DOCTOR') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A1A1A] p-6 relative overflow-hidden selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] rounded-full" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
          
          <div className="text-center space-y-4 mb-10">
            <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
              <Activity size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase tracking-tighter">
              Access Node
            </h2>
            <p className="text-emerald-100/40 text-[10px] font-black uppercase tracking-[0.3em]">
              Unified Healthcare OS
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within/field:text-emerald-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Clinical Identifier (Email)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                />
              </div>

              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within/field:text-emerald-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Security Key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group/check">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-4 h-4 rounded border border-white/10 bg-white/5 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Remember Node</span>
              </label>
              <Link to="/forgot-password" size={14} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
                Recover Key
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group/btn flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="relative z-10 flex items-center gap-2">
                {isLoading ? 'Decrypting...' : 'Initialize Access'}
                <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center space-y-4 text-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Node Request?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/register')}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Patient Join
              </button>
              <button
                onClick={() => navigate('/doctor-login')}
                className="py-3 px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Physician Portal
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-20">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
            <ShieldCheck size={12} className="text-emerald-500" /> AES-256 E2EE
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
            <Zap size={12} className="text-blue-400" /> Real-time Node Sync
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
