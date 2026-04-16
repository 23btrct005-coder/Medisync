import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User, Eye, EyeOff } from 'lucide-react';
import LegalFooter from '../components/LegalFooter';

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
    
    // Quick validation
    if(!username || !password) {
        setError('Please enter both username and password.');
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
        navigate('/');
      }
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary-600 rounded-b-[4rem] shadow-lg opacity-90 -z-10"></div>
      
      <div className="max-w-md w-full space-y-8 glass-panel p-10 bg-white shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shadow-inner mb-4">
            <Activity size={36} />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to MEDISYNC
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Secure Patient Portal Login
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center animate-in fade-in slide-in-from-top-2">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Username (e.g. patient1)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-xl relative block w-full pl-10 pr-10 px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Password (e.g. password123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input 
                id="remember" 
                type="checkbox" 
                className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" 
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">Remember me</label>
            </div>
            <Link to="/forgot-password" title="Recover Account" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Forgot password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="mt-4 text-center border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600 mb-4">Don't have an account?</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full flex justify-center py-3 px-4 border shadow-sm text-sm font-medium rounded-xl text-primary-600 bg-white hover:bg-slate-50 border-primary-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Register here
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor-login')}
              className="mt-3 w-full flex justify-center py-2 px-4 shadow-sm text-sm font-medium rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all focus:outline-none"
            >
              Physician Portal
            </button>
          </div>
        </form>
        <LegalFooter />
      </div>
    </div>
  );
};

export default Login;

