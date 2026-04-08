import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Lock, User, PlusCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const DoctorLogin = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', 
    name: '', email: '', specialization: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        const resp = await api.post('/auth/register/doctor', {
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          specialization: formData.specialization
        });
        
        setError('');
        alert(resp.data.message || 'Registration successful! You may now sign in.');
        setIsRegistering(false);
      } else {
        const result = await login(formData.username, formData.password);
        if (result.success && result.role === 'ROLE_DOCTOR') {
          navigate('/doctor-dashboard');
        } else {
          setError(result.message || 'Unauthorized access. Only doctors permitted.');
        }
      }
    } catch (err) {
      if (err.message === 'Network Error') {
        setError('Network Connection Failed: If you are on a mobile phone, your Vercel frontend is still trying to talk to the localhost on your Macbook. Ensure your backend is deployed to Render, and you re-deployed Vercel with the VITE_API_URL variable.');
      } else {
        setError(err.response?.data?.message || err.message || 'Server connection failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-800 rounded-b-[4rem] shadow-lg opacity-90 -z-10"></div>
      
      <div className="max-w-md w-full space-y-8 glass-panel p-10 bg-white shadow-2xl rounded-2xl border-t-4 border-blue-500">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner mb-4 border border-blue-200">
            <Stethoscope size={36} />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            Physician Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegistering ? 'Enroll in the Medisync Network' : 'Secure Provider Authentication'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            {isRegistering && (
                <>
                <div>
                  <input name="name" required placeholder="Full Name" onChange={handleChange}
                    className="block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
                </div>
                <div>
                  <input name="email" required placeholder="Professional Email" onChange={handleChange}
                    className="block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
                </div>
                <div>
                  <input name="specialization" required placeholder="Specialization" onChange={handleChange}
                    className="block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
                </div>
                </>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input name="username" type="text" required placeholder="Doctor ID / Username" value={formData.username} onChange={handleChange}
                className="pl-10 block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
            </div>

            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input name="password" type="password" required placeholder="Security Passphrase" value={formData.password} onChange={handleChange}
                className="pl-10 block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <button
              type="submit" disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Submit Credentials' : 'Access Dashboard')}
            </button>
          </div>
          
          <div className="mt-4 text-center border-t border-slate-200 pt-6">
            <button type="button" onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition"
            >
              {isRegistering ? 'Already enrolled? Log in' : 'New physician? Request Access'}
            </button>
            <br />
            <button type="button" onClick={() => navigate('/login')}
              className="text-xs text-slate-400 mt-4 underline hover:text-slate-600"
            >
              Return to Patient Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorLogin;
