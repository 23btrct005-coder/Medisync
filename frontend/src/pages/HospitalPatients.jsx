import React, { useState, useEffect } from 'react';
import { User, Search, Activity, ChevronRight, Mail, Phone, Calendar } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [bookingData, setBookingData] = useState({ doctorId: '', date: '', slot: '', type: 'OFFLINE' });
    const [slots, setSlots] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/hospital/patients');
                setPatients(res.data);
            } catch (err) {
                toast.error("Failed to synchronize institutional patient registry");
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/hospital/doctors');
            // Filter only approved doctors for booking
            setAvailableDoctors(res.data.filter(d => d.approved));
        } catch (err) {
            console.error("Failed to fetch doctors for booking");
        }
    };

    const handleRefreshDoctors = () => {
        toast.promise(fetchDoctors(), {
            loading: 'Refreshing physician list...',
            success: 'Physician list updated',
            error: 'Failed to update physician list'
        });
    };

    useEffect(() => {
        if (bookingData.doctorId && bookingData.date) {
            fetchSlots();
        }
    }, [bookingData.doctorId, bookingData.date]);

    const fetchSlots = async () => {
        try {
            const res = await api.get(`/appointments/slots?doctorId=${bookingData.doctorId}&date=${bookingData.date}`);
            setSlots(res.data);
        } catch (err) {
            toast.error("Failed to fetch available slots");
        }
    };

    const handleQuickBook = async (e) => {
        e.preventDefault();
        if (!bookingData.slot) {
            toast.error("Please select a time slot");
            return;
        }
        setBookingLoading(true);
        try {
            // Internal admin booking (skips payment for hospital-initiated bookings)
            await api.post('/hospital/book-appointment', {
                patientId: selectedPatient.id,
                doctorId: bookingData.doctorId,
                date: bookingData.date,
                slot: bookingData.slot,
                type: bookingData.type
            });
            toast.success("Appointment synchronized successfully!");
            setShowBookingModal(false);
            setBookingData({ doctorId: '', date: '', slot: '', type: 'OFFLINE' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to synchronize appointment");
        } finally {
            setBookingLoading(false);
        }
    };

    const filteredPatients = (Array.isArray(patients) ? patients : []).filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Institutional <span className="not-italic text-primary">Registry</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 ml-1">Unified patient record management</p>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by ID or name..."
                        className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 ring-primary/5 outline-none w-full md:w-[350px] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <div key={patient.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <User size={32} />
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    {patient.bloodGroup || 'O+'}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic mb-1">{patient.name}</h3>
                            <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-6">ID: {patient.patientId}</p>
                            
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Mail size={14} className="mr-3" /> {patient.email}
                                </div>
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Phone size={14} className="mr-3" /> {patient.phone}
                                </div>
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Calendar size={14} className="mr-3" /> {patient.dateOfBirth}
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                                    Dossier <ChevronRight size={14} />
                                </button>
                                <button 
                                    onClick={() => { setSelectedPatient(patient); setShowBookingModal(true); }}
                                    className="flex-1 py-4 bg-primary/10 text-primary rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Calendar size={14} /> Book
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Institutional registry currently empty</p>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="p-8 bg-slate-900 text-white rounded-t-[3rem]">
                            <h3 className="text-xl font-black uppercase tracking-tight italic">Quick <span className="not-italic text-primary">Appointment</span></h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Booking for {selectedPatient?.name}</p>
                        </div>
                        <form onSubmit={handleQuickBook} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attending Physician</label>
                                        <button 
                                            type="button" 
                                            onClick={handleRefreshDoctors}
                                            className="text-[9px] font-bold text-primary hover:text-primary-600 underline"
                                        >
                                            Refresh List
                                        </button>
                                    </div>
                                    <select 
                                        required
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 appearance-none"
                                        value={bookingData.doctorId}
                                        onChange={(e) => setBookingData({...bookingData, doctorId: e.target.value})}
                                    >
                                        <option value="">Select Physician...</option>
                                        {availableDoctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>Dr. {doc.name} ({doc.specialization})</option>
                                        ))}
                                    </select>
                                    {availableDoctors.length === 0 && (
                                        <p className="text-[9px] text-amber-600 font-bold mt-2 ml-1">No verified physicians available. Please approve staff first.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Schedule Date</label>
                                        <input 
                                            type="date" required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={bookingData.date}
                                            onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                                            className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Modality</label>
                                        <select 
                                            required
                                            className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 appearance-none"
                                            value={bookingData.type}
                                            onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                                        >
                                            <option value="OFFLINE">In-Person</option>
                                            <option value="ONLINE">Virtual</option>
                                        </select>
                                    </div>
                                </div>

                                {bookingData.date && bookingData.doctorId && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Available Slots</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {slots.map(slot => (
                                                <button 
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setBookingData({...bookingData, slot})}
                                                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${bookingData.slot === slot ? 'bg-primary text-white border-primary' : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30'}`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                            {slots.length === 0 && (
                                                <p className="col-span-3 text-[9px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">No slots found for this date</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={bookingLoading || !bookingData.slot}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {bookingLoading ? 'Synchronizing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalPatients;
