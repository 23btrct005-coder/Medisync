import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { KeyRound, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [simulatedToken, setSimulatedToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/forgot-password', { username });
      setSuccess(true);
      // In a real app, we wouldn't show the token here, but for this simulation we do
      setSimulatedToken(response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process request. Ensure the username is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-4">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold">Account Recovery</h1>
          <p className="text-primary-100 mt-2 text-sm">Enter your username to reset your password</p>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your username (or email)"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle size={48} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Check Your Inbox</h3>
                <p className="text-slate-500 mt-2">
                  If an account exists for <span className="font-semibold text-slate-700">{username}</span>, 
                  a password reset link has been sent to the registered email address.
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Important</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The link will expire in 30 minutes. If you don't see it, check your spam folder or ensure your backend email settings are configured on Render.
                </p>
              </div>

              {/* Keep the simulated link for easier testing during development */}
              <details className="text-left">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                  Technical Debug Details (Hide for Lab Environment)
                </summary>
                <div className="mt-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-mono text-slate-600 break-all">
                    Reset Token: {simulatedToken}
                  </p>
                  <Link 
                    to={`/reset-password?token=${simulatedToken}`} 
                    className="text-primary-600 hover:underline font-mono text-[10px] mt-1 block"
                  >
                    Direct Reset URL &rarr;
                  </Link>
                </div>
              </details>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors font-sans">
              <ArrowLeft size={16} className="mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
