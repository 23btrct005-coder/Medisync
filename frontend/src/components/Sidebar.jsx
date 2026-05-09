import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Calendar, Clock, Wallet, Users, FileText, 
    ClipboardList, Pill, ShieldCheck, User, LogOut, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const location = useLocation();
    const { logout, user } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Calendar, label: 'Book Appointment', path: '/dashboard/booking' },
        { icon: Clock, label: 'My Appointments', path: '/dashboard/appointments' },
        { icon: Wallet, label: 'Health Wallet', path: '/dashboard/wallet' },
        { icon: Users, label: 'Doctors', path: '/dashboard/doctors' },
        { icon: FileText, label: 'Medical History', path: '/dashboard/history' },
        { icon: ClipboardList, label: 'AI Reports', path: '/dashboard/reports' },
        { icon: Pill, label: 'Medications', path: '/dashboard/medications' },
        { icon: ShieldCheck, label: 'Security Ledger', path: '/dashboard/security' },
        { icon: User, label: 'Profile', path: '/dashboard/profile' },
    ];

    return (
        <aside className="w-72 glass-sidebar h-[100dvh] flex flex-col sticky top-0 z-[50]">
            {/* Brand Section */}
            <div className="p-8">
                <Link to="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                        <Activity size={22} />
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter text-slate-900 leading-none">MediSync</h1>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence</span>
                    </div>
                </Link>
            </div>

            {/* Navigation Ledger */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                                isActive 
                                ? 'bg-primary/5 text-primary shadow-sm' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <item.icon size={20} className={`transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                            {isActive && (
                                <motion.div 
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Access & Exit */}
            <div className="p-6 border-t border-slate-50">
                <div className="bg-slate-50/50 p-4 rounded-[24px] mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            <User size={20} className="text-slate-400" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{user?.username || 'PATIENT'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Node Verified</p>
                        </div>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-emerald-400 rounded-full"></div>
                    </div>
                </div>
                
                <button 
                    onClick={logout}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm"
                >
                    <div className="flex items-center gap-3">
                        <LogOut size={18} />
                        <span>System Logout</span>
                    </div>
                    <ChevronRight size={14} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
