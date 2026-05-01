import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, FileText, ClipboardList, User, Users, 
    LogOut, CalendarPlus, Calendar, UserCheck, Grid, X,
    ExternalLink, Shield, Settings, HelpCircle, Bell, Activity, 
    Pill, ShieldCheck, MessageSquare, Wallet, Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/axiosConfig';

const BottomNav = () => {
    const { user, userRole, logout } = useAuth();
    const { unreadChatCount } = useNotifications();
    const navigate = useNavigate();
    const [showHub, setShowHub] = useState(false);
    
    if (!user) return null;

    const isDoctor = userRole === 'ROLE_DOCTOR';
    const isHospital = userRole === 'ROLE_HOSPITAL_ADMIN';
    const photoUrl = isDoctor 
        ? `${api.defaults.baseURL}/auth/doctor/photo/${user.id}` 
        : `${api.defaults.baseURL}/auth/patient/photo/${user.id}`;

    // ── PRIMARY BAR: Most-used features (max 5 tabs) ──
    const primaryNav = isDoctor ? [
        { name: 'Hub', path: '/doctor-dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Patients', path: '/doctor-dashboard/patients', icon: <Users size={20} /> },
        { name: 'Messages', path: '/doctor-dashboard/messages', icon: <MessageSquare size={20} />, badge: unreadChatCount },
        { name: 'Schedule', path: '/doctor-dashboard/appointments', icon: <Calendar size={20} /> },
    ] : isHospital ? [
        { name: 'Hub', path: '/hospital-dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Staff', path: '/hospital-dashboard/staff', icon: <UserCheck size={20} /> },
        { name: 'Patients', path: '/hospital-dashboard/patients', icon: <Users size={20} /> },
        { name: 'Analytics', path: '/hospital-dashboard/analytics', icon: <Activity size={20} /> },
    ] : [
        { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Messages', path: '/dashboard/messages', icon: <MessageSquare size={20} />, badge: unreadChatCount },
        { name: 'Book', path: '/dashboard/booking', icon: <CalendarPlus size={20} /> },
        { name: 'Wallet', path: '/dashboard/wallet', icon: <Wallet size={20} /> },
    ];

    // ── SECONDARY APPS: Everything else ──
    const secondaryNav = isDoctor ? [
        { name: 'Profile', path: '/doctor-dashboard/profile', icon: <User size={20} />, description: 'Clinical identity' },
        { name: 'Settings', path: '/doctor-dashboard/settings', icon: <Settings size={20} />, description: 'Preferences' },
        { name: 'Support', path: '/doctor-dashboard/support', icon: <HelpCircle size={20} />, description: 'Help center' },
    ] : isHospital ? [
        { name: 'Appointments', path: '/hospital-dashboard/appointments', icon: <Calendar size={20} />, description: 'Schedule mgmt' },
        { name: 'Profile', path: '/hospital-dashboard/profile', icon: <Stethoscope size={20} />, description: 'Institutional info' },
        { name: 'Wallet', path: '/dashboard/wallet', icon: <Wallet size={20} />, description: 'Financial hub' },
        { name: 'Compliance', path: '/dashboard/security', icon: <ShieldCheck size={20} />, description: 'Access ledger' },
        { name: 'Settings', path: '/hospital-dashboard/settings', icon: <Settings size={20} />, description: 'Preferences' },
        { name: 'Support', path: '/hospital-dashboard/support', icon: <HelpCircle size={20} />, description: 'Help center' },
    ] : [
        { name: 'My Doctors', path: '/dashboard/doctors', icon: <UserCheck size={20} />, description: 'Care team' },
        { name: 'Appointments', path: '/dashboard/sessions', icon: <Calendar size={20} />, description: 'My timeline' },
        { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={20} />, description: 'Medical history' },
        { name: 'AI Briefs', path: '/dashboard/reports', icon: <FileText size={20} />, description: 'Smart analysis' },
        { name: 'Medications', path: '/dashboard/medications', icon: <Pill size={20} />, description: 'Adherence tracker' },
        { name: 'Security', path: '/dashboard/security', icon: <ShieldCheck size={20} />, description: 'Access ledger' },
        { name: 'Profile', path: '/dashboard/profile', icon: <User size={20} />, description: 'My identity' },
        { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} />, description: 'Preferences' },
        { name: 'Support', path: '/dashboard/support', icon: <HelpCircle size={20} />, description: 'Help center' },
    ];

    return (
        <>
            {/* ── Native-style Application Hub (Full-screen Overlay) ── */}
            <div className={`fixed inset-0 z-[60] bg-white/98 backdrop-blur-xl transition-all duration-400 ease-out transform ${showHub ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col p-6 pt-10 pb-32">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Apps</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1">Quick access to everything</p>
                        </div>
                        <button onClick={() => setShowHub(false)} className="p-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 active:scale-90 transition-all">
                            <X size={22} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto pb-10 scrollbar-none">
                        {secondaryNav.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => { navigate(item.path); setShowHub(false); }}
                                className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 active:scale-90 transition-all text-center group hover:border-primary/30"
                            >
                                <div className="p-3 bg-white text-primary-600 rounded-2xl shadow-sm border border-slate-100 group-active:bg-primary-50 transition-colors">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider leading-tight">{item.name}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">{item.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                         <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100 active:scale-95 transition-all"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Bottom Dock Bar ── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 px-4 pt-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <nav className="flex justify-around items-center h-14">
                    {primaryNav.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.path === '/dashboard' || item.path === '/doctor-dashboard' || item.path === '/hospital-dashboard'}
                            onClick={() => setShowHub(false)}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-300 relative ${
                                    isActive ? 'text-primary-400 scale-105' : 'text-slate-500'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                      {item.icon}
                                      {item.badge > 0 && (
                                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center shadow-sm">
                                              {item.badge > 9 ? '9+' : item.badge}
                                          </div>
                                      )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                        {item.name}
                                    </span>
                                    {isActive && <div className="absolute -top-2 w-1 h-1 bg-primary-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* Apps Hub Trigger */}
                    <button
                        onClick={() => setShowHub(!showHub)}
                        className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-300 ${showHub ? 'text-primary-400 scale-105' : 'text-slate-500'}`}
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
