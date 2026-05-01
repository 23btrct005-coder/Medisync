import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Bell, UserCircle, Menu, ShieldCheck, Search, Activity } from 'lucide-react';
import api, { loadingState } from '../api/axiosConfig';
import OnboardingTour from '../components/OnboardingTour';
import TopBarLoader from '../components/TopBarLoader';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import { SearchResultsDropdown } from '../components/UniversalSearch';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
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
                <header className="relative h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 md:px-10 z-[300] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden flex items-center gap-2 px-1 text-primary-600">
                             <Activity size={20} />
                             <span className="text-lg font-bold tracking-tight text-slate-800">MEDISYNC</span>
                        </div>
                        
                        <div className="hidden lg:flex relative group items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl transition-all focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/40">
                            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Universal Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="bg-transparent border-none outline-none text-sm font-medium w-48 xl:w-64"
                            />
                            {isSearchFocused && searchQuery && (
                                <SearchResultsDropdown 
                                    query={searchQuery} 
                                    onClose={() => {
                                        setSearchQuery('');
                                        setIsSearchFocused(false);
                                    }} 
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secure session</span>
                        </div>


                        <NotificationBell />

                        <div className="flex items-center gap-3 md:pl-6 md:border-l md:border-slate-200">
                            <div className="hidden sm:block text-right min-w-0">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter leading-none">Patient ID: {user?.patientId || `MS-${String(user?.id || '').padStart(4, '0')}`}</p>
                                <p className="text-sm font-extrabold text-slate-800 truncate">{user?.name || "Patient"}</p>
                            </div>
                            
                            <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl overflow-hidden border-2 border-white bg-slate-100 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center">
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
                                <UserCircle size={24} className={`${photoUrl ? 'hidden' : 'block'} text-slate-400 md:hidden`} />
                                <UserCircle size={32} className={`${photoUrl ? 'hidden' : 'block'} text-slate-400 hidden md:block`} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 md:p-10 pb-24 md:pb-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
