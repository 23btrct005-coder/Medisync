import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ChevronRight, Activity, Search, ClipboardCheck, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalServiceBookings = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get('/hospital/appointments');
                // Filter specifically for service-based appointments (not general doctor consultations)
                const serviceOnly = (res.data || []).filter(app => app.serviceName != null);
                setAppointments(serviceOnly);
            } catch (err) {
                toast.error("Failed to sync service ledger");
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const filteredAppointments = appointments.filter(app => 
        app.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Activity className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Service Nodes...</p>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Service <span className="not-italic text-primary">Bookings</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 ml-1">Institutional Diagnostic & Emergency Ledger</p>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search patient or service..."
                        className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 ring-primary/5 outline-none w-full md:w-[350px] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto text-left">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Service</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm italic">{app.patient?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {app.patient?.patientId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    <ClipboardCheck size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm uppercase">{app.serviceName}</p>
                                                    <p className="text-[10px] font-bold text-emerald-500 uppercase">Institutional Node</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-slate-600 text-xs font-bold mb-1">
                                                    <Calendar size={14} className="mr-2 text-primary" /> {app.appointmentDate}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-[10px] font-bold italic">
                                                    <Clock size={12} className="mr-2" /> {app.timeSlot === 'IMMEDIATE' ? 'Emergency Request' : app.timeSlot}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                    app.status === 'AWAITING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    app.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {app.status || 'SCHEDULED'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs italic">No direct service bookings found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HospitalServiceBookings;
