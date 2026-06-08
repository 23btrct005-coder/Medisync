import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const statusTimerRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatusMsg('');
    
    if(!username || !password) {
        setError('Please enter both username and password.');
        setIsLoading(false);
        return;
    }

    // Show "waking up" message after 5s to avoid users thinking it failed
    statusTimerRef.current = setTimeout(() => {
      setStatusMsg('⏳ Server is waking up from sleep — please wait a moment...');
    }, 5000);

    const result = await login(username, password);
    clearTimeout(statusTimerRef.current);
    setStatusMsg('');
    
    if (result.success) {
      if (result.role === 'ROLE_HOSPITAL_ADMIN' || result.role === 'ROLE_DOCTOR') {
        navigate('/hospital-dashboard/staff');
      } else if (result.role === 'ROLE_ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      if (result.pendingApproval) {
        navigate('/pending-approval');
      } else {
        setError(result.message);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full space-y-8 p-6 md:p-10 bg-white rounded-3xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
            <Activity size={32} className="text-blue-500" />
          </div>
          <h2 className="text-[2.5rem] font-black text-slate-900 tracking-tight leading-none mb-4">
            Welcome to MEDISYNC
          </h2>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Secure Patient Portal Login
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {statusMsg && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-sm font-medium border border-amber-100 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin shrink-0" />
              {statusMsg}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              id="username"
              name="username"
              type="text"
              required
              className="appearance-none rounded-xl block w-full px-4 py-4 bg-blue-50/50 border border-blue-100 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              placeholder="23btrct005@jainuniversity.ac.in"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-xl block w-full px-4 py-4 bg-blue-50/50 border border-blue-100 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400 hover:text-primary-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center">
              <input 
                id="remember" 
                type="checkbox" 
                className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" 
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-500 font-medium">Remember me</label>
            </div>
            <Link to="/forgot-password" size="sm" className="text-sm font-bold text-primary-600 hover:text-primary-700">
                Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-4 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-600/20 active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div className="pt-6 text-center border-t border-slate-50">
            <p className="text-sm text-slate-400 font-medium mb-4">Don't have an account?</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/register?context=patient')}
                className="w-full py-3.5 px-4 bg-white border border-slate-100 rounded-xl text-primary-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
              >
                Register here
              </button>
              <button
                type="button"
                onClick={() => navigate('/doctor-login')}
                className="w-full py-3.5 px-4 bg-blue-50/50 rounded-xl text-primary-600 font-bold text-sm hover:bg-blue-100/50 transition-all"
              >
                Physician Portal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
