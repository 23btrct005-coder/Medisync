import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Activity, UserCircle, Calendar, Building2, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/axiosConfig';

const DoctorSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { unreadChatCount } = useNotifications();
  const navigate = useNavigate();

  const photoUrl = user?.id ? `${api.defaults.baseURL}/auth/doctor/photo/${user.id}` : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ROLE_HOSPITAL_ADMIN';
  const prefix = isAdmin ? '/hospital-dashboard' : '/doctor-dashboard';

  const navItems = [
    { 
      name: 'Dashboard', 
      path: prefix, 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      name: isAdmin ? 'Hospital Ledger' : 'My Appointments', 
      path: `${prefix}/appointments`, 
      icon: <Calendar size={20} /> 
    },
    { 
      name: isAdmin ? 'Staff Roster' : 'Patient Directory', 
      path: isAdmin ? `${prefix}/staff` : `${prefix}/patients`, 
      icon: <Users size={20} /> 
    },
    { 
      name: 'Messages', 
      path: `${prefix}/messages`, 
      icon: <MessageSquare size={20} />,
      badge: unreadChatCount
    },
    ...(isAdmin ? [
      {
        name: 'Patient Registry',
        path: `${prefix}/patients`,
        icon: <Activity size={20} />
      },
      {
        name: 'Inst. Analytics',
        path: `${prefix}/analytics`,
        icon: <TrendingUp size={20} />
      },
      {
        name: 'Inst. Profile',
        path: `${prefix}/institutional-profile`,
        icon: <Building2 size={20} />
      }
    ] : []),
    ...(!isAdmin && !user?.institutional ? [
      {
        name: 'Financials',
        path: `${prefix}/financials`,
        icon: <TrendingUp size={20} />
      }
    ] : []),
    { 
      name: 'My Profile', 
      path: `${prefix}/profile`, 
      icon: (
        <div className="h-5 w-5 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center -ml-1 mr-1">
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
          <UserCircle size={14} className={`${photoUrl ? 'hidden' : 'block'} text-slate-400`} />
        </div>
      )
    },
  ];

  const NavItem = ({ item, end }) => (
    <NavLink
      key={item.name}
      to={item.path}
      end={end}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-primary-600/20 text-primary-400 font-medium'
            : 'hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <div className="mr-3 relative">
        {item.icon}
        {item.badge > 0 && (
          <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm border border-slate-900">
            {item.badge > 9 ? '9+' : item.badge}
          </div>
        )}
      </div>
      <span className="flex-1">{item.name}</span>
    </NavLink>
  );

  return (
    <>
      <div className={`hidden md:flex flex-col border-r bg-slate-900 border-slate-800 shadow-xl z-30 w-64 h-screen shrink-0 text-slate-300`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Activity className="text-primary-500 mr-2" size={24} />
          <span className="text-2xl font-bold text-white tracking-tight">MEDISYNC</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.name} item={item} end={item.path === prefix} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DoctorSidebar;
