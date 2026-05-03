import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClinicalSovereignSidebar from '../components/ClinicalSovereignSidebar';
import { useState } from 'react';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import { Activity, LogOut, UserCircle, Menu } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';

const DoctorLayout = () => {
  const { user, userRole, logout } = useAuth();
  // AUTHORIZE CLINICAL ACCESS
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Session terminated. Security node isolated.');
    navigate('/login');
  };

  const photoUrl = user?.profilePictureUrl || (user?.id ? `${api.defaults.baseURL}/auth/${userRole === 'ROLE_DOCTOR' ? 'doctor' : 'hospital'}/photo/${user.id}` : null);

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      <ClinicalSovereignSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        <header className="relative h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-[300] shadow-sm shrink-0">
        <div className="flex items-center">
            <div className="md:hidden flex items-center gap-2 px-2 text-primary-600">
                <Activity size={24} />
                <span className="text-xl font-bold tracking-tight text-slate-800">MEDISYNC</span>
            </div>
            <Activity className="text-primary-600 mr-2 hidden md:block" size={24} />
            <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight hidden md:block">
              MEDISYNC 
              <span className="hidden sm:inline-block text-sm font-medium text-primary-600 ml-2 border border-primary-200 bg-primary-50 px-2 py-1 rounded-full">
                {userRole === 'ROLE_HOSPITAL_ADMIN' ? 'Hospital Portal' : 'Doctor Portal'}
              </span>
            </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-6">
          <div className="hidden sm:flex items-center space-x-3">
            <span className="text-sm font-bold text-slate-700">{user?.name || (userRole === 'ROLE_HOSPITAL_ADMIN' ? 'Administrator' : 'Doctor')}</span>
            <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary-100 bg-primary-50 flex items-center justify-center">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={user?.name} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <UserCircle size={28} className={`${photoUrl ? 'hidden' : 'block'} text-primary-600`} />
            </div>
          </div>
          
          <NotificationBell />
          
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors flex items-center">
            <LogOut size={20} className="sm:mr-1" /> <span className="hidden sm:inline text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 min-h-0 pb-24 md:pb-6 custom-scrollbar">
        <div className="max-w-6xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default DoctorLayout;
