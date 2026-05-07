import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, MessageSquare, CalendarPlus, ClipboardList, 
    User, Menu, Bell, Search, X, Activity, Wallet, ShieldCheck, 
    Stethoscope, Users, UserCheck, Settings, HelpCircle, LogOut,
    PlusCircle, FileText, Pill, Grid, Calendar, Zap, AlertCircle
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

    useEffect(() => {
        // Scroll to top on route change for smoothness
        window.scrollTo(0, 0);
    }, [location.pathname]);

    if (!user) return <Outlet />;

    const isDoctor = userRole === 'ROLE_DOCTOR';
    const isHospital = userRole === 'ROLE_HOSPITAL_ADMIN';

    // ── NAVIGATION CONFIG (PRIORITY ORDER) ──
    const getPrimaryNav = () => {
        if (isDoctor) return [
            { name: 'Console', path: '/doctor-dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Calendar', path: '/doctor-dashboard/appointments', icon: <Calendar size={20} /> },
            { name: 'Chats', path: '/doctor-dashboard/messages', icon: <MessageSquare size={20} />, badge: unreadChatCount },
            { name: 'Registry', path: '/doctor-dashboard/patients', icon: <Users size={20} /> },
        ];
        if (isHospital) return [
            { name: 'Control', path: '/hospital-dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Stats', path: '/hospital-dashboard/analytics', icon: <Activity size={20} /> },
            { name: 'Personnel', path: '/hospital-dashboard/staff', icon: <UserCheck size={20} /> },
            { name: 'Patients', path: '/hospital-dashboard/patients', icon: <Users size={20} /> },
        ];
        return [
            { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Book', path: '/dashboard/booking', icon: <CalendarPlus size={20} /> },
            { name: 'Wallet', path: '/dashboard/wallet', icon: <Wallet size={20} /> },
            { name: 'Clinical', path: '/dashboard/records', icon: <ClipboardList size={20} /> },
        ];
    };

    const getSecondaryNav = () => {
        if (isDoctor) return [
            { name: 'Revenue', path: '/doctor-dashboard/financials', icon: <Wallet size={22} />, color: 'bg-emerald-50 text-emerald-600' },
            { name: 'Bio', path: '/doctor-dashboard/profile', icon: <User size={22} />, color: 'bg-blue-50 text-blue-600' },
            { name: 'Config', path: '/doctor-dashboard/settings', icon: <Settings size={22} />, color: 'bg-slate-50 text-slate-600' },
            { name: 'Help', path: '/doctor-dashboard/support', icon: <HelpCircle size={22} />, color: 'bg-indigo-50 text-indigo-600' },
        ];
        if (isHospital) return [
            { name: 'Ledger', path: '/hospital-dashboard/ledger', icon: <Wallet size={22} />, color: 'bg-emerald-50 text-emerald-600' },
            { name: 'Services', path: '/hospital-dashboard/services', icon: <Grid size={22} />, color: 'bg-amber-50 text-amber-600' },
            { name: 'Profile', path: '/hospital-dashboard/profile', icon: <User size={22} />, color: 'bg-blue-50 text-blue-600' },
            { name: 'Onboard', path: '/hospital-dashboard/staff/onboard', icon: <PlusCircle size={22} />, color: 'bg-primary-50 text-primary-600' },
            { name: 'Config', path: '/hospital-dashboard/settings', icon: <Settings size={22} />, color: 'bg-slate-50 text-slate-600' },
        ];
        return [
            { name: 'AI Reports', path: '/dashboard/reports', icon: <FileText size={22} />, color: 'bg-violet-50 text-violet-600' },
            { name: 'Rx Vault', path: '/dashboard/medications', icon: <Pill size={22} />, color: 'bg-rose-50 text-rose-600' },
            { name: 'Security', path: '/dashboard/security', icon: <ShieldCheck size={22} />, color: 'bg-cyan-50 text-cyan-600' },
            { name: 'Sessions', path: '/dashboard/sessions', icon: <Calendar size={22} />, color: 'bg-indigo-50 text-indigo-600' },
            { name: 'Identity', path: '/dashboard/profile', icon: <User size={22} />, color: 'bg-blue-50 text-blue-600' },
            { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={22} />, color: 'bg-slate-50 text-slate-600' },
        ];
    };

    const primaryNav = getPrimaryNav();
    const secondaryNav = getSecondaryNav();

    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(12);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden font-sans selection:bg-primary-100">
            {/* ── HIGH-FIDELITY HEADER ── */}
            <header className="h-16 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 flex items-center justify-between px-5 sticky top-0 z-[100] shrink-0">
                <div className="flex items-center gap-3">
                    <motion.div 
                        whileTap={{ scale: 0.9 }}
                        className="h-10 w-10 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                        <Activity size={20} className="text-white" />
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tighter text-slate-900 uppercase leading-none">MediSync <span className="text-primary-600 font-black">PRO</span></span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Clinical Node Verified</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 bg-slate-50 rounded-full border border-slate-100"
                    >
                        <Search size={18} />
                    </motion.button>
                    <NotificationBell />
                </div>
            </header>

            {/* ── FLUID MAIN STAGE ── */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 scroll-smooth">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="px-5 py-6 min-h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ── THUMB-CENTRIC BOTTOM DOCK ── */}
            <nav className="fixed bottom-4 left-4 right-4 h-20 bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] px-2 shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[200] flex items-center justify-around">
                {primaryNav.slice(0, 2).map((item) => (
                    <NavLink 
                        key={item.name} 
                        to={item.path} 
                        onClick={triggerHaptic}
                        end 
                        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-16 rounded-3xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50/50' : 'text-slate-400'}`}
                    >
                        <motion.div whileTap={{ scale: 0.8 }}>{item.icon}</motion.div>
                        <span className="text-[8px] font-black uppercase tracking-tight mt-1.5">{item.name}</span>
                    </NavLink>
                ))}

                {/* CENTRAL ACTION TRIGGER */}
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { triggerHaptic(); setIsMenuOpen(true); }}
                    className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-900/40 text-white relative -top-6 border-4 border-slate-50"
                >
                    <Grid size={24} />
                </motion.button>

                {primaryNav.slice(2, 4).map((item) => (
                    <NavLink 
                        key={item.name} 
                        to={item.path} 
                        onClick={triggerHaptic}
                        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-16 rounded-3xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50/50' : 'text-slate-400'}`}
                    >
                        <motion.div whileTap={{ scale: 0.8 }} className="relative">
                            {item.icon}
                            {item.badge > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">{item.badge}</span>}
                        </motion.div>
                        <span className="text-[8px] font-black uppercase tracking-tight mt-1.5">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* ── CLINICAL HUB OVERLAY ── */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-[500]"
                        />
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 z-[600] shadow-[0_-20px_50px_rgba(0,0,0,0.2)]"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                            
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Navigation Hub</p>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Services</h2>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsMenuOpen(false)} 
                                    className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-10">
                                {secondaryNav.map((item) => (
                                    <motion.button 
                                        key={item.name} 
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { triggerHaptic(); navigate(item.path); setIsMenuOpen(false); }}
                                        className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 group transition-all active:bg-white"
                                    >
                                        <div className={`h-12 w-12 ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter text-center">{item.name}</span>
                                    </motion.button>
                                ))}
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { triggerHaptic(); logout(); navigate('/login'); }}
                                className="w-full py-5 bg-rose-50 text-rose-600 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-rose-100"
                            >
                                <LogOut size={16} />
                                End Clinical Session
                            </motion.button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileLayout;
