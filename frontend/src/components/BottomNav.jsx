import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, FileText, ClipboardList, User, Users, 
    LogOut, CalendarPlus, Calendar, UserCheck, Grid, X,
    ExternalLink, Shield, Settings, HelpCircle, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const BottomNav = () => {
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [showHub, setShowHub] = useState(false);
    
    if (!user) return null;

    const isDoctor = userRole === 'ROLE_DOCTOR';
    const photoUrl = isDoctor 
        ? `${api.defaults.baseURL}/auth/doctor/photo/${user.id}` 
        : `${api.defaults.baseURL}/auth/patient/photo/${user.id}`;

    // Primary Clinical Tabs (Always Visible)
    const primaryNav = isDoctor ? [
        { name: 'Hub', path: '/doctor-dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Patients', path: '/doctor-dashboard/patients', icon: <Users size={20} /> },
        { name: 'Profile', path: '/doctor-dashboard/profile', icon: null }
    ] : [
        { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={20} /> },
        { name: 'AI Briefs', path: '/dashboard/reports', icon: <FileText size={20} /> },
        { name: 'Profile', path: '/dashboard/profile', icon: null }
    ];

    // Secondary Application Hub (Inside 'Apps' Menu)
    const secondaryNav = isDoctor ? [] : [
        { name: 'Book Doctor', path: '/dashboard/booking', icon: <CalendarPlus size={20} />, description: 'Schedule new sessions' },
        { name: 'My sessions', path: '/dashboard/sessions', icon: <Calendar size={20} />, description: 'Upcoming appointments' },
        { name: 'Clinical Partners', path: '/dashboard/doctors', icon: <UserCheck size={20} />, description: 'Linked physicians' },
        { name: 'Privacy Center', path: '/dashboard/profile', icon: <Shield size={20} />, description: 'Security & RLS' },
        { name: 'Notifications', path: '/dashboard', icon: <Bell size={20} />, description: 'System alerts' },
        { name: 'Help Hub', path: '/dashboard', icon: <HelpCircle size={20} />, description: 'Documentation' }
    ];

    return (
        <>
            {/* Native-style Application Hub Overlay */}
            <div className={`fixed inset-0 z-[60] bg-white transition-all duration-500 ease-in-out transform ${showHub ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col p-8 pb-32">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Applications</h2>
                            <p className="text-sm font-bold text-slate-500">Clinical context extensions</p>
                        </div>
                        <button onClick={() => setShowHub(false)} className="p-3 bg-slate-100 text-slate-800 rounded-2xl hover:bg-slate-200">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 pb-10 scrollbar-none">
                        {secondaryNav.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => { navigate(item.path); setShowHub(false); }}
                                className="flex flex-col gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 active:scale-95 transition-all text-left group"
                            >
                                <div className="p-3 w-12 h-12 bg-white text-primary-600 rounded-xl shadow-sm border border-slate-100 group-hover:bg-primary-50 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-tight">{item.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 line-clamp-2">{item.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100 bg-white">
                         <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] border border-red-100 active:scale-90 transition-all shadow-sm"
                        >
                            <LogOut size={18} />
                            Exit Secure Context
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Primary Navigation Bar (DOCK MODEL) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 px-6 pt-3 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <nav className="flex justify-between items-center h-14">
                    {primaryNav.map((item) => {
                        const isProfile = item.icon === null;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.path === '/dashboard' || item.path === '/doctor-dashboard'}
                                onClick={() => setShowHub(false)}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1.5 p-2 transition-all duration-300 relative ${
                                        isActive ? 'text-primary-400 scale-105' : 'text-slate-500'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isProfile ? (
                                            <div className={`h-6 w-6 rounded-full overflow-hidden border transition-all ${isActive ? 'border-primary-400 ring-2 ring-primary-400/30' : 'border-slate-700 bg-slate-800'}`}>
                                                {photoUrl ? (
                                                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : <User size={14} className="m-1" />}
                                            </div>
                                        ) : item.icon}
                                        <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                            {item.name}
                                        </span>
                                        {isActive && <div className="absolute -top-3 w-1 h-1 bg-primary-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* The Application Hub Trigger */}
                    <button
                        onClick={() => setShowHub(true)}
                        className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${showHub ? 'text-primary-400 scale-105' : 'text-slate-500'}`}
                    >
                        <Grid size={20} className={showHub ? 'animate-pulse' : ''} />
                        <span className={`text-[8px] font-black uppercase tracking-wider ${showHub ? 'text-white' : 'text-slate-600'}`}>
                            Apps
                        </span>
                    </button>
                </nav>
            </div>
        </>
    );
};

export default BottomNav;
