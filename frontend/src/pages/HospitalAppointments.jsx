import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, ChevronRight, Activity, Search, Filter } from 'lucide-react';
import api from '../api/axiosConfig';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import toast from 'react-hot-toast';

const HospitalAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAppointments = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await api.get('/hospital/appointments');
            setAppointments(res.data);
        } catch (err) {
            if (!isSilent) toast.error("Failed to sync institutional ledger");
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();

        // ── Real-time Feature: WebSocket Sync ──
        let stompClient = null;
        const connectWebSocket = () => {
            try {
                const wsUrl = `${api.defaults.baseURL.replace('/api', '')}/ws`;
                const socket = new SockJS(wsUrl);
                stompClient = Stomp.over(socket);
                stompClient.debug = null; 

                stompClient.connect({
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }, () => {
                    stompClient.subscribe('/user/queue/appointments', (msg) => {
                        const updatedAppt = JSON.parse(msg.body);
                        
                        setAppointments(prev => {
                            const index = prev.findIndex(a => a.id === updatedAppt.id);
                            if (index !== -1) {
                                const newAppts = [...prev];
                                newAppts[index] = { ...newAppts[index], ...updatedAppt };
                                return newAppts;
                            }
                            return [updatedAppt, ...prev];
                        });
                        
                        toast.success(`Institutional Ledger Update: Session ${updatedAppt.id} is now ${updatedAppt.status}`, {
                            icon: '🏢',
                            duration: 4000
                        });
                    });
                });
            } catch (e) {}
        };

        connectWebSocket();

        const pulseInterval = setInterval(() => {
            fetchAppointments(true);
        }, 60000);

        return () => {
            clearInterval(pulseInterval);
            if (stompClient) stompClient.disconnect();
        };
    }, [fetchAppointments]);

    const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter(app => 
        app.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Activity className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing Institutional Records...</p>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Hospital <span className="not-italic text-primary">Ledger</span></h1>
                    <div className="flex items-center gap-2 mt-2 ml-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Real-time Cross-departmental orchestration active</p>
                    </div>
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
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${app.serviceName ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                                    <Activity size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{app.serviceName || app.doctor?.name || "Unassigned"}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{app.serviceName ? "Diagnostic Service" : (app.doctor?.specialization || "Clinical Consultation")}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-slate-600 text-xs font-bold mb-1">
                                                    <Calendar size={14} className="mr-2 text-primary" /> {app.appointmentDate}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-[10px] font-bold">
                                                    <Clock size={12} className="mr-2" /> {app.timeSlot || app.appointmentTime}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${
                                                    app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                    app.status === 'AWAITING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    app.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {app.status || 'SCHEDULED'}
                                                </span>
                                                {app.status === 'AWAITING_VERIFICATION' && app.transactionId && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">VPA: {app.patientUpiId}</p>
                                                        <p className="text-[8px] font-black text-primary uppercase tracking-tighter">TXN: {app.transactionId}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {app.status === 'AWAITING_VERIFICATION' && (
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                await api.post('appointments/confirm-upi', { appointmentId: app.id });
                                                                toast.success("Payment verified and session authorized.");
                                                                // WebSocket will trigger update automatically, but we can call it here for faster feedback
                                                                fetchAppointments(true);
                                                            } catch (e) {
                                                                toast.error("Authorization failed.");
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
                                                    >
                                                        Verify Payment
                                                    </button>
                                                )}
                                                <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
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
