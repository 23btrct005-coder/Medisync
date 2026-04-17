import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, User, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const BottomNav = () => {
    const { user, userRole } = useAuth();
    
    // Hide bottom nav if not logged in
    if (!user) return null;

    const isDoctor = userRole === 'ROLE_DOCTOR';
    const photoUrl = isDoctor 
        ? `${api.defaults.baseURL}/auth/doctor/photo/${user.id}` 
        : `${api.defaults.baseURL}/auth/patient/photo/${user.id}`;

    const patientNav = [
        { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={20} /> },
        { name: 'Reports', path: '/dashboard/reports', icon: <FileText size={20} /> },
        { name: 'Profile', path: '/dashboard/profile', icon: null }
    ];

    const doctorNav = [
        { name: 'Hub', path: '/doctor-dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Patients', path: '/doctor-dashboard/patients', icon: <Users size={20} /> },
        { name: 'Profile', path: '/doctor-dashboard/profile', icon: null }
    ];

    const navItems = isDoctor ? doctorNav : patientNav;

    return (
        <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-2 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <nav className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isProfile = item.icon === null;

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.path === '/' || item.path === '/doctor-dashboard'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                    isActive ? 'text-primary-600 scale-110' : 'text-slate-400 hover:text-slate-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isProfile ? (
                                        <div className={`h-6 w-6 rounded-full overflow-hidden flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-primary-500 ring-offset-2 border-none' : 'border border-slate-200 bg-slate-100'}`}>
                                            {photoUrl ? (
                                              <img 
                                                src={photoUrl} 
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextSibling.style.display = 'block';
                                                }}
                                              />
                                            ) : null}
                                            <User size={16} className={`${photoUrl ? 'hidden' : 'block'} ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                                        </div>
                                    ) : (
                                        item.icon
                                    )}
                                    <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-0 h-0 w-0 overflow-hidden'}`}>
                                        {item.name}
                                    </span>
                                    {/* Active dot indicator */}
                                    {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-primary-600 rounded-full" />}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomNav;
