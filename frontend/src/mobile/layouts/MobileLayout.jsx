import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, MessageSquare, CalendarPlus, ClipboardList, 
    User, Menu, Bell, Search, X, Activity, Wallet, ShieldCheck, 
    Stethoscope, Users, UserCheck, Settings, HelpCircle, LogOut,
    PlusCircle, FileText, Pill, Grid, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../../components/NotificationBell';

const MobileLayout = () => {
    const { user, userRole, logout } = useAuth();
    const { unreadChatCount } = useNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return <Outlet />;

    const isDoctor = userRole === 'ROLE_DOCTOR';
    const isHospital = userRole === 'ROLE_HOSPITAL_ADMIN';

    // ── NAVIGATION CONFIG ──
    const getPrimaryNav = () => {
        if (isDoctor) return [
            { name: 'Hub', path: '/doctor-dashboard', icon: <LayoutDashboard size={22} /> },
            { name: 'Schedule', path: '/doctor-dashboard/appointments', icon: <Calendar size={22} /> },
            { name: 'Messages', path: '/doctor-dashboard/messages', icon: <MessageSquare size={22} />, badge: unreadChatCount },
            { name: 'Patients', path: '/doctor-dashboard/patients', icon: <Users size={22} /> },
        ];
        if (isHospital) return [
            { name: 'Hub', path: '/hospital-dashboard', icon: <LayoutDashboard size={22} /> },
            { name: 'Analytics', path: '/hospital-dashboard/analytics', icon: <Activity size={22} /> },
            { name: 'Staff', path: '/hospital-dashboard/staff', icon: <UserCheck size={22} /> },
            { name: 'Registry', path: '/hospital-dashboard/patients', icon: <Users size={22} /> },
        ];
        return [
            { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={22} /> },
            { name: 'Medics', path: '/dashboard/booking', icon: <Stethoscope size={22} /> },
            { name: 'Briefs', path: '/dashboard/reports', icon: <FileText size={22} /> },
            { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={22} /> },
        ];
    };

    const getSecondaryNav = () => {
        if (isDoctor) return [
            { name: 'Financials', path: '/doctor-dashboard/financials', icon: <Wallet size={20} /> },
            { name: 'Profile', path: '/doctor-dashboard/profile', icon: <User size={20} /> },
            { name: 'Settings', path: '/doctor-dashboard/settings', icon: <Settings size={20} /> },
            { name: 'Support', path: '/doctor-dashboard/support', icon: <HelpCircle size={20} /> },
        ];
        if (isHospital) return [
            { name: 'Ledger', path: '/hospital-dashboard/ledger', icon: <Wallet size={20} /> },
            { name: 'Services', path: '/hospital-dashboard/services', icon: <Grid size={20} /> },
            { name: 'Profile', path: '/hospital-dashboard/profile', icon: <User size={20} /> },
            { name: 'Staff Onboarding', path: '/hospital-dashboard/staff/onboard', icon: <PlusCircle size={20} /> },
            { name: 'Settings', path: '/hospital-dashboard/settings', icon: <Settings size={20} /> },
        ];
        return [
            { name: 'Health Wallet', path: '/dashboard/wallet', icon: <Wallet size={20} /> },
            { name: 'Medications', path: '/dashboard/medications', icon: <Pill size={20} /> },
            { name: 'Security Logs', path: '/dashboard/security', icon: <ShieldCheck size={20} /> },
            { name: 'Profile', path: '/dashboard/profile', icon: <User size={20} /> },
            { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
            { name: 'Support', path: '/dashboard/support', icon: <HelpCircle size={20} /> },
        ];
    };

    const primaryNav = getPrimaryNav();
    const secondaryNav = getSecondaryNav();

    return (
        <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] overflow-hidden">
            {/* ── MOBILE HEADER ── */}
            <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-[100] shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <Activity size={18} className="text-white" />
                    </div>
                    <span className="text-sm font-black tracking-tighter text-slate-800 uppercase">MediSync <span className="text-primary-600">Pro</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                        <Search size={20} />
                    </button>
                    <NotificationBell />
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <div className="p-4 page-entry h-full">
                    <Outlet />
                </div>
            </main>

            {/* ── PREMIUM BOTTOM DOCK ── */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-6 pt-2 pb-safe z-[200] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-center h-14 max-w-lg mx-auto">
                    {primaryNav.slice(0, 2).map((item) => (
                        <NavLink key={item.name} to={item.path} end className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                            {item.icon}
                            <span className="text-[9px] font-bold uppercase tracking-tight">{item.name}</span>
                        </NavLink>
                    ))}

                    {/* Center FAB style Menu */}
                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        className="relative -top-4 h-14 w-14 bg-primary-600 rounded-full flex items-center justify-center shadow-xl shadow-primary/40 text-white active:scale-90 transition-transform"
                    >
                        <Menu size={24} />
                    </button>

                    {primaryNav.slice(2, 4).map((item) => (
                        <NavLink key={item.name} to={item.path} className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                            <div className="relative">
                                {item.icon}
                                {item.badge > 0 && <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1 rounded-full">{item.badge}</div>}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-tight">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* ── FULL SCREEN MENU OVERLAY ── */}
            <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] transition-all duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 transition-transform duration-500 transform ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <p className="text-xs font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Clinical Control</p>
                            <h2 className="text-2xl font-black text-slate-800">Hub Menu</h2>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {secondaryNav.map((item) => (
                            <button 
                                key={item.name} 
                                onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                                className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-3xl active:bg-slate-100 transition-colors group"
                            >
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm group-active:scale-90 transition-transform">
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-extrabold text-slate-600 text-center uppercase tracking-tighter leading-tight">{item.name}</span>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full py-4 bg-rose-50 text-rose-600 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Terminate Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileLayout;
