import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ChevronRight, Activity, Search, ClipboardCheck, AlertCircle, MapPin, Navigation, Phone, X } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import ClinicMap from '../components/ClinicMap';

const PatientLocationModal = ({ appointment, onClose }) => {
    if (!appointment) return null;
    const { patient, latitude, longitude, serviceName } = appointment;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                            <Navigation size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Live Spatial Telemetry</h3>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Emergency Resource Deployment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 transition-all bg-white rounded-full border border-slate-100 hover:rotate-90">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Patient Card */}
                    <div className="flex items-start justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 font-black text-2xl italic">
                                {patient?.name?.[0]}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 italic">{patient?.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID: {patient?.patientId}</p>
                                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white rounded-full border border-slate-200 w-fit">
                                    <Phone size={12} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-700">{patient?.phone || "No Contact Bound"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Type</p>
                            <span className="px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-xl border border-red-100 uppercase tracking-widest">
                                {serviceName}
                            </span>
                        </div>
                    </div>

                    {/* Address / Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin size={16} className="text-blue-500" />
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Address</h5>
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                {patient?.street}, {patient?.city}<br />
                                {patient?.state} - {patient?.pinCode}
                            </p>
                        </div>
                        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={16} className="text-emerald-500" />
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPS Coordinates</h5>
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed tabular-nums">
                                LAT: {latitude?.toFixed(6)}<br />
                                LON: {longitude?.toFixed(6)}
                            </p>
                        </div>
                    </div>

                    {/* Live Map */}
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            Active Tracking Visualization
                        </h5>
                        <div className="h-[350px] rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner">
                            <ClinicMap 
                                address={`${latitude}, ${longitude}`}
                                hospitalName={`Patient: ${patient?.name}`}
                                height="100%"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank')}
                        className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                    >
                        <Navigation size={18} />
                        Open in Google Maps
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-8 bg-white text-slate-400 font-black py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const HospitalServiceBookings = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAppt, setSelectedAppt] = useState(null);

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
                                                    {app.latitude && app.longitude ? (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live Tracking Active</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Institutional Node</p>
                                                    )}
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
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                    app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    app.status === 'BOOKED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    app.status === 'AWAITING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    app.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    app.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    {app.status ? app.status.replace(/_/g, ' ') : 'SCHEDULED'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => setSelectedAppt(app)}
                                                className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ml-auto ${
                                                    app.latitude ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' : 'bg-slate-50 text-slate-400 hover:bg-primary hover:text-white'
                                                }`}
                                            >
                                                {app.latitude && <MapPin size={16} />}
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

            {/* Spatial Telemetry Modal */}
            {selectedAppt && (
                <PatientLocationModal 
                    appointment={selectedAppt} 
                    onClose={() => setSelectedAppt(null)} 
                />
            )}
        </div>
    );
};

export default HospitalServiceBookings;

