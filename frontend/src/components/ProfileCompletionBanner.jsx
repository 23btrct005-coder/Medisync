import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Camera, ShieldAlert } from 'lucide-react';

const ProfileCompletionBanner = () => {
  const { user, userRole, profileStatus } = useAuth();
  const navigate = useNavigate();

  // Safety Guard: If profileStatus is not provided by AuthContext, hide the banner
  if (!profileStatus || profileStatus.isComplete) return null;

  const targetPath = userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard/profile/edit' : '/dashboard/profile/edit';
  const missingLabel = profileStatus.missingFields?.join(', ') || 'Required Information';

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-5 shadow-sm overflow-hidden relative group">
        
        {/* Decorative background icon */}
        <ShieldAlert 
          size={120} 
          className="absolute -right-6 -bottom-6 text-amber-200/40 -rotate-12 group-hover:rotate-0 transition-transform duration-700" 
        />

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
            <AlertCircle size={28} />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-amber-900 font-extrabold text-lg">Incomplete Profile Detected</h4>
            <p className="text-amber-800/80 text-sm font-medium mt-1 leading-relaxed">
              To ensure medical accuracy and profile trustworthiness, please provide your:
              <span className="block mt-1 font-bold text-amber-900 underline decoration-amber-300 underline-offset-2 italic">
                {missingLabel}
              </span>
            </p>
          </div>

          <button 
            onClick={() => navigate(targetPath)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-md active:scale-95 shrink-0"
          >
            Complete Now
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      
      {/* Photo specific reminder if photo is missing */}
      {profileStatus.missingFields?.includes('Profile Photo') && (
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Camera size={18} />
            </div>
            <p className="text-xs font-semibold text-blue-800">
                <span className="font-bold">Tip:</span> Adding a profile photo helps patients and doctors identify you instantly.
            </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionBanner;
