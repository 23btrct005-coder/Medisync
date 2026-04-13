import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Bell, UserCircle, Menu } from 'lucide-react';
import api from '../api/axiosConfig';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
    const photoUrl = user?.id ? `${api.defaults.baseURL}/auth/patient/photo/${user.id}` : null;

    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10 shadow-sm shrink-0">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-slate-800 hidden sm:block">Patient Portal</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                <Bell size={20} />
              </button>
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <span className="text-sm font-bold text-slate-700">{user?.name || "Patient"}</span>
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
            </div>
          </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
