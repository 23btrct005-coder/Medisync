import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, MessageSquare, CalendarPlus, ClipboardList, 
    User, Menu, Bell, Search, X, Activity, Wallet, ShieldCheck, 
    Stethoscope, Users, UserCheck, Settings, HelpCircle, LogOut,
    PlusCircle, FileText, Pill, Grid, Calendar, Zap, AlertCircle, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../../components/NotificationBell';

const MobileLayout = () => {
    const { user, userRole, logout } = useAuth();
    const { unreadChatCount, setAiOpen } = useNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
            { name: 'Chats', path: '/doctor-dashboard/messages', icon: <MessageSquare size={20} />, badge: unreadChatCount },
            { name: 'Console', path: '/doctor-dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Schedule', path: '/doctor-dashboard/appointments', icon: <Calendar size={20} /> },
            { name: 'Registry', path: '/doctor-dashboard/patients', icon: <Users size={20} /> },
        ];
        if (isHospital) return [
            { name: 'Control', path: '/hospital-dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Stats', path: '/hospital-dashboard/analytics', icon: <Activity size={20} /> },
            { name: 'Personnel', path: '/hospital-dashboard/staff', icon: <UserCheck size={20} /> },
            { name: 'Patients', path: '/hospital-dashboard/patients', icon: <Users size={20} /> },
        ];
        return [
            { name: 'Messages', path: '/dashboard/messages', icon: <MessageSquare size={20} />, badge: unreadChatCount },
            { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Book', path: '/dashboard/booking', icon: <CalendarPlus size={20} /> },
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
            { name: 'Wallet', path: '/dashboard/wallet', icon: <Wallet size={22} />, color: 'bg-emerald-50 text-emerald-600' },
            { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={22} />, color: 'bg-cyan-50 text-cyan-600' },
            { name: 'AI Reports', path: '/dashboard/reports', icon: <FileText size={22} />, color: 'bg-violet-50 text-violet-600' },
            { name: 'My Doctors', path: '/dashboard/doctors', icon: <Users size={22} />, color: 'bg-emerald-50 text-emerald-600' },
            { name: 'Schedule', path: '/dashboard/sessions', icon: <Calendar size={22} />, color: 'bg-indigo-50 text-indigo-600' },
            { name: 'Identity', path: '/dashboard/profile', icon: <User size={22} />, color: 'bg-blue-50 text-blue-600' },
            { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={22} />, color: 'bg-slate-50 text-slate-600' },
        ];
    };

    const primaryNav = getPrimaryNav();
    const secondaryNav = getSecondaryNav();

    // ── HIDE DOCK ON SCROLL ──
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const handleScroll = (e) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastScrollY && currentScrollY > 60) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
    };

    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(12);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden font-sans selection:bg-primary-100">
            {/* ── HIGH-FIDELITY HEADER ── */}
            <header className="h-16 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 flex items-center justify-between px-5 sticky top-0 z-[100] shrink-0">
                <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                        triggerHaptic();
                        const path = isDoctor ? '/doctor-dashboard/profile' : (isHospital ? '/hospital-dashboard/profile' : '/dashboard/profile');
                        navigate(path);
                    }}
                >
                    <motion.div 
                        whileTap={{ scale: 0.9 }}
                        className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm"
                    >
                        {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User size={20} className="text-slate-400" />
                        )}
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tighter text-slate-900 uppercase leading-none">
                            {user.name || 'Anonymous User'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                {userRole?.replace('ROLE_', '').replace('_', ' ')} Node Active
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSearchOpen(true)}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 bg-slate-50 rounded-full border border-slate-100"
                    >
                        <Search size={18} />
                    </motion.button>
                    <NotificationBell />
                </div>
            </header>

            {/* ── FLUID MAIN STAGE ── */}
            <motion.main 
                onScroll={handleScroll}
                style={{ 
                    scale: isMenuOpen ? 0.94 : 1,
                    filter: isMenuOpen ? 'blur(10px)' : 'blur(0px)',
                    borderRadius: isMenuOpen ? '2.5rem' : '0rem'
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="flex-1 overflow-y-auto no-scrollbar pb-24 scroll-smooth bg-slate-50 relative z-10"
            >
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
            </motion.main>

            {/* ── THUMB-CENTRIC BOTTOM DOCK ── */}
            <motion.nav 
                initial={false}
                animate={{ 
                    y: (!isVisible || isMenuOpen) ? 120 : 0,
                    opacity: (isVisible && !isMenuOpen) ? 1 : 0
                }}
                transition={{ type: "spring", damping: 20, stiffness: 150 }}
                className="fixed bottom-4 left-4 right-4 h-20 bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] px-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[200] flex items-center justify-between"
            >
                {(primaryNav || []).slice(0, 2).map((item) => item && (
                    <NavLink 
                        key={item.name} 
                        to={item.path} 
                        onClick={triggerHaptic}
                        end 
                        className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <motion.div whileTap={{ scale: 0.8 }} className="relative">
                            {item.icon}
                            {item.badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {item.badge}
                                </span>
                            )}
                        </motion.div>
                        <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-1.5">{item.name}</span>
                    </NavLink>
                ))}

                {/* CENTRAL ACTION TRIGGER */}
                <div className="relative h-full flex items-center justify-center">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { triggerHaptic(); setIsMenuOpen(true); }}
                        className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 text-white relative -top-6 border-4 border-slate-50"
                    >
                        <Grid size={24} />
                    </motion.button>
                </div>

                {(primaryNav || []).slice(2, 4).map((item) => {
                    if (!item) return null;
                    if (item.isAction) {
                        return (
                            <button
                                key={item.name}
                                onClick={() => { triggerHaptic(); item.action(); }}
                                className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 text-slate-400 hover:text-primary-600 hover:bg-primary-50/50"
                            >
                                <motion.div whileTap={{ scale: 0.8 }} className="relative">
                                    {item.icon}
                                </motion.div>
                                <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-1.5">{item.name}</span>
                            </button>
                        );
                    }
                    return (
                        <NavLink 
                            key={item.name} 
                            to={item.path} 
                            onClick={triggerHaptic}
                            end
                            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <motion.div whileTap={{ scale: 0.8 }} className="relative">
                                {item.icon}
                                {item.badge > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{item.badge}</span>}
                            </motion.div>
                            <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-1.5">{item.name}</span>
                        </NavLink>
                    );
                })}
            </motion.nav>

            {/* ── ADVANCED GLASS-SHEET HUB (GESTURE-DRIVEN) ── */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500]"
                        />
                        <motion.div 
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 500) {
                                    setIsMenuOpen(false);
                                }
                            }}
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl rounded-t-[3.5rem] p-8 pb-14 z-[600] shadow-[0_-20px_80px_rgba(0,0,0,0.3)] border-t border-white/40"
                        >
                            {/* Visual Handle */}
                            <div className="w-16 h-1.5 bg-slate-300/50 rounded-full mx-auto mb-10" />
                            
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">Clinical Hub</p>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Registry <span className="not-italic text-slate-400">Services</span></h2>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsMenuOpen(false)} 
                                    className="h-12 w-12 bg-slate-900/5 rounded-2xl flex items-center justify-center text-slate-400"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-12">
                                {(secondaryNav || []).map((item, idx) => item && (
                                    <motion.button 
                                        key={item.name} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { triggerHaptic(); navigate(item.path); setIsMenuOpen(false); }}
                                        className="flex flex-col items-center gap-3 p-5 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm active:bg-slate-50 transition-all hover:border-primary-100"
                                    >
                                        <div className={`h-14 w-14 ${item.color} rounded-[1.25rem] flex items-center justify-center shadow-inner`}>
                                            {React.cloneElement(item.icon, { size: 24 })}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter text-center leading-tight">{item.name}</span>
                                    </motion.button>
                                ))}
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { triggerHaptic(); logout(); navigate('/login'); }}
                                className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
                            >
                                <LogOut size={16} />
                                Terminate Clinical Session
                            </motion.button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── INTELLIGENT SEARCH OVERLAY ── */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white z-[1000] flex flex-col p-6"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    autoFocus
                                    type="text"
                                    placeholder="Search clinical modules..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-500 outline-none font-black uppercase tracking-tight text-sm text-slate-800 transition-all"
                                />
                            </div>
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                                className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500"
                            >
                                <X size={24} />
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="space-y-2">
                                {[...primaryNav, ...secondaryNav]
                                    .filter(item => item && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((result) => result && (
                                        <motion.button 
                                            key={result.name}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            onClick={() => { navigate(result.path); setIsSearchOpen(false); setSearchQuery(''); }}
                                            className="w-full p-5 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 active:bg-slate-50 transition-all"
                                        >
                                            <div className={`h-12 w-12 ${result.color || 'bg-slate-100 text-slate-600'} rounded-2xl flex items-center justify-center`}>
                                                {result.icon}
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Module</span>
                                                <span className="block text-sm font-black text-slate-900 uppercase">{result.name}</span>
                                            </div>
                                            <ChevronRight className="ml-auto text-slate-300" size={20} />
                                        </motion.button>
                                    ))
                                }
                                {searchQuery && [...primaryNav, ...secondaryNav].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                    <div className="py-20 text-center">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Search size={32} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No clinical node found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileLayout;
