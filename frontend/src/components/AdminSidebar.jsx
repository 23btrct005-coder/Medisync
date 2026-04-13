import { NavLink } from 'react-router-dom';
import { 
  Users, LayoutDashboard, LogOut, ShieldCheck, 
  Settings, UserCheck, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Pending Doctors', path: '/admin-dashboard/pending', icon: UserCheck },
    { name: 'Settings', path: '/admin-dashboard/settings', icon: Settings },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary-500 p-2.5 rounded-2xl shadow-lg shadow-primary-500/20">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">ADMIN <span className="text-primary-500">PORTAL</span></h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20 active:scale-95' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold tracking-wide">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 pt-0">
          <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center font-black text-slate-300">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">System Admin</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Verified</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold active:scale-95 group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
