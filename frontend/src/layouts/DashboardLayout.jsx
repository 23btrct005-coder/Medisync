import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Bell, UserCircle, Menu, ShieldCheck, Search } from 'lucide-react';
import api, { loadingState } from '../api/axiosConfig';
import OnboardingTour from '../components/OnboardingTour';
import TopBarLoader from '../components/TopBarLoader';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';

const DashboardLayout = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    
    useEffect(() => {
        // Register the global loading listener
        loadingState.onChange = (isLoading) => {
            setGlobalLoading(isLoading);
        };
        return () => {
            loadingState.onChange = null;
        };
    }, []);

    const photoUrl = user?.id ? `${api.defaults.baseURL}/auth/patient/photo/${user.id}` : null;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
            <TopBarLoader isLoading={globalLoading} />
            <OnboardingTour />
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Premium Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sm:px-10 z-[40] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden flex items-center gap-2 px-2 text-primary-600">
                             <Activity size={24} />
                             <span className="text-xl font-bold tracking-tight text-slate-800">MEDISYNC</span>
                        </div>
                        
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl group transition-all focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/40">
                            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Universal Search..." 
                                className="bg-transparent border-none outline-none text-sm font-medium w-48 xl:w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secure session</span>
                        </div>

                        <LanguageSwitcher />
                        <ThemeToggle />

                        <button className="relative p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-125 transition-transform" />
                        </button>

                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                            <div className="hidden sm:block text-right min-w-0">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter leading-none">Global ID: {user?.id?.slice(0, 8)}</p>
                                <p className="text-sm font-extrabold text-slate-800 truncate">{user?.name || "Patient"}</p>
                            </div>
                            
                            <div className="h-11 w-11 rounded-2xl overflow-hidden border-2 border-white bg-slate-100 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center">
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
                                <UserCircle size={32} className={`${photoUrl ? 'hidden' : 'block'} text-slate-400`} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6 md:p-10 mb-16 md:mb-0 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
