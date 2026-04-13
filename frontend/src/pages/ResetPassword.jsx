import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Lock, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold">New Password</h1>
          <p className="text-primary-100 mt-2 text-sm">Secure your account with a new password</p>
        </div>

        <div className="p-8">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start">
                  <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center p-3 bg-primary-50 text-primary-600 rounded-full">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Password Reset!</h3>
              <p className="text-slate-500">
                Your password has been successfully updated. You will be redirected to login shortly.
              </p>
              <Link to="/login" className="inline-block mt-4 text-primary-600 font-bold hover:underline">
                Login Now
              </Link>
            </div>
          )}

          {!success && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors font-sans">
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

