import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, Activity } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center mb-8 rotate-12">
            <AlertTriangle size={40} className="text-primary -rotate-12" />
          </div>
          
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            System Error <span className="text-primary">404</span>
          </h1>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            The clinical quadrant you are attempting to access does not exist or has been relocated.
          </p>

          <button 
            onClick={() => navigate('/')}
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

export default NotFound;
