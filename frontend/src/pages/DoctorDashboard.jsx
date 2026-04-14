import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileStack, Stethoscope, AlertCircle, QrCode, X, Camera } from 'lucide-react';
import api from '../api/axiosConfig';
import { Html5Qrcode } from 'html5-qrcode';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patientEmail, setPatientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();
 
  useEffect(() => {
    fetchRequests();
    fetchAppointments();
  }, []);
 
  const fetchRequests = async () => {
    try {
      const res = await api.get('doctor/requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch doctor requests", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      // We'll reuse the my-appointments endpoint or similar for doctor
      const res = await api.get('appointments/my-appointments'); 
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch doctor appointments", err);
    }
  };

  useEffect(() => {
    let html5QrCode = null;
    if (showScanner) {
      setScanError('');
      // Delay to ensure the DOM element #qr-reader is mounted
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              const parts = decodedText.split('/');
              const patientId = parts[parts.length - 1];
              if (patientId && !isNaN(patientId)) {
                html5QrCode.stop().then(() => {
                   setShowScanner(false);
                   navigate(`/emergency/${patientId}`);
                }).catch(err => console.error("Failed to stop scanner", err));
              }
            },
            (errorMessage) => { /* ignore silent errors */ }
          ).catch(err => {
            console.error("Camera fail:", err);
            setScanError("Unable to access camera. Please check permissions.");
          });
        } catch (e) {
          console.error("Scanner setup error:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(e => console.warn(e));
        }
      };
    }
  }, [showScanner, navigate]);

  const handleSendRequest = async () => {
    if(!patientEmail) return;
    setSending(true);
    try {
      await api.post('doctor/request-access', { patientEmail });
      alert(`Request successfully sent to ${patientEmail}!`);
      setPatientEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <ProfileCompletionBanner />
      <div className="bg-gradient-to-r from-blue-700 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden shrink-0">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Doctor'}!</h1>
            <p className="text-blue-100 max-w-xl">This is your secure physician dashboard. Patient overview and schedules will be managed here.</p>
        </div>
        <Stethoscope className="absolute right-8 top-4 text-white opacity-10" size={120} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card flex items-start space-x-4 border-l-4 border-emerald-500">
            <div className="p-4 bg-emerald-50 rounded-full text-emerald-600">
              <Users size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">My Patients</h3>
              <p className="text-slate-500 text-sm mt-1">Manage cases or request patient linkage</p>
              <div className="mt-4 flex gap-2">
                 <input 
                    type="email" 
                    placeholder="Patient Email..." 
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="flex-1 text-sm border-slate-200 rounded-lg px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                 />
                 <button 
                    onClick={handleSendRequest}
                    disabled={sending}
                    className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-emerald-200 disabled:opacity-50"
                 >
                    {sending ? 'Sending...' : 'Send Request'}
                 </button>
              </div>
            </div>
        </div>

        <div className="card flex items-start space-x-4 border-l-4 border-purple-500">
            <div className="p-4 bg-purple-50 rounded-full text-purple-600">
              <FileStack size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Global Uploads Review</h3>
              <p className="text-slate-500 text-sm mt-1">Review newly uploaded reports from patients</p>
              <a href="/doctor-dashboard/patients" className="mt-3 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">Access Patient Directory &rarr;</a>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col p-6 shadow-sm relative overflow-hidden h-full">
           <div className="flex items-center gap-2 mb-4">
              <QrCode size={20} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-800">Sent Access Requests</h3>
           </div>
           
           {requests.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <AlertCircle size={40} className="text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm">No pending requests sent yet.</p>
             </div>
           ) : (
             <div className="space-y-3 overflow-y-auto max-h-[180px] pr-1">
                {requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">Patient: {req.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{req.patient?.email}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                      req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
             </div>
           )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col p-6 shadow-sm relative overflow-hidden h-full">
           <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-blue-500" />
              <h3 className="text-lg font-bold text-slate-800">Appointment Schedule</h3>
           </div>
           
           {appointments.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <Clock size={40} className="text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm italic">No upcoming appointments.</p>
             </div>
           ) : (
             <div className="space-y-3 overflow-y-auto max-h-[180px] pr-1">
                {appointments.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{appt.patient?.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                            <Clock size={10} /> {appt.timeSlot}
                         </span>
                         <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                            <Calendar size={10} /> {appt.appointmentDate}
                         </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      appt.consultationType === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {appt.consultationType}
                    </span>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* Floating QR Scan Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90]">
        <button 
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black px-8 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-white/20 transition-all hover:scale-105 active:scale-95 group"
        >
          <Camera size={24} className="group-hover:rotate-12 transition-transform" />
          SCAN EMERGENCY QR
        </button>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-300 border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <QrCode size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Scanner Ready</h3>
                </div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition hover:bg-slate-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              {scanError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                   <AlertCircle className="text-red-500 mx-auto mb-3" size={40} />
                   <p className="text-red-700 font-bold">{scanError}</p>
                   <button 
                    onClick={() => setShowScanner(false)}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold"
                   >
                    Close & Retry
                   </button>
                </div>
              ) : (
                <>
                  <div id="qr-reader" className="overflow-hidden rounded-2xl border-4 border-emerald-50 bg-slate-900 aspect-square"></div>
                  <div className="mt-6 text-center text-sm text-slate-500 font-medium pb-2">
                    Scanning active. Point your camera at the emergency QR code.
                  </div>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
