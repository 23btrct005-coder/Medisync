import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Droplet, UserCircle, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  
  // Dummy form submission preventer since we don't have update API requirement
  const handleSubmit = (e) => {
      e.preventDefault();
      // Toast notification would go here in a real app
      alert("Profile updated successfully!");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your personal and medical information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <div className="card text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-500 to-primary-700"></div>
             
             <div className="relative pt-8">
                 <div className="mx-auto w-24 h-24 bg-white p-1 rounded-full shadow-md mb-4 flex items-center justify-center">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-primary-600">
                      <UserCircle size={64} />
                    </div>
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                 <p className="text-sm text-slate-500 mb-6">Patient ID: #{user.id}</p>
                 
                 <div className="border-t border-slate-100 pt-4 px-4 pb-2 space-y-4 text-left">
                    <div className="flex items-center text-slate-600">
                        <Droplet size={18} className="mr-3 text-red-500" />
                        <span className="text-sm font-medium">Blood Group:</span>
                        <span className="ml-auto font-semibold text-slate-800">{user.bloodGroup}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                        <Calendar size={18} className="mr-3 text-blue-500" />
                        <span className="text-sm font-medium">Age:</span>
                        <span className="ml-auto font-semibold text-slate-800">{user.age} Yrs</span>
                    </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="lg:col-span-2">
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4 mb-6">Personal Details</h3>
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <User size={16} />
                                </div>
                                <input type="text" defaultValue={user.name} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800" readOnly />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={16} />
                                </div>
                                <input type="email" defaultValue={user.email} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800 bg-slate-50" readOnly />
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4 mb-6 mt-8">Medical Information</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies & Conditions</label>
                        <textarea 
                           rows={4} 
                           defaultValue={user.medicalInfo} 
                           className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-slate-800"
                        />
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                        <button type="submit" className="flex items-center px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                            <Save size={18} className="mr-2" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
