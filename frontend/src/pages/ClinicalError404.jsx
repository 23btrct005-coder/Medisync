import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ClinicalError404 = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/');
      return;
    }

    if (userRole === 'ROLE_DOCTOR') {
      navigate('/doctor-dashboard');
    } else if (userRole === 'ROLE_ADMIN') {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden ring-4 ring-primary/5">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center mb-8 rotate-12">
            <AlertTriangle size={40} className="text-primary -rotate-12" />
          </div>
          
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            System Error <span className="text-primary">404</span>
          </h1>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-4">
            The clinical quadrant has entered an unstable state or does not exist at this address.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 mb-10 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Fault Address</p>
            <p className="text-xs font-mono text-slate-600 mt-2 break-all">{window.location.pathname}</p>
          </div>

          <button 
            onClick={handleDashboardRedirect}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg"
          >
            <Home size={18} />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalError404;
