import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Shield, UserCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const HospitalProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/hospital/profile');
                setProfile(res.data);
            } catch (err) {
                console.error("Institutional profile sync failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="p-8">
            <div className="mb-12">
                <h1 className="text-4xl font-black uppercase tracking-tight italic">Institutional <span className="not-italic text-primary">Identity</span></h1>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 ml-1">Administrative credentials and facility profile</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center mb-6 overflow-hidden">
                            {profile?.profilePictureUrl ? (
                                <img src={profile.profilePictureUrl} alt="Admin" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={64} className="text-primary" />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">{user?.name}</h2>
                        <p className="px-4 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border border-amber-100">
                            Institutional Administrator
                        </p>
                        
                        <div className="w-full h-px bg-slate-50 my-8" />
                        
                        <div className="w-full space-y-4">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Node</p>
                                    <p className="text-xs font-bold text-slate-700">{user?.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Security Role</p>
                                    <p className="text-xs font-bold text-slate-700">ROLE_HOSPITAL_ADMIN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight italic">Facility <span className="not-italic text-indigo-600">Attributes</span></h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Institution Name</label>
                                    <div className="px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none">
                                        {user?.name}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Primary Sector</label>
                                    <div className="px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none">
                                        Multi-Speciality Healthcare
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Operational Status</label>
                                    <div className="px-6 py-4 bg-emerald-50 rounded-2xl text-sm font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest">
                                        ACTIVE • VERIFIED
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Clinical Reach</label>
                                    <div className="px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800 border-none">
                                        Regional Hub (Tier-1)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-900 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 -mr-16 -mt-16 rounded-full blur-2xl group-hover:bg-primary/30 transition-all" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Administrative Encryption</p>
                                    <p className="text-white text-lg font-black italic tracking-tight">Access Token Active</p>
                                </div>
                                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                    Rotate Keys
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalProfile;
