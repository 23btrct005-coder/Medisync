import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, User, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Medical Records', path: '/records', icon: <ClipboardList size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
    { name: 'My Profile', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col shadow-xl z-30 w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
        <Activity className="text-primary-600 mr-2" size={24} />
        <span className="text-2xl font-bold text-slate-800 tracking-tight">MEDISYNC</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            onClick={() => {
                if (window.innerWidth < 768) setIsOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
