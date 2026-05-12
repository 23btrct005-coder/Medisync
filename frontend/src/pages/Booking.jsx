import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Calendar, Clock, ChevronRight,
  User, Star, MapPin, Video, CheckCircle2, AlertCircle,
  ArrowLeft, CreditCard, Loader2, Sparkles, RefreshCw, QrCode, X, Activity,
  Navigation, Droplets, Ambulance, Siren, ShieldCheck, Zap, ExternalLink,
  Heart, Brain, Baby, Bone, Eye, Stethoscope, Microscope, Droplet,
  HeartPulse, Home, Monitor, Phone, Scissors, FlaskRound, FlaskConical, Thermometer
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import ClinicMap from '../components/ClinicMap';
import { 
  PHYSICIAN_DEPARTMENTS, 
  INSTITUTIONAL_SERVICE_CATALOG, 
  ALL_INSTITUTIONAL_SERVICES 
} from '../utils/clinicalRegistry';

const Booking = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiOrderData, setUpiOrderData] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkOrderData, setLinkOrderData] = useState(null);
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
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  const ALL_INSTITUTIONAL_SERVICES = INSTITUTIONAL_SERVICE_CATALOG.flatMap(c => c.services.map(s => s.name));


  const [searchParams] = useSearchParams();
  const doctorNameParam = searchParams.get('doctor');
  const modeParam = searchParams.get('mode');
  const serviceParam = searchParams.get('service');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0 && doctorNameParam) {
        const cleanParam = doctorNameParam.toLowerCase().replace(/^dr\.\s*/, '').trim();
        const doc = doctors.find(d => {
            const cleanName = d.name.toLowerCase().replace(/^dr\.\s*/, '').trim();
            return cleanName === cleanParam;
        });
        if (doc) {
            setSelectedDoctor(doc);
            setBookingStep('details');
        }
    }
  }, [doctors, doctorNameParam]);

  useEffect(() => {
    if (modeParam === 'service') {
        setBookingMode('service');
        const hospitalParam = searchParams.get('hospital');
        if (serviceParam) {
            const cleanParam = serviceParam.trim();
            const matchedService = ALL_INSTITUTIONAL_SERVICES.find(s => s.toLowerCase() === cleanParam.toLowerCase());
            setSelectedService(matchedService || cleanParam);
        } else {
            setSelectedService(null);
        }
        setBookingStep('list');
        if (hospitalParam) {
            setSearchTerm(hospitalParam);
        }
    }
  }, [modeParam, serviceParam, searchParams]);

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
    if (service === 'Ambulance Services' || service === 'Ambulance Booking') {
        setShowAmbulanceOverlay(true);
        setLocating(true);
        if (!navigator.geolocation) {
            toast.error('Clinical GPS not available in this browser context. Showing all hospitals.');
            setSelectedService(service);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                
                try {
                    await api.post('/patient/location', { latitude: loc.lat, longitude: loc.lng });
                } catch (e) {
                    console.error("Failed to sync clinical location registry", e);
                }

                setLocating(false);
                setShowAmbulanceOverlay(false);
                setSelectedService(service);
                toast.success('Clinical GPS synchronized. Showing nearest institutions.', { icon: '📍' });
            },
            (err) => {
                setLocating(false);
                setShowAmbulanceOverlay(false);
                // Silent fallback: just show all institutions instead of a red error toast
                setSelectedService(service);
                console.warn("Location access restricted by browser security model. Falling back to global nodes.");
            },
            { timeout: 5000, enableHighAccuracy: true }
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
      
      // Safety Timeout: Don't block clinical flow for more than 5s
      const slotPromise = api.get(`appointments/slots?doctorId=${selectedDoctor.id}&date=${bookingDate}${serviceParam}`);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync Timeout')), 5000));
      
      const res = await Promise.race([slotPromise, timeoutPromise]);
      setAvailableSlots(res.data || []);
    } catch (e) {
      console.warn("Clinical sync delayed:", e.message);
      toast.error("Clinical window synchronization is slow. Retrying...");
      // Try one more time silently
      try {
        const res = await api.get(`appointments/slots?doctorId=${selectedDoctor.id}&date=${bookingDate}${selectedService ? `&serviceName=${encodeURIComponent(selectedService)}` : ''}`);
        setAvailableSlots(res.data || []);
      } catch (inner) {
        toast.error("Failed to synchronize clinical windows. Please hard refresh.");
      }
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
            type: consultationType,
            consultationModality: 'General Consultation'
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
        if (isBooking) return; // Click Shield
        setIsBooking(true);
        try {
            const { data: order } = await api.post('appointments/book-service', {
                hospitalId: selectedDoctor.id,
                serviceName: selectedService,
                date: bookingDate,
                slot: selectedSlot,
                latitude: userLocation?.lat,
                longitude: userLocation?.lng
            });
            // Finalize state before processing to prevent race conditions
            setIsBooking(false); 
            processOrder(order);
        } catch (err) {
            setIsBooking(false);
            console.error("SERVICE_BOOKING_FAILURE:", err);
            toast.error(err.response?.data?.message || "Service booking failed.");
        }
    }
  };

  const processOrder = (order) => {
      if (!order) return;
      console.log("SECURE_ORDER_SYNC: Order created", order);

      if (order.preferredPaymentMode === 'UPI' && order.upiId) {
        setUpiOrderData(order);
        setShowUpiModal(true);
        return;
      }

      if (order.preferredPaymentMode === 'LINK' && order.paymentLink) {
        setLinkOrderData(order);
        setShowLinkModal(true);
        return;
      }

      if (order.isDemo) {
        toast.success("Clinical Protocol Authorized. Synchronizing session...");
        setTimeout(() => {
          navigate('/dashboard/sessions', { state: { autoOpenId: order.appointmentId } });
        }, 800);
        return;
      }

      // ── RAZORPAY SECURITY SHIELD ──
      if (typeof window.Razorpay === 'undefined') {
          console.error("GATEWAY_UNAVAILABLE: Razorpay SDK not found in clinical context.");
          toast.error("Clinical payment gateway is temporarily unreachable. Please ensure you are on a stable network or use the Secure Tunnel.");
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
              setIsBooking(false); 
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

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (e) {
        console.error("RAZORPAY_INITIALIZATION_ERROR:", e);
        toast.error("Failed to initialize payment gateway. Please refresh.");
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

  const safeDoctors = Array.isArray(doctors) ? doctors : [];
  const specialties = ['All', ...new Set(safeDoctors.map(d => d.specialization).filter(Boolean))];

  const filteredDoctors = safeDoctors.filter(d => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = d.name.toLowerCase().includes(searchLow) ||
      d.specialization?.toLowerCase().includes(searchLow) ||
      d.hospital?.toLowerCase().includes(searchLow) ||
      d.medicalDegree?.toLowerCase().includes(searchLow) ||
      d.services?.toLowerCase().includes(searchLow);

    const matchesFilter = filterSpecialty === 'All' || 
      d.specialization?.toLowerCase().trim() === filterSpecialty.toLowerCase().trim() ||
      d.specialization?.toLowerCase().includes(filterSpecialty.toLowerCase().trim()) ||
      (d.services?.toLowerCase().includes(filterSpecialty.toLowerCase().trim()));
    
    // Price enforcement: must have at least one fee configured
    const hasPrice = (d.onlineConsultationFee && d.onlineConsultationFee > 0) || 
                    (d.offlineConsultationFee && d.offlineConsultationFee > 0) ||
                    (d.serviceFees && d.serviceFees !== '{}');
                    
    return matchesSearch && matchesFilter && hasPrice;
  });

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Secure Tunnel Guidance Banner */}
      {window.location.protocol === 'http:' && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border-2 border-amber-100 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest">Secure Tunnel Required for GPS</h4>
                    <p className="text-[10px] text-amber-600/70 font-bold uppercase mt-1">Modern browsers block clinical location access on non-secure links.</p>
                </div>
            </div>
            <button 
                onClick={() => window.location.href = `https://${window.location.hostname}`}
                className="px-6 py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
                Switch to Secure Tunnel
            </button>
        </motion.div>
      )}

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
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'service' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}
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
                    {filterSpecialty !== 'All' && (
                        <button
                            onClick={() => { setFilterSpecialty('All'); setSearchTerm(''); }}
                            className="flex items-center justify-center h-[52px] px-6 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back
                        </button>
                    )}
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

                {/* Department Selection vs Doctor Grid */}
                {filterSpecialty === 'All' && !searchTerm ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Departments</h3>
                            <button 
                                onClick={() => setSearchTerm(' ')}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                                View All Physicians
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {PHYSICIAN_DEPARTMENTS.map((dept) => (
                                <button
                                    key={dept.name}
                                    onClick={() => setFilterSpecialty(dept.name)}
                                    className="p-6 rounded-[2rem] bg-white border-2 border-slate-50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group text-center"
                                >
                                    <div className={`w-14 h-14 ${dept.bg} ${dept.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                        <dept.icon size={28} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-primary transition-colors">
                                        {dept.name}
                                    </span>
                                </button>
                            ))}
                            <button
                                onClick={() => setSearchTerm(' ')}
                                className="p-6 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 hover:bg-slate-100 transition-all group text-center flex flex-col items-center justify-center"
                            >
                                <div className="w-14 h-14 bg-white text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                                    <ChevronRight size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Browse All
                                </span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
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
                )}
                </>
            ) : (
                <div className="space-y-10">
                    {/* Category Selection Step */}
                    {!selectedCategory && !selectedService && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Service Catalog</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {INSTITUTIONAL_SERVICE_CATALOG.map(cat => (
                                    <button
                                        key={cat.category}
                                        onClick={() => setSelectedCategory(cat)}
                                        className="glass-panel p-8 bg-white border-2 border-slate-50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group text-left relative overflow-hidden"
                                    >
                                        <div className={`w-16 h-16 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                            <cat.icon size={32} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 mb-2">{cat.category}</h4>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{cat.description}</p>
                                        <ChevronRight className="absolute right-8 bottom-8 text-slate-200 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sub-Service Selection Step */}
                    {selectedCategory && !selectedService && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-500">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setSelectedCategory(null)}
                                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all active:scale-90"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCategory.category}</h3>
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-0.5">Select a specific protocol</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {selectedCategory.services.map(service => (
                                    <button
                                        key={service.name}
                                        onClick={() => handleServiceSelect(service.name)}
                                        className="p-4 rounded-3xl border-2 bg-white border-slate-100 text-slate-500 hover:border-primary-200 hover:shadow-lg transition-all text-center group"
                                    >
                                        <service.icon size={24} className="mx-auto mb-3 text-slate-300 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{service.name}</span>
                                    </button>
                                ))}
                            </div>
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
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-0.5">Clinical Protocol Active</p>
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
                                <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary-500" /></div>
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
                                                    <h4 className="text-lg font-black text-slate-900 group-hover:text-primary-600 transition-colors truncate">{h.name}</h4>
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
                                                <div className="flex items-center gap-2 text-primary-600 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12} />
                                                    Instant Booking Active
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">
                                                        ₹{(() => {
                                                            try {
                                                                const fees = typeof h.serviceFees === 'string' ? JSON.parse(h.serviceFees) : h.serviceFees;
                                                                if (!fees) return '500';
                                                                // Fuzzy match the fee key
                                                                const matchedKey = Object.keys(fees).find(k => 
                                                                    k.toLowerCase().includes(selectedService.toLowerCase()) || 
                                                                    selectedService.toLowerCase().includes(k.toLowerCase())
                                                                );
                                                                return matchedKey ? fees[matchedKey] : (selectedService.includes('MRI') ? '2500' : '500');
                                                            } catch(e) {
                                                                return selectedService.includes('MRI') ? '2500' : '500';
                                                            }
                                                        })()}*
                                                    </span>
                                                    {h.latitude && h.longitude && (
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-tighter mt-1 hover:underline"
                                                        >
                                                            <MapPin size={10} />
                                                            View Maps
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all">
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
                    <Video size={18} className="text-primary-500" /> Health Sync Modality
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              ? 'bg-primary-50 border-primary-500 shadow-xl shadow-primary-500/10'
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                      >
                        <type.icon size={24} className={consultationType === type.id ? 'text-primary-600' : 'text-slate-400'} />
                        <p className={`font-black text-sm mt-3 ${consultationType === type.id ? 'text-slate-900' : 'text-slate-500'}`}>
                          {type.name}
                          {type.disabled && <span className="ml-2 text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md">OFFLINE ONLY</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{type.disabled ? 'Consultation mode disabled by physician.' : type.desc}</p>
                        {consultationType === type.id && <div className="absolute top-3 right-3"><CheckCircle2 size={16} className="text-primary-600" /></div>}
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
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={18} className={(selectedCategory?.category === 'Emergency Services' || INSTITUTIONAL_SERVICE_CATALOG.find(c => c.category === 'Emergency Services')?.services.some(s => s.name === selectedService)) ? 'text-red-500 animate-pulse' : 'text-emerald-500'} /> 
                    {(selectedCategory?.category === 'Emergency Services' || INSTITUTIONAL_SERVICE_CATALOG.find(c => c.category === 'Emergency Services')?.services.some(s => s.name === selectedService)) ? 'Emergency Availability' : 'Available Cloud Windows'}
                  </h3>
                  
                  {(selectedCategory?.category === 'Emergency Services' || INSTITUTIONAL_SERVICE_CATALOG.find(c => c.category === 'Emergency Services')?.services.some(s => s.name === selectedService)) ? (
                    <div className="relative group overflow-hidden">
                        {/* Background Pulsing Aura */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-transparent to-primary-500/10 animate-pulse duration-[4000ms]" />
                        
                        <div className="relative p-12 bg-white/70 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(225,29,72,0.1)] text-center space-y-8 transition-all duration-700 hover:shadow-[0_48px_80px_-16px_rgba(225,29,72,0.15)]">
                            
                            <div className="flex justify-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100 text-[9px] font-black uppercase tracking-[0.25em] text-rose-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                Priority Service Active
                              </div>
                            </div>

                            <div className="relative w-28 h-28 mx-auto">
                                <div className="absolute inset-0 bg-rose-500/20 rounded-[2.5rem] animate-ping duration-[3000ms]" />
                                <div className="relative w-28 h-28 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-500/40 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <Activity className="text-white animate-[pulse_2s_infinite]" size={48} />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Immediate Access Protocol</h4>
                                <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                    Bypassing standard wait-lists. This institutional node is currently configured for <span className="text-rose-500 font-black italic underline decoration-rose-200">on-demand emergency deployment.</span>
                                </p>
                            </div>

                            <div className="pt-4">
                              <button 
                                  onClick={() => setSelectedSlot('IMMEDIATE')}
                                  className={`group/btn w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-700 relative overflow-hidden ${
                                      selectedSlot === 'IMMEDIATE' 
                                          ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' 
                                          : 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 hover:scale-[1.02] active:scale-95'
                                  }`}
                              >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                  <span className="relative z-10 flex items-center justify-center gap-3">
                                      {selectedSlot === 'IMMEDIATE' ? (
                                          <>
                                              <CheckCircle2 size={20} className="text-emerald-400" />
                                              Protocol Authorized
                                          </>
                                      ) : (
                                        <>
                                          <Zap size={18} className="animate-pulse" />
                                          Authorize Deployment
                                        </>
                                      )}
                                  </span>
                              </button>
                            </div>

                            <div className="flex items-center justify-center gap-6 pt-2">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wait Time</span>
                                    <span className="text-sm font-black text-slate-900">INSTANT</span>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol</span>
                                    <span className="text-sm font-black text-slate-900">PRIORITY-1</span>
                                </div>
                            </div>
                        </div>
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
                  <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex-1">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <CreditCard size={24} className="text-primary-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Total Institutional Fee</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">
                                ₹{(() => {
                                try {
                                    const fees = typeof selectedDoctor.serviceFees === 'string' ? JSON.parse(selectedDoctor.serviceFees) : selectedDoctor.serviceFees;
                                    if (bookingMode === 'service') {
                                        if (!fees) return (selectedService?.includes('MRI') ? '2500' : '500');
                                        // Fuzzy match the fee key (Mirroring card logic)
                                        const matchedKey = Object.keys(fees).find(k => 
                                            k.toLowerCase().includes(selectedService.toLowerCase()) || 
                                            selectedService.toLowerCase().includes(k.toLowerCase())
                                        );
                                        return matchedKey ? fees[matchedKey] : (selectedService.includes('MRI') ? '2500' : '500');
                                    }
                                    const coreService = consultationType === 'ONLINE' ? 'Telemedicine' : 'General Consultation';
                                    return fees?.[coreService] || (consultationType === 'ONLINE' ? (selectedDoctor.onlineConsultationFee || 500) : (selectedDoctor.offlineConsultationFee || 800));
                                } catch(e) {
                                    return consultationType === 'ONLINE' ? (selectedDoctor.onlineConsultationFee || 500) : (selectedDoctor.offlineConsultationFee || 800);
                                }
                                })()}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">INR</span>
                        </div>
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
              </div>

              <div className="p-8 pt-4 space-y-6">
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Payable</p>
                    <p className="text-3xl font-black text-slate-900">₹{upiOrderData.amount}</p>
                  </div>
                  <div className="w-24 h-24 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${upiOrderData.upiId}%26pn=MEDISYNC%26am=${upiOrderData.amount}%26cu=INR`} 
                      alt="UPI QR" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Institutional VPA</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{upiOrderData.upiId}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">Your UPI ID</label>
                      <input 
                        type="text"
                        placeholder="e.g. name@upi"
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-primary-400 outline-none transition-all"
                        value={upiOrderData.patientUpiId || ''}
                        onChange={(e) => setUpiOrderData({...upiOrderData, patientUpiId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">Transaction ID / Ref Number</label>
                      <input 
                        type="text"
                        placeholder="12-digit UPI reference"
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-primary-400 outline-none transition-all"
                        value={upiOrderData.transactionId || ''}
                        onChange={(e) => setUpiOrderData({...upiOrderData, transactionId: e.target.value})}
                      />
                    </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 bg-primary-50/50 rounded-2xl border border-primary-100/50">
                        <input 
                            type="checkbox" 
                            id="upiConfirm"
                            className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                            checked={upiConfirmed}
                            onChange={(e) => setUpiConfirmed(e.target.checked)}
                        />
                        <label htmlFor="upiConfirm" className="text-[11px] font-bold text-slate-600 leading-relaxed cursor-pointer select-none">
                            I confirm that I have transferred <span className="text-primary-700 font-black">₹{upiOrderData.amount}</span> and the Transaction ID provided above is correct.
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
                                navigate('/dashboard/sessions', { state: { autoOpenId: upiOrderData.appointmentId } });
                            } catch (err) {
                                console.error("UPI Sync Error:", err);
                                toast.error(err.response?.data?.message || "Failed to sync UPI transaction.");
                            } finally {
                                if (showUpiModal) {
                                    setIsBooking(false);
                                    setShowUpiModal(false);
                                }
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

      <AnimatePresence>
        {showLinkModal && linkOrderData && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLinkModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <ExternalLink size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">External Payment Link</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Redirection</p>
                  </div>
                </div>
                <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 pt-4 space-y-6">
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Payable</p>
                    <p className="text-3xl font-black text-slate-900">₹{linkOrderData.amount}</p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <CreditCard size={32} className="text-slate-200" />
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                        This institution uses a private payment page for settlements. Please complete the payment on the following screen.
                    </p>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => {
                            let url = linkOrderData.paymentLink;
                            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                                url = `https://${url}`;
                            }
                            window.open(url, '_blank');
                            toast("Please complete the payment in the new window.", { icon: 'ℹ️' });
                        }}
                        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        Proceed to Secure Payment
                        <ExternalLink size={16} />
                    </button>

                    <button 
                        onClick={() => {
                            toast.success("Protocol Registered. Awaiting administrative confirmation.");
                            navigate('/dashboard/sessions', { state: { autoOpenId: linkOrderData.appointmentId } });
                            setShowLinkModal(false);
                        }}
                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        I have Paid
                    </button>

                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter px-4">
                        Click "I have Paid" after completing the transaction to synchronize your session.
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
