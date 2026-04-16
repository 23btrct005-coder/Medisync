import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useState } from 'react';
import { Menu, ShieldAlert, Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search protocols, doctors..." 
                className="bg-transparent border-none text-sm focus:ring-0 placeholder-slate-400 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full bg-slate-50">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              System Live
            </div>
            
            <button onClick={() => toast("All system telemetry synchronized.", { icon: "🔔" })} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all relative">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-6">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user?.name || "Admin"}</p>
                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">Global Regulator</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/20">
                {user?.name?.charAt(0) || "A"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 md:p-10">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
