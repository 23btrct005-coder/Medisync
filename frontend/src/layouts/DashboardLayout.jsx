import { Outlet, Link } from 'react-router-dom';
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

    const photoUrl = user?.profilePictureUrl || (user?.id ? `${api.defaults.baseURL}/auth/patient/photo/${user.id}` : null);

    return (
        <div className="flex w-full h-[100dvh] bg-slate-50 overflow-hidden font-inter antialiased">
            <TopBarLoader isLoading={globalLoading} />
            <OnboardingTour />
            
            {/* Sidebar remains fixed-width on desktop */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* Premium Header */}
                <header className="h-20 bg-white border-b border-slate-200/60 flex items-center justify-between px-6 md:px-10 z-[300] shrink-0 sticky top-0 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 text-slate-400 hover:text-primary transition-colors lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        
                        <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl transition-all focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/40 focus-within:bg-white w-80">
                            <Search size={18} className="text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Universal Clinical Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="bg-transparent border-none outline-none text-sm font-semibold w-full placeholder:text-slate-400"
                            />
                            {isSearchFocused && searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                    <SearchResultsDropdown 
                                        query={searchQuery} 
                                        onClose={() => {
                                            setSearchQuery('');
                                            setIsSearchFocused(false);
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                            <ShieldCheck size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Session Secured</span>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />

                        <NotificationBell />

                        <Link to="/dashboard/profile" className="flex items-center gap-4 group transition-all">
                            <div className="hidden md:block text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover:text-primary transition-colors">ID: {user?.patientId || 'TN-00-0000'}</p>
                                <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{user?.name || "Patient Node"}</p>
                            </div>
                            
                            <div className="h-11 w-11 md:h-12 md:w-12 rounded-2xl overflow-hidden border-2 border-white bg-slate-100 shadow-sm transition-all group-hover:shadow-primary/10 group-active:scale-95 flex items-center justify-center ring-2 ring-slate-100 group-hover:ring-primary/40">
                                {photoUrl ? (
                                    <img 
                                        src={photoUrl} 
                                        alt={user?.name} 
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            const fallback = e.target.parentElement.querySelector('.fallback-icon');
                                            if (fallback) fallback.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <UserCircle size={28} className={`fallback-icon ${photoUrl ? 'hidden' : 'block'} text-slate-400`} />
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 pb-28 md:pb-10 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
