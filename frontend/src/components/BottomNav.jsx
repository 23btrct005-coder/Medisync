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

                    <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pr-2 scrollbar-none">
                        {secondaryNav.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => { navigate(item.path); setShowHub(false); }}
                                className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 active:scale-95 transition-all text-left group"
                            >
                                <div className="p-4 bg-white text-primary-600 rounded-2xl shadow-sm border border-slate-100 group-hover:bg-primary-50">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{item.name}</h4>
                                    <p className="text-[11px] font-bold text-slate-500">{item.description}</p>
                                </div>
                                <ExternalLink size={14} className="ml-auto text-slate-300" />
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                         <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest text-xs border border-red-100 active:scale-95 transition-all"
                        >
                            <LogOut size={20} />
                            Exit Secure Context
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Primary Navigation Bar */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] px-4 py-3 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
                <nav className="flex justify-around items-center h-full">
                    {primaryNav.map((item) => {
                        const isProfile = item.icon === null;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.path === '/dashboard' || item.path === '/doctor-dashboard'}
                                onClick={() => setShowHub(false)}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${
                                        isActive ? 'text-primary-400 -translate-y-1 scale-110' : 'text-slate-500 hover:text-slate-300'
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
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                            {item.name}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* The Application Hub Trigger */}
                    <button
                        onClick={() => setShowHub(true)}
                        className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${showHub ? 'text-primary-400 -translate-y-1 scale-110' : 'text-slate-500'}`}
                    >
                        <Grid size={20} className={showHub ? 'animate-pulse' : ''} />
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${showHub ? 'text-white' : 'text-slate-600'}`}>
                            Apps
                        </span>
                    </button>
                </nav>
            </div>
        </>
    );
};

export default BottomNav;

export default BottomNav;
