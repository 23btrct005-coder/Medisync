import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Calendar, Clock, ChevronRight, 
  User, Star, MapPin, Video, CheckCircle2, 
  ArrowLeft, CreditCard, Loader2, Sparkles, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import ClinicMap from '../components/ClinicMap';

const Booking = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('ONLINE');
  const [isBooking, setIsBooking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bookingStep, setBookingStep] = useState('list'); // 'list' | 'slots' | 'confirm'

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && bookingDate) {
      fetchSlots();
    }
  }, [selectedDoctor, bookingDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('appointments/doctors');
      setDoctors(res.data || []);
    } catch (e) {
      toast.error("Failed to sync physician directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await api.get(`appointments/slots?doctorId=${selectedDoctor.id}&date=${bookingDate}`);
      setAvailableSlots(res.data || []);
      setSelectedSlot(null);
    } catch (e) {
      toast.error("Cloud sync failed for time slots.");
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    try {
      const res = await api.post('appointments/book', {
        doctorId: selectedDoctor.id,
        date: bookingDate,
        slot: selectedSlot,
        type: consultationType
      });
      
      // Simulate Razorpay success for now as per plan
      toast.success("Clinical session synchronized!");
      navigate('/dashboard/sessions', { state: { autoOpenApptId: res.data.appointmentId } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Booking infrastructure timeout.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await api.post('appointments/sync-marketplace');
      toast.success("Clinical marketplace synchronized!");
      fetchDoctors();
    } catch (e) {
      toast.error("Cloud synchronization failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const specialties = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];
  
  const filteredDoctors = doctors.filter(d => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = d.name.toLowerCase().includes(searchLow) || 
                         d.specialization?.toLowerCase().includes(searchLow) ||
                         d.hospital?.toLowerCase().includes(searchLow) ||
                         d.medicalDegree?.toLowerCase().includes(searchLow);
    const matchesFilter = filterSpecialty === 'All' || d.specialization === filterSpecialty;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-4">
             <Sparkles size={12} />
             Real-time Scheduling
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Book Appointment</h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg">Discover board-certified physicians and schedule your health sync instantly.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {bookingStep === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Search & Filter Hub (SMART ROW MODEL) */}
            <div className="glass-panel p-4 md:p-6 space-y-4 bg-white/70 backdrop-blur-md border-slate-200/60 sticky top-4 z-40 shadow-sm">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search name or specialty..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary/30 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 text-sm"
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center h-[52px] px-4 md:px-6 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all ${
                    showFilters || filterSpecialty !== 'All' 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-primary/20 hover:text-primary'
                  }`}
                >
                   <Filter size={18} />
                   <span className="hidden sm:inline ml-2">{filterSpecialty !== 'All' ? filterSpecialty : 'Filter'}</span>
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2">
                      {specialties.map(s => (
                        <button 
                          key={s}
                          onClick={() => { setFilterSpecialty(s); setShowFilters(false); }}
                          className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                            filterSpecialty === s 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Doctor Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[2.5rem] animate-pulse" />)}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-24 glass-panel border-dashed border-slate-200">
                 <User size={64} className="mx-auto text-slate-200 mb-4" />
                 <h3 className="text-xl font-bold text-slate-800">No Physicians Found</h3>
                 <p className="text-slate-500 font-medium mt-1 mb-8">Try adjusting your filters or search keywords.</p>
                 
                 <div className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 max-w-sm mx-auto">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><Sparkles size={20} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Sync Utility</p>
                    <p className="text-xs text-slate-500 text-center leading-relaxed">Incoming doctors may require administrative verification. Synchronize to enable instant access.</p>
                    <button 
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="w-full btn-premium bg-slate-900 text-white py-4 text-xs flex items-center justify-center gap-2"
                    >
                      {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      {isSyncing ? 'Synchronizing...' : 'Verify & Sync Directory'}
                    </button>
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDoctors.map(doctor => (
                  <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    onSelect={() => { setSelectedDoctor(doctor); setBookingStep('slots'); }} 
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
             {/* Left Column: Doctor Profile */}
             <div className="lg:col-span-5 space-y-6">
                <button 
                  onClick={() => setBookingStep('list')}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors text-sm mb-4"
                >
                  <ArrowLeft size={18} /> Back to Directory
                </button>

                <div className="glass-panel p-8 bg-slate-900 text-white border-none overflow-hidden relative group">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 mb-6 shadow-2xl">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctor.name}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Dr. {selectedDoctor.name}</h2>
                      <p className="text-primary-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">{selectedDoctor.specialization}</p>

                      <div className="grid grid-cols-2 w-full gap-4 mb-8">
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <Star className="text-amber-400 mx-auto mb-1" size={20} />
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Expertise</p>
                            <p className="text-sm font-bold">Board Certified</p>
                         </div>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <MapPin className="text-emerald-400 mx-auto mb-1" size={20} />
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Location</p>
                            <p className="text-sm font-bold truncate px-2">{selectedDoctor.hospital || 'Remote'}</p>
                         </div>
                      </div>

                      <div className="w-full space-y-3">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-xs font-medium text-slate-400 italic">Experience</span>
                            <span className="text-xs font-black uppercase tracking-widest underline decoration-primary decoration-2">{selectedDoctor.yearsOfExperience || '8+'} Years</span>
                         </div>
                      </div>

                      {selectedDoctor.clinicAddress && (
                        <div className="mt-6 glass-panel p-6 bg-white border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                           <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                               <MapPin size={16} className="text-red-500" />
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-slate-900">Clinic Terminal</h4>
                             </div>
                             {selectedDoctor.consultationTimings && (
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
                                  <Clock size={10} className="text-slate-500" />
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{selectedDoctor.consultationTimings}</span>
                               </div>
                             )}
                           </div>
                           <ClinicMap address={selectedDoctor.clinicAddress} hospitalName={selectedDoctor.hospital} height="250px" />
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Right Column: Slot Selection */}
             <div className="lg:col-span-7 space-y-8">
                <div className="glass-panel p-8 space-y-10">
                   {/* Date Selection */}
                   <section className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={18} className="text-primary" /> Select Consultation Date
                      </h3>
                      <input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none font-bold text-slate-800"
                      />
                   </section>

                   {/* Modality Selection */}
                   <section className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Video size={18} className="text-indigo-500" /> Health Sync Modality
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                         {[
                           { id: 'ONLINE', name: 'Virtual Sync', icon: Video, desc: 'High-def clinical video session', disabled: !selectedDoctor.onlineConsultation },
                           { id: 'OFFLINE', name: 'Clinic Visit', icon: MapPin, desc: 'In-person physical assessment', disabled: false }
                         ].map(type => (
                           <button 
                            key={type.id}
                            disabled={type.disabled}
                            onClick={() => setConsultationType(type.id)}
                            className={`p-5 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden ${
                              type.disabled ? 'opacity-40 grayscale cursor-not-allowed' :
                              consultationType === type.id 
                              ? 'bg-indigo-50 border-indigo-500 shadow-xl shadow-indigo-500/10' 
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                            }`}
                           >
                             <type.icon size={24} className={consultationType === type.id ? 'text-indigo-600' : 'text-slate-400'} />
                             <p className={`font-black text-sm mt-3 ${consultationType === type.id ? 'text-slate-900' : 'text-slate-500'}`}>
                               {type.name}
                               {type.disabled && <span className="ml-2 text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md">OFFLINE ONLY</span>}
                             </p>
                             <p className="text-[10px] text-slate-400 mt-1 font-medium">{type.disabled ? 'Consultation mode disabled by physician.' : type.desc}</p>
                             {consultationType === type.id && <div className="absolute top-3 right-3"><CheckCircle2 size={16} className="text-indigo-600" /></div>}
                           </button>
                         ))}
                      </div>
                   </section>

                   {/* Time Slots */}
                   <section className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={18} className="text-emerald-500" /> Available Cloud Windows
                      </h3>
                       {availableSlots.length === 0 ? (
                        <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                           <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                           <p className="text-xs font-bold text-slate-400 italic">No windows open for this date.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableSlots.map(slot => {
                            // Logic to disable past time slots for today
                            let isPast = false;
                            const todayStr = new Date().toISOString().split('T')[0];
                            if (bookingDate === todayStr) {
                               try {
                                 const [time, period] = slot.split(' ');
                                 let [hours, minutes] = time.split(':').map(Number);
                                 if (period === 'PM' && hours !== 12) hours += 12;
                                 if (period === 'AM' && hours === 12) hours = 0;
                                 const slotDate = new Date();
                                 slotDate.setHours(hours, minutes, 0, 0);
                                 isPast = slotDate < new Date();
                               } catch (e) { isPast = false; }
                            }

                            return (
                              <button 
                                key={slot}
                                disabled={isPast}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                  isPast ? 'opacity-30 cursor-not-allowed border-slate-100 text-slate-300' :
                                  selectedSlot === slot 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' 
                                  : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:text-emerald-600'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                        )}
                    </section>

                   <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Clinical Fee</p>
                         <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">₹{consultationType === 'ONLINE' ? (selectedDoctor.onlineConsultationFee || 500) : (selectedDoctor.offlineConsultationFee || 800)}</span>
                            <span className="text-xs font-bold text-slate-400">Total</span>
                         </div>
                      </div>
                      <button 
                        disabled={!selectedSlot || isBooking}
                        onClick={handleBook}
                        className="w-full sm:w-auto btn-premium bg-slate-900 text-white px-12 py-5 border-none shadow-2xl disabled:opacity-50 disabled:grayscale flex items-center gap-3"
                      >
                         {isBooking ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                         {isBooking ? 'Synchronizing Seat...' : 'Authorize Transaction'}
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DoctorCard = ({ doctor, onSelect }) => (
  <div 
    onClick={onSelect}
    className="glass-panel p-4 md:p-6 bg-white hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full shadow-sm"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
       <User size={80} className="text-slate-900" />
    </div>
    
    <div className="flex items-center gap-4 mb-4 relative z-10">
       <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-inner flex items-center justify-center text-slate-400">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}`} className="w-full h-full object-cover" alt={doctor.name} />
       </div>
       <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors truncate">Dr. {doctor.name}</h3>
          <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-widest">{doctor.specialization || "Physician"}</p>
       </div>
    </div>

    <div className="space-y-3 mb-6">
       <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
          <MapPin size={12} className="text-slate-400" />
          <span className="truncate">{doctor.hospital || "Care Center"}</span>
       </div>
       <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
             <Star size={10} fill="currentColor" /> {doctor.rating || '4.9'}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
             <Clock size={10} /> Active
          </div>
       </div>
    </div>

    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
       <div className="flex items-baseline gap-1">
          <span className="text-base font-black text-slate-900">₹{doctor.onlineConsultationFee || 500}</span>
          <span className="text-[8px] font-black uppercase text-slate-400">/ Session</span>
       </div>
       <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ChevronRight size={16} />
       </div>
    </div>
  </div>
);

export default Booking;
