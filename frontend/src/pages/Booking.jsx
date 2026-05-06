import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Calendar, Clock, ChevronRight,
  User, Star, MapPin, Video, CheckCircle2, AlertCircle,
  ArrowLeft, CreditCard, Loader2, Sparkles, RefreshCw, QrCode, X, Activity,
  Navigation, Droplets, Ambulance, Siren
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import ClinicMap from '../components/ClinicMap';

const Booking = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiOrderData, setUpiOrderData] = useState(null);
  const [upiConfirmed, setUpiConfirmed] = useState(false);

  const date = new Date();
  const localToday = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

  const [bookingStep, setBookingStep] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(localToday);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('OFFLINE');

  const [bookingMode, setBookingMode] = useState('doctor'); // 'doctor' or 'service'
  const [selectedService, setSelectedService] = useState(null);
  const [serviceHospitals, setServiceHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // ── Ambulance GPS State ──
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [showAmbulanceOverlay, setShowAmbulanceOverlay] = useState(false);

  // ── Blood Bank State ──
  const [showBloodGroupModal, setShowBloodGroupModal] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const SERVICES_24_7 = [
    "Emergency & Trauma Care", "Ambulance Services", "ICU (Intensive Care Unit)", 
    "NICU (Neonatal ICU)", "Operation Theatre (Emergency)", "Casualty Department", 
    "24/7 Pharmacy", "Blood Bank", "Emergency CT Scan", "Emergency Lab Tests",
    "Oxygen & Ventilator Support", "Emergency Dialysis"
  ];

  const SERVICES_TIME_BASED = [
    "OPD (Outpatient)", "X-Ray", "MRI Scan", "Ultrasound / सोनोग्राफी", 
    "ECG & TMT", "Physiotherapy", "Dental Services", "General Surgery (Planned)",
    "Orthopedic Consultation", "Pediatric Consultation", "Gynecology & Obstetrics",
    "ENT (Ear, Nose, Throat)", "Ophthalmology (Eye)", "Dermatology (Skin)",
    "Advanced Laboratory Tests", "Health Checkup Packages"
  ];

  const PREDEFINED_INSTITUTIONAL_SERVICES = [...SERVICES_24_7, ...SERVICES_TIME_BASED];

  const [searchParams] = useSearchParams();
  const doctorNameParam = searchParams.get('doctor');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0 && doctorNameParam) {
        const doc = doctors.find(d => d.name.toLowerCase() === doctorNameParam.toLowerCase());
        if (doc) {
            setSelectedDoctor(doc);
            setBookingStep('details');
        }
    }
  }, [doctors, doctorNameParam]);

  useEffect(() => {
    if (selectedDoctor && bookingDate) {
      fetchSlots();
    }
  }, [selectedDoctor, bookingDate]);

  useEffect(() => {
    if (selectedService) {
        const extra = {};
        if (selectedService === 'Blood Bank' && selectedBloodGroup) {
            extra.bloodGroup = selectedBloodGroup;
        }
        fetchHospitalsByService(selectedService, extra);
    }
  }, [selectedService, selectedBloodGroup, userLocation]);

  const fetchHospitalsByService = async (service, extraParams = {}) => {
    setLoadingHospitals(true);
    try {
        const params = new URLSearchParams({ service, ...extraParams });
        const res = await api.get(`appointments/hospitals-by-service?${params.toString()}`);
        let hospitals = res.data || [];

        // Sort by distance if user location is available
        if (userLocation) {
            hospitals = hospitals
                .map(h => ({
                    ...h,
                    distance: h.latitude && h.longitude
                        ? haversineKm(userLocation.lat, userLocation.lng, h.latitude, h.longitude)
                        : null
                }))
                .sort((a, b) => {
                    if (a.distance === null) return 1;
                    if (b.distance === null) return -1;
                    return a.distance - b.distance;
                });
        }
        setServiceHospitals(hospitals);
    } catch (e) {
        toast.error("Failed to fetch hospitals for this service.");
    } finally {
        setLoadingHospitals(false);
    }
  };

  // ── Haversine Distance (km) ──
  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // ── Handle Service Card Click ──
  const handleServiceSelect = (service) => {
    if (service === 'Ambulance Services') {
        setShowAmbulanceOverlay(true);
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                
                // Sync with backend (Store don't just keep in frontend)
                try {
                    await api.post('/patient/location', { latitude: loc.lat, longitude: loc.lng });
                } catch (e) {
                    console.error("Failed to sync clinical location registry", e);
                }

                setLocating(false);
                setShowAmbulanceOverlay(false);
                setSelectedService(service);
                // Will trigger fetchHospitalsByService via useEffect
            },
            (err) => {
                setLocating(false);
                setShowAmbulanceOverlay(false);
                toast.error('Location access denied. Showing all hospitals.');
                setSelectedService(service);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
        return;
    }
    if (service === 'Blood Bank') {
        setShowBloodGroupModal(true);
        return;
    }
    setSelectedService(service);
  };

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
    if (!selectedDoctor?.id || selectedDoctor.id === 'undefined') {
      console.warn("Skipping slot retrieval: doctorId is invalid", selectedDoctor);
      return;
    }

    try {
      setLoading(true);
      setAvailableSlots([]);
      const serviceParam = selectedService ? `&serviceName=${encodeURIComponent(selectedService)}` : '';
      const res = await api.get(`appointments/slots?doctorId=${selectedDoctor.id}&date=${bookingDate}${serviceParam}`);
      setAvailableSlots(res.data || []);
    } catch (e) {
      toast.error("Failed to synchronize available clinical windows.");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (bookingMode === 'doctor') {
        if (!selectedDoctor || !selectedDoctor.id || selectedDoctor.id === 'undefined') {
          toast.error("Physician selection invalid. Please re-select from marketplace.");
          setBookingStep('list');
          return;
        }
        if (!selectedSlot) {
          toast.error("Cloud window not selected. Please choose a time.");
          return;
        }
        setIsBooking(true);
        try {
          const { data: order } = await api.post('appointments/book', {
            doctorId: selectedDoctor.id,
            date: bookingDate,
            slot: selectedSlot,
            type: consultationType
          });
          processOrder(order);
        } catch (err) {
          toast.error(err.response?.data?.message || "Cloud synchronization failed.");
        } finally {
          setIsBooking(false);
        }
    } else {
        // Institutional Service Booking
        if (!selectedDoctor || !selectedDoctor.id) {
            toast.error("Hospital selection invalid.");
            return;
        }
        if (!selectedSlot) {
            toast.error("Please select a time slot.");
            return;
        }
        setIsBooking(true);
        try {
            const { data: order } = await api.post('appointments/book-service', {
                hospitalId: selectedDoctor.id,
                serviceName: selectedService,
                date: bookingDate,
                slot: selectedSlot
            });
            processOrder(order);
        } catch (err) {
            toast.error(err.response?.data?.message || "Service booking failed.");
        } finally {
            setIsBooking(false);
        }
    }
  };

  const processOrder = (order) => {
      console.log("SECURE_ORDER_SYNC: Order created", order);

      if (order.isDemo) {
        toast.info("Clinical Demo Mode active. Finalizing without payment...");
        navigate('/dashboard/sessions', { state: { autoOpenId: order.appointmentId } });
        return;
      }

      if (order.preferredPaymentMode === 'UPI' && order.upiId) {
        setUpiOrderData(order);
        setShowUpiModal(true);
        return;
      }

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: "INR",
        name: "MEDISYNC HEALTH",
        description: `Consultation/Service with ${selectedDoctor.name}`,
        image: "/icon.svg",
        order_id: order.razorpayOrderId,
        handler: async (response) => {
          setIsBooking(true);
          const verifyPayment = async (retries = 3) => {
            try {
              console.log(`PAYMENT_SUCCESS: Verifying (Attempt ${4 - retries}/3)...`, response);
              await api.post('appointments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              toast.success("Transaction Authorized! Session Synchronized.");
              navigate('/dashboard/sessions', { state: { autoOpenId: order.appointmentId } });
            } catch (err) {
              if (retries > 0) {
                console.warn("Verification flicker detected. Retrying in 2s...");
                setTimeout(() => verifyPayment(retries - 1), 2000);
              } else {
                console.error("VERIFICATION_FAILURE:", err);
                toast.error("Payment confirmed but sync delayed. Please click 'Verify Manually' in your sessions tab.", { duration: 6000 });
                setIsBooking(false);
              }
            }
          };
          verifyPayment();
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: () => {
            setIsBooking(false);
            toast("Clinical transaction cancelled.", { icon: '⚠️' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
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

  const safeDoctors = Array.isArray(doctors) ? doctors : [];
  const specialties = ['All', ...new Set(safeDoctors.map(d => d.specialization).filter(Boolean))];

  const filteredDoctors = safeDoctors.filter(d => {
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Full Service Booking</h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg">Discover board-certified physicians and institutional diagnostic services.</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
            <button 
                onClick={() => { setBookingMode('doctor'); setBookingStep('list'); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'doctor' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
            >
                Physicians
            </button>
            <button 
                onClick={() => { setBookingMode('service'); setBookingStep('list'); setSelectedService(null); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'service' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
                Diagnostic Services
            </button>
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
            {bookingMode === 'doctor' ? (
                <>
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
                      className={`flex items-center justify-center h-[52px] px-4 md:px-6 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all ${showFilters || filterSpecialty !== 'All'
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
                              className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterSpecialty === s
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
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[2.5rem] animate-pulse" />)}
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
                </>
            ) : (
                <div className="space-y-10">
                    {/* Service Selection Step */}
                    {!selectedService && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {PREDEFINED_INSTITUTIONAL_SERVICES.map(service => (
                            <button
                                key={service}
                                onClick={() => handleServiceSelect(service)}
                                className={`p-4 rounded-3xl border-2 text-center transition-all relative ${selectedService === service 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10' 
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}
                            >
                                {SERVICES_24_7.includes(service) && (
                                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-emerald-500 text-white text-[7px] font-black rounded-full uppercase tracking-widest shadow-sm z-10">24/7</div>
                                )}
                                <Activity size={24} className={`mx-auto mb-3 ${selectedService === service ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{service}</span>
                            </button>
                        ))}
                        </div>
                    )}

                    {selectedService && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setSelectedService(null)}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all active:scale-90"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedService}</h3>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Clinical Protocol Active</p>
                                    </div>
                                </div>
                                {selectedService === 'Ambulance Services' && userLocation && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                                            <Navigation size={12} className="animate-pulse" />
                                            Sorted by distance from your location
                                        </div>
                                    )}
                                    {selectedService === 'Blood Bank' && selectedBloodGroup && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-[10px] font-black uppercase tracking-widest">
                                                <Droplets size={12} />
                                                Blood Group: {selectedBloodGroup}
                                            </div>
                                            <button
                                                onClick={() => { setSelectedBloodGroup(null); setSelectedService(null); setShowBloodGroupModal(true); }}
                                                className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                            >
                                                <X size={14} className="text-slate-500" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Available Institutions</p>
                                    <p className="text-sm font-black text-slate-800">{serviceHospitals.length} Nodes Found</p>
                                </div>

                            {loadingHospitals ? (
                                <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>
                            ) : serviceHospitals.length === 0 ? (
                                <div className="p-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">No institutions found matching this protocol.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {serviceHospitals.map(h => (
                                        <div 
                                            key={h.id}
                                            onClick={() => { setSelectedDoctor(h); setBookingStep('slots'); }}
                                            className="glass-panel p-6 bg-white hover:border-emerald-400 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-inner flex items-center justify-center shrink-0">
                                                    {h.logoUrl ? <img src={h.logoUrl} className="w-full h-full object-cover" alt="" /> : <Activity size={32} className="text-slate-300" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{h.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{h.hospitalType || 'Medical Facility'}</p>
                                                    {h.distance !== null && h.distance !== undefined && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Navigation size={10} className="text-blue-500" />
                                                            <span className="text-[10px] font-black text-blue-600">
                                                                {h.distance < 1 ? `${(h.distance * 1000).toFixed(0)}m` : `${h.distance.toFixed(1)}km`} away
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    <span>{h.city}, {h.state}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12} />
                                                    Instant Booking Active
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-900">
                                                    ₹{(() => {
                                                        try {
                                                            const fees = typeof h.serviceFees === 'string' ? JSON.parse(h.serviceFees) : h.serviceFees;
                                                            return fees?.[selectedService] || (selectedService.includes('MRI') ? '2500' : '500');
                                                        } catch(e) {
                                                            return selectedService.includes('MRI') ? '2500' : '500';
                                                        }
                                                    })()}*
                                                </span>
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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
                  {(() => {
                    const isHospital = !!selectedDoctor.hospitalType || !!selectedDoctor.logoUrl;
                    const profileImg = isHospital ? selectedDoctor.logoUrl : selectedDoctor.profilePictureUrl;
                    const fallbackImg = isHospital 
                        ? `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedDoctor.name}` 
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctor.name}`;

                    return (
                        <>
                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 mb-6 shadow-2xl">
                            {profileImg ? (
                            <img src={profileImg} className="w-full h-full object-cover" alt="" />
                            ) : (
                            <img src={fallbackImg} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-none mb-2">
                            {isHospital ? "" : "Dr. "}{selectedDoctor.name}
                        </h2>
                        <p className="text-primary-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                            {selectedDoctor.specialization || selectedDoctor.hospitalType || "Medical Facility"}
                        </p>
                        </>
                    );
                  })()}

                  {selectedDoctor.absenceDates && selectedDoctor.absenceDates.includes(localToday) && (
                    <div className="mb-6 px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {selectedDoctor.hospitalType ? "Facility Closed Today" : "Physician Absent Today"}
                    </div>
                  )}

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
                      <span className="text-xs font-medium text-slate-400 italic">Affiliated Hospital</span>
                      <span className="text-xs font-black uppercase tracking-widest text-primary-400">{selectedDoctor.hospital || 'Care Center'}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-medium text-slate-400 italic">Experience</span>
                      <span className="text-xs font-black uppercase tracking-widest underline decoration-primary decoration-2">{selectedDoctor.yearsOfExperience || '8+'} Years</span>
                    </div>
                  </div>

                  {/* Clinical Services & Infrastructure */}
                  <div className="w-full mt-6 space-y-4 text-left">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clinical Capabilities</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedDoctor.services ? selectedDoctor.services.split(', ').map(s => (
                                <span key={s} className="px-3 py-1.5 bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-tight rounded-xl border border-white/10">
                                    {s}
                                </span>
                            )) : <span className="text-slate-500 italic text-[10px]">General Medical Services</span>}
                        </div>
                    </div>
                  </div>
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
                    min={localToday}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold text-slate-800 transition-all ${
                        selectedDoctor.absenceDates && selectedDoctor.absenceDates.includes(bookingDate)
                        ? 'border-red-300 ring-4 ring-red-500/5'
                        : 'border-slate-100 focus:border-primary'
                    }`}
                  />
                  {selectedDoctor.absenceDates && selectedDoctor.absenceDates.includes(bookingDate) && (
                    <div className="p-5 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-center gap-4 animate-pulse">
                        <div className="p-3 bg-red-500 text-white rounded-2xl shadow-xl shadow-red-500/20">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-red-700 uppercase tracking-widest">Physician Absent</h4>
                            <p className="text-[10px] text-red-600/70 font-bold uppercase mt-1 leading-none">Not accepting bookings for {new Date(bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                        </div>
                    </div>
                  )}
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
                        className={`p-5 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden ${type.disabled ? 'opacity-40 grayscale cursor-not-allowed' :
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

                  {/* Robust Map Visibility Node */}
                  <AnimatePresence>
                    {consultationType === 'OFFLINE' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-5 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-primary" />
                            <div className="flex flex-col">
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Clinical Location</h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{selectedDoctor.clinicAddress || selectedDoctor.hospital || 'Care Center'}</p>
                            </div>
                          </div>
                          <ClinicMap
                            address={
                              selectedDoctor.clinicAddress || 
                              (selectedDoctor.city && selectedDoctor.state 
                                ? `${selectedDoctor.name}, ${selectedDoctor.city}, ${selectedDoctor.state}` 
                                : `Dr. ${selectedDoctor.name}, ${selectedDoctor.specialization || 'Clinical Specialist'}, ${selectedDoctor.hospital || 'Care Center'}`)
                            }
                            hospitalName={selectedDoctor.hospital}
                            height="280px"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Time Slots */}
                <section className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={18} className={SERVICES_24_7.includes(selectedService) ? 'text-red-500 animate-pulse' : 'text-emerald-500'} /> 
                    {SERVICES_24_7.includes(selectedService) ? 'Emergency Availability' : 'Available Cloud Windows'}
                  </h3>
                  
                  {SERVICES_24_7.includes(selectedService) ? (
                    <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-red-100 text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/20 animate-pulse">
                            <Activity className="text-white" size={32} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-red-700 uppercase tracking-widest">Immediate / On-Demand Access</h4>
                            <p className="text-[10px] text-red-600/70 font-bold uppercase mt-1">24/7 Emergency Service: No Slot Booking Required</p>
                        </div>
                        <button 
                            onClick={() => setSelectedSlot('IMMEDIATE')}
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedSlot === 'IMMEDIATE' ? 'bg-red-500 text-white shadow-xl shadow-red-500/30' : 'bg-white text-red-500 border-2 border-red-200 hover:bg-red-50'}`}
                        >
                            {selectedSlot === 'IMMEDIATE' ? '✓ Immediate Access Requested' : 'Confirm Immediate Access'}
                        </button>
                    </div>
                  ) : (
                    <>
                      {loadingSlots ? (
                        <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                          <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                          <p className="text-xs font-bold text-slate-400 italic">No windows open for this date.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {availableSlots.map(slot => {
                            const isToday = bookingDate === localToday;
                            const isPast = isToday && (() => {
                              try {
                                const [time, period] = slot.split(' ');
                                let [hours, minutes] = time.split(':').map(Number);
                                if (period === 'PM' && hours !== 12) hours += 12;
                                if (period === 'AM' && hours === 12) hours = 0;
                                const slotDate = new Date();
                                slotDate.setHours(hours, minutes, 0, 0);
                                return slotDate < new Date();
                              } catch (e) { return false; }
                            })();

                            return (
                              <button
                                key={slot}
                                disabled={isPast}
                                onClick={() => setSelectedSlot(slot)}
                                className={`px-4 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                  selectedSlot === slot 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10' 
                                    : isPast
                                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                      : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </section>

                <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Clinical Fee</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        ₹{(() => {
                          try {
                            const fees = typeof selectedDoctor.serviceFees === 'string' ? JSON.parse(selectedDoctor.serviceFees) : selectedDoctor.serviceFees;
                            if (bookingMode === 'service') {
                                return fees?.[selectedService] || (selectedService.includes('MRI') ? '2500' : '500');
                            }
                            const coreService = consultationType === 'ONLINE' ? 'Telemedicine' : 'General Consultation';
                            return fees?.[coreService] || (consultationType === 'ONLINE' ? (selectedDoctor.onlineConsultationFee || 500) : (selectedDoctor.offlineConsultationFee || 800));
                          } catch(e) {
                            return consultationType === 'ONLINE' ? (selectedDoctor.onlineConsultationFee || 500) : (selectedDoctor.offlineConsultationFee || 800);
                          }
                        })()}
                      </span>
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
      <AnimatePresence>
        {showUpiModal && upiOrderData && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpiModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Direct UPI Payment</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Clinical Node</p>
                  </div>
                </div>
                <button onClick={() => setShowUpiModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>              <div className="p-8 pt-4 space-y-6">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Consultation Fee</p>
                  <p className="text-4xl font-black text-slate-900">₹{upiOrderData.amount}</p>
                </div>
                
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-48 h-48 bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-inner flex items-center justify-center">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiOrderData.upiId}%26pn=MEDISYNC%26am=${upiOrderData.amount}%26cu=INR`} 
                                alt="UPI QR Code" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black text-slate-900">{upiOrderData.upiId}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest italic">Verified Clinical VPA</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Your UPI ID (VPA)</label>
                            <input 
                                type="text"
                                placeholder="e.g. name@upi"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
                                value={upiOrderData.patientUpiId || ''}
                                onChange={(e) => setUpiOrderData({...upiOrderData, patientUpiId: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Transaction ID / Ref Number</label>
                            <input 
                                type="text"
                                placeholder="12-digit UPI reference"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
                                value={upiOrderData.transactionId || ''}
                                onChange={(e) => setUpiOrderData({...upiOrderData, transactionId: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input 
                            type="checkbox" 
                            id="upiConfirm"
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            checked={upiConfirmed}
                            onChange={(e) => setUpiConfirmed(e.target.checked)}
                        />
                        <label htmlFor="upiConfirm" className="text-[10px] font-black text-slate-500 uppercase tracking-tight leading-relaxed">
                            I confirm that I have transferred ₹{upiOrderData.amount} and the Transaction ID provided above is correct.
                        </label>
                    </div>

                    <button 
                        onClick={async () => {
                            if (!upiOrderData.patientUpiId || !upiOrderData.transactionId) {
                                toast.error("Please provide both UPI ID and Transaction ID for verification.");
                                return;
                            }
                            try {
                                setIsBooking(true);
                                if (!upiOrderData?.appointmentId || upiOrderData.appointmentId === 'undefined') {
                                    toast.error("Critical: Session ID lost. Please restart booking.");
                                    return;
                                }
                                await api.post('appointments/verify-upi', {
                                    appointmentId: upiOrderData.appointmentId,
                                    patientUpiId: upiOrderData.patientUpiId,
                                    transactionId: upiOrderData.transactionId
                                });
                                toast.success("Transaction Registered! Awaiting Administrative Verification.");
                                navigate('/dashboard/sessions', { state: { autoOpenApptId: upiOrderData.appointmentId } });
                            } catch (err) {
                                toast.error("Failed to sync UPI transaction.");
                            } finally {
                                setIsBooking(false);
                                setShowUpiModal(false);
                            }
                        }}
                        disabled={isBooking || !upiConfirmed || !upiOrderData?.patientUpiId?.trim() || !upiOrderData?.transactionId?.trim()}
                        className={`w-full py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                            (upiConfirmed && upiOrderData?.patientUpiId?.trim() && upiOrderData?.transactionId?.trim()) 
                            ? 'bg-slate-900 text-white shadow-slate-900/20' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {isBooking ? "Registering Protocol..." : "Complete Booking"}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-4 uppercase tracking-tighter">
                        Manual verification required before session authorization.
                    </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Ambulance GPS Locating Overlay ─── */}
      <AnimatePresence>
        {showAmbulanceOverlay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[3rem] p-12 max-w-sm w-full mx-4 text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
                <Navigation size={40} className="text-red-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Locating You</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                Requesting GPS coordinates to find the nearest ambulance services
              </p>
              <div className="flex justify-center gap-1.5 mb-6">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-bold">Please allow location access when prompted.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Blood Group Picker Modal ─── */}
      <AnimatePresence>
        {showBloodGroupModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <Droplets className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Blood Group</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Select required blood type</p>
                  </div>
                </div>
                <button onClick={() => setShowBloodGroupModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-8">
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    onClick={() => {
                      setSelectedBloodGroup(bg);
                      setShowBloodGroupModal(false);
                      setSelectedService('Blood Bank');
                    }}
                    className={`py-4 rounded-2xl font-black text-sm border-2 transition-all active:scale-95 ${
                      selectedBloodGroup === bg
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-white text-slate-700 border-slate-100 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                We'll show hospitals with your blood type available
              </p>
            </motion.div>
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
        {doctor.profilePictureUrl ? (
          <img src={doctor.profilePictureUrl} className="w-full h-full object-cover" alt={doctor.name} />
        ) : <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}`} className="w-full h-full object-cover" alt={doctor.name} />}
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
          <Star size={10} fill="currentColor" /> {doctor.averageRating || '0.0'} ({doctor.ratingCount || 0})
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
