import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ChevronRight, Activity, Search, Filter } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get('/hospital/appointments');
                setAppointments(res.data);
            } catch (err) {
                toast.error("Failed to sync institutional ledger");
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter(app => 
        app.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Activity className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Hospital <span className="not-italic text-primary">Ledger</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 ml-1">Cross-departmental appointment orchestration</p>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search patient or physician..."
                        className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 ring-primary/5 outline-none w-full md:w-[350px] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Attending Physician</th>
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
                                                    <p className="font-black text-slate-800 text-sm">{app.patient?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {app.patient?.patientId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Activity size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{app.doctor?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{app.doctor?.specialization}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-slate-600 text-xs font-bold mb-1">
                                                    <Calendar size={14} className="mr-2 text-primary" /> {app.appointmentDate}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-[10px] font-bold">
                                                    <Clock size={12} className="mr-2" /> {app.appointmentTime}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                app.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {app.status || 'SCHEDULED'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center">
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No matching records in institutional ledger</p>
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

export default HospitalAppointments;
