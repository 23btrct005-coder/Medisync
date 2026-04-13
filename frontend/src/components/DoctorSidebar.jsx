import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Activity, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const DoctorSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const photoUrl = user?.id ? `${api.defaults.baseURL}/auth/doctor/photo/${user.id}` : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/doctor-dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Patient Directory', path: '/doctor-dashboard/patients', icon: <Users size={20} /> },
    { 
      name: 'My Profile', 
      path: '/doctor-dashboard/profile', 
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

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-30 w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full text-slate-300`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <Activity className="text-primary-500 mr-2" size={24} />
        <span className="text-2xl font-bold text-white tracking-tight">MEDISYNC</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/doctor-dashboard'}
            onClick={() => {
                if (window.innerWidth < 768) setIsOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400 font-medium'
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </NavLink>
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
