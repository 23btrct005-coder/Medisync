import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DoctorSidebar from '../components/DoctorSidebar';
import { useState } from 'react';
import { Activity, LogOut, UserCircle, Menu } from 'lucide-react';

const DoctorLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <DoctorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10 shadow-sm shrink-0">
        <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <Activity className="text-primary-600 mr-2 hidden sm:block" size={24} />
            <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">MEDISYNC <span className="hidden sm:inline-block text-sm font-medium text-primary-600 ml-2 border border-primary-200 bg-primary-50 px-2 py-1 rounded-full">Doctor Portal</span></span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-6">
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">{user?.name || "Doctor"}</span>
            <UserCircle size={28} className="text-primary-600" />
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors flex items-center">
            <LogOut size={20} className="sm:mr-1" /> <span className="hidden sm:inline text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 min-h-0">
        <div className="max-w-6xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
