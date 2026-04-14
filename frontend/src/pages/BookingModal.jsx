import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Calendar, Clock, CreditCard, X, Video, MapPin, Activity, Loader2, CheckCircle, BadgeCheck } from 'lucide-react';

const BookingModal = ({ doctor, onClose, onBookingSuccess }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [type, setType] = useState(doctor.onlineConsultation ? 'ONLINE' : (doctor.clinicAddress ? 'OFFLINE' : 'ONLINE'));
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (date) {
      fetchSlots();
    }
  }, [date]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`appointments/slots?doctorId=${doctor.id}&date=${date}`);
      setSlots(res.data);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      // 1. Initiate booking (Create Razorpay Order)
      const res = await api.post('appointments/book', {
        doctorId: doctor.id,
        date,
        slot: selectedSlot,
        type
      });

      const appointment = res.data;

      // 2. Load Razorpay
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }

      const options = {
        key: appointment.razorpayKeyId, 
        amount: appointment.amount * 100,
        currency: "INR",
        name: "MediSync Healthcare",
        description: `Consultation with Dr. ${doctor.name}`,
        order_id: appointment.razorpayOrderId,
        handler: async (response) => {
           // 3. Verify Payment
           try {
             await api.post('appointments/verify', {
               razorpay_order_id: response.razorpay_order_id,
               razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature
             });
             setSuccess(true);
             setTimeout(() => {
                onBookingSuccess();
                onClose();
             }, 2000);
           } catch (err) {
             alert("Payment verification failed. Please contact support.");
           }
        },
        prefill: {
          name: "", // Will be filled from user context if available
          email: "",
          contact: ""
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert(err.response?.data?.message || "Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Booking Confirmed!</h3>
                <p className="text-slate-500 mt-2">Your appointment has been successfully scheduled.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Calendar size={20} /></div>
               <h3 className="text-lg font-bold text-slate-800">Book Appointment</h3>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full border border-slate-100"><X size={20} /></button>
         </div>

         <div className="p-6 overflow-y-auto space-y-6">
            {/* Doctor Info Mini */}
            <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl uppercase">
                   {doctor.name?.[0]}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">Dr. {doctor.name}</h4>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{doctor.specialization}</p>
                </div>
            </div>

            {/* Type Selection */}
            <div className={`grid gap-3 mb-6 ${doctor.onlineConsultation ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {doctor.onlineConsultation && (
                    <button 
                      onClick={() => setType('ONLINE')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${type === 'ONLINE' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                        <Video size={24} />
                        <span className="text-sm font-bold">Online</span>
                        <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">Video Call</span>
                        <span className="text-xs font-bold">₹{doctor.onlineConsultationFee || '500'}</span>
                    </button>
                )}
                <button 
                  onClick={() => setType('OFFLINE')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${type === 'OFFLINE' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                    <MapPin size={24} />
                    <span className="text-sm font-bold">Offline</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">At Clinic</span>
                    <span className="text-xs font-bold">₹{doctor.offlineConsultationFee || '800'}</span>
                </button>
            </div>

            {/* Date Selection */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 ml-1">Select Date</label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
                    />
                </div>
            </div>

            {/* Slot selection */}
            {date && (
                <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 ml-1">Available Slots</label>
                     {loadingSlots ? (
                         <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-600" /></div>
                     ) : slots.length === 0 ? (
                         <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl italic">No slots available for this day.</p>
                     ) : (
                         <div className="grid grid-cols-3 gap-2">
                             {slots.map(slot => (
                                 <button 
                                   key={slot}
                                   onClick={() => setSelectedSlot(slot)}
                                   className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${selectedSlot === slot ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'}`}
                                 >
                                     {slot}
                                 </button>
                             ))}
                         </div>
                     )}
                </div>
            )}
         </div>

         {/* Footer / CTA */}
         <div className="p-6 border-t border-slate-100 bg-slate-50/50">
             <button 
               onClick={handleBooking}
               disabled={!selectedSlot || booking}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
             >
                {booking ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><CreditCard size={20} /> Pay & Book Now</>}
             </button>
             <p className="text-[10px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1 uppercase tracking-widest">
                <BadgeCheck size={12} className="text-blue-400" /> Secure Payment via Razorpay
             </p>
         </div>
      </div>
    </div>
  );
};

export default BookingModal;
