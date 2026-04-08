import { useAuth } from '../context/AuthContext';
import { User, Mail, Award, Activity } from 'lucide-react';

const DoctorProfile = () => {
  const { user, loading } = useAuth();

  if (loading) {
     return <div className="flex justify-center p-12"><div className="animate-spin text-primary-500"><Activity size={32} /></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your physician account details</p>
      </div>

      <div className="card shadow-sm border border-slate-200 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 bg-white">
        <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-5xl shrink-0">
          {user?.name?.charAt(0) || 'D'}
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-3xl font-bold text-slate-800">{user?.name || 'Dr. Unknown'}</h3>
          <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
            Active Provider
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card shadow-sm border border-slate-200 bg-white">
          <h4 className="flex items-center text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
            <User size={20} className="mr-2 text-primary-500" /> Professional Details
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Full Name</p>
              <p className="text-slate-800">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Specialization</p>
              <p className="text-slate-800 flex items-center">
                 <Award size={16} className="mr-1.5 text-amber-500" />
                 {user?.specialization || 'General Physician'}
              </p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border border-slate-200 bg-white">
          <h4 className="flex items-center text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
            <Mail size={20} className="mr-2 text-primary-500" /> Contact Information
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Registered Email</p>
              <p className="text-slate-800">{user?.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">System Username</p>
              <p className="text-slate-800">@{user?.user?.username || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
