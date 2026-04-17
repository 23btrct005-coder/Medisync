import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, User, LogOut, Activity, Calendar, UserCheck, CalendarPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const photoUrl = user?.id ? `${api.defaults.baseURL}/auth/patient/photo/${user.id}` : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pre-fetch logic to make the app feel instant
  const prefetchData = (path) => {
    try {
      if (path === '/dashboard/reports') {
        api.get('reports').catch(() => {});
      } else if (path === '/dashboard/records') {
        api.get('records/my-records').catch(() => {});
      } else if (path === '/dashboard') {
        api.get('records/my-records').catch(() => {});
        api.get('patient/requests').catch(() => {});
      }
    } catch (e) {
      // Slient fail for prefetch
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Medical History', path: '/dashboard/records', icon: <ClipboardList size={20} /> },
    { name: 'Reports', path: '/dashboard/reports', icon: <FileText size={20} /> },
    { name: 'Book Doctor', path: '/dashboard/booking', icon: <CalendarPlus size={20} /> },
    { name: 'My Appointments', path: '/dashboard/sessions', icon: <Calendar size={20} /> },
    { name: 'My Doctors', path: '/dashboard/doctors', icon: <UserCheck size={20} /> },
    { 
      name: 'My Profile', 
      path: '/dashboard/profile', 
      icon: (
        <div className="h-5 w-5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center -ml-1 mr-1">
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
          <User size={14} className={`${photoUrl ? 'hidden' : 'block'} text-slate-400`} />
        </div>
      )
    },
  ];

  return (
    <>
      <div className={`hidden md:flex flex-col border-r border-slate-200 bg-white shadow-xl z-30 w-64 h-screen shrink-0`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
        <Activity className="text-primary-600 mr-2" size={24} />
        <span className="text-2xl font-bold text-slate-800 tracking-tight">MEDISYNC</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/dashboard'}
            onMouseEnter={() => prefetchData(item.path)}
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
