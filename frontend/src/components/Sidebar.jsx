import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, ClipboardList, User, LogOut, Activity, 
  Calendar, UserCheck, CalendarPlus, ShieldCheck, Pill, Wallet, 
  MessageSquare, Settings, HelpCircle, ChevronDown, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/axiosConfig';
import { useState } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { unreadChatCount } = useNotifications();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const photoUrl = user?.profilePictureUrl || (user?.id ? `${api.defaults.baseURL}/auth/patient/photo/${user.id}` : null);

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
      // Silent fail for prefetch
    }
  };

  // ── MAIN NAV: Most-used features ──
  const mainItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Messages', path: '/dashboard/messages', icon: <MessageSquare size={20} />, badge: unreadChatCount },
    { name: 'Book Doctor', path: '/dashboard/booking', icon: <CalendarPlus size={20} /> },
    { name: 'My Appointments', path: '/dashboard/sessions', icon: <Calendar size={20} /> },
    { name: 'Health Wallet', path: '/dashboard/wallet', icon: <Wallet size={20} /> },
    { name: 'My Doctors', path: '/dashboard/doctors', icon: <UserCheck size={20} /> },
  ];

  // ── MORE APPS: Less frequently used ──
  const moreItems = [
    { name: 'Medical History', path: '/dashboard/records', icon: <ClipboardList size={20} /> },
    { name: 'AI Reports', path: '/dashboard/reports', icon: <FileText size={20} /> },
    { name: 'Medications', path: '/dashboard/medications', icon: <Pill size={20} /> },
    { name: 'Security Ledger', path: '/dashboard/security', icon: <ShieldCheck size={20} /> },
  ];

  const hospitalItems = [
    { name: 'Command Center', path: '/hospital-dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Appointments', path: '/hospital-dashboard/appointments', icon: <Calendar size={20} /> },
    { name: 'Staff Roster', path: '/hospital-dashboard/staff', icon: <UserCheck size={20} /> },
    { name: 'Analytics', path: '/hospital-dashboard/analytics', icon: <TrendingUp size={20} /> },
    { name: 'Inst. Profile', path: '/hospital-dashboard/profile', icon: <User size={20} /> },
    { name: 'Inst. Wallet', path: '/dashboard/wallet', icon: <Wallet size={20} /> },
    { name: 'Compliance', path: '/dashboard/security', icon: <ShieldCheck size={20} /> },
  ];

  const isHospital = user?.role === 'ROLE_HOSPITAL_ADMIN';
  const profileItem = { 
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
  };

  const NavItem = ({ item, end }) => (
    <NavLink
      to={item.path}
      end={end}
      onMouseEnter={() => prefetchData(item.path)}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm border border-primary-100'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      <div className="mr-3 relative">
        {item.icon}
        {item.badge > 0 && (
          <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm border border-white">
            {item.badge > 9 ? '9+' : item.badge}
          </div>
        )}
      </div>
      <span className="text-sm font-medium flex-1">{item.name}</span>
    </NavLink>
  );

  return (
    <>
      <div className={`hidden md:flex flex-col border-r border-slate-200 bg-white shadow-xl z-30 w-64 h-[100dvh] shrink-0`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <Activity className="text-primary-600 mr-2" size={24} />
          <span className="text-2xl font-bold text-slate-800 tracking-tight">MEDISYNC</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {isHospital ? (
            hospitalItems.map((item) => (
              <NavItem key={item.name} item={item} end={item.path === '/hospital-dashboard'} />
            ))
          ) : (
            <>
              {/* Main Section */}
              {mainItems.map((item) => (
                <NavItem key={item.name} item={item} end={item.path === '/dashboard'} />
              ))}

              {moreItems.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}

              {/* Profile (always visible) */}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <NavItem item={profileItem} />
              </div>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm font-medium"
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
