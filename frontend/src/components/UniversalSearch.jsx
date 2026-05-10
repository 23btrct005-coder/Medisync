import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Clipboard, GraduationCap, ChevronRight, Loader2, Target, LayoutDashboard, Activity, Pill, Wallet, ShieldCheck, User, Calendar, CalendarPlus, ClipboardList, UserCheck } from 'lucide-react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export const SearchResultsDropdown = ({ query, onClose }) => {
    const [results, setResults] = useState({ records: [], reports: [], doctors: [], navigation: [] });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Clinical Vitals', path: '/dashboard/vitals', icon: <Activity size={18} /> },
        { name: 'Medications', path: '/dashboard/medications', icon: <Pill size={18} /> },
        { name: 'Medical History', path: '/dashboard/records', icon: <ClipboardList size={18} /> },
        { name: 'Reports & Briefs', path: '/dashboard/reports', icon: <FileText size={18} /> },
        { name: 'Schedule', path: '/dashboard/sessions', icon: <Calendar size={18} /> },
        { name: 'Book Appointment', path: '/dashboard/booking', icon: <CalendarPlus size={18} /> },
        { name: 'My Doctors', path: '/dashboard/doctors', icon: <UserCheck size={18} /> },
        { name: 'Health Wallet', path: '/dashboard/wallet', icon: <Wallet size={18} /> },
        { name: 'Security Ledger', path: '/dashboard/security', icon: <ShieldCheck size={18} /> },
        { name: 'My Profile', path: '/dashboard/profile', icon: <User size={18} /> }
    ];

    useEffect(() => {
        const fetchResults = async () => {
            if (!query || query.length < 2) return;
            setLoading(true);
            
            // Client-side Navigation Filter
            const matchedNav = navItems.filter(item => 
                item.name.toLowerCase().includes(query.toLowerCase())
            );

            try {
                // Parallel search across clinical nodes
                const [recordsRes, reportsRes, doctorsRes] = await Promise.all([
                    api.get(`/records/my-records?search=${query}`),
                    api.get(`/reports/my-reports?search=${query}`),
                    api.get(`/doctor/list?search=${query}`)
                ]);

                setResults({
                    records: (recordsRes.data || []).slice(0, 3),
                    reports: (reportsRes.data || []).slice(0, 3),
                    doctors: (doctorsRes.data || []).slice(0, 3),
                    navigation: matchedNav.slice(0, 3)
                });
            } catch (err) {
                console.error("Search sync failed", err);
                setResults(prev => ({ ...prev, navigation: matchedNav }));
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const hasResults = results.records.length > 0 || results.reports.length > 0 || results.doctors.length > 0 || results.navigation.length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[2rem] z-[500] overflow-hidden"
        >
            <div className="p-6 overflow-y-auto max-h-[32rem] custom-scrollbar">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing results...</p>
                    </div>
                ) : !hasResults ? (
                    <div className="py-12 text-center text-slate-400">
                        <Target className="mx-auto mb-4 opacity-20" size={48} />
                        <p className="text-sm font-bold">No clinical nodes found</p>
                        <p className="text-[10px] uppercase tracking-widest mt-1">Try a different query</p>
                    </div>
                ) : (
                    <div className="space-y-8 text-left">
                        {/* Navigation Section */}
                        {results.navigation.length > 0 && (
                            <div>
                                <h4 className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <LayoutDashboard size={12} /> App Nodes
                                </h4>
                                <div className="space-y-1">
                                    {results.navigation.map(item => (
                                        <button 
                                            key={item.path}
                                            onClick={() => { navigate(item.path); onClose(); }}
                                            className="w-full flex items-center gap-4 p-4 bg-slate-900/5 hover:bg-primary/10 rounded-2xl transition-all group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center shadow-sm">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tighter">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Navigate to node</p>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Medical Records Section */}
                        {results.records.length > 0 && (
                            <div>
                                <h4 className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clipboard size={12} /> Medical History
                                </h4>
                                <div className="space-y-1">
                                    {results.records.map(record => (
                                        <button 
                                            key={record.id}
                                            onClick={() => { navigate('/dashboard/records'); onClose(); }}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <Target size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tighter">{record.diagnosis || 'Diagnosis'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{record.doctorName || 'Clinical Node'}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reports Section */}
                        {results.reports.length > 0 && (
                            <div>
                                <h4 className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Diagnostic Reports
                                </h4>
                                <div className="space-y-1">
                                    {results.reports.map(report => (
                                        <button 
                                            key={report.id}
                                            onClick={() => { navigate('/dashboard/reports'); onClose(); }}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                <FileText size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tighter">{report.fileName || 'Archive'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{report.type || 'Diagnostic'}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Doctors Section */}
                        {results.doctors.length > 0 && (
                            <div>
                                <h4 className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <GraduationCap size={12} /> Clinical Registry
                                </h4>
                                <div className="space-y-1">
                                    {results.doctors.map(doctor => (
                                        <button 
                                            key={doctor.id}
                                            onClick={() => { navigate('/dashboard/doctors'); onClose(); }}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center overflow-hidden border border-blue-100">
                                                {doctor.hospitalEntity?.logoUrl ? (
                                                    <img src={doctor.hospitalEntity.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <GraduationCap size={18} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tighter">Dr. {doctor.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                                                    {doctor.specialization || 'Clinical Expert'} • {doctor.hospitalEntity?.name || doctor.hospital || 'Private Clinic'}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Clinical Search</span>
                <button onClick={onClose} className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline">Dismiss</button>
            </div>
        </motion.div>
    );
};
