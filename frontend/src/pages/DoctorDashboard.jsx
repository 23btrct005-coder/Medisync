import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileStack, Stethoscope, AlertCircle, QrCode, X, Camera } from 'lucide-react';
import api from '../api/axiosConfig';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patientEmail, setPatientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      }, false);

      scanner.render((decodedText) => {
        // Extract ID from URL if necessary
        const parts = decodedText.split('/');
        const patientId = parts[parts.length - 1];
        if (patientId && !isNaN(patientId)) {
          scanner.clear();
          setShowScanner(false);
          // Navigate to the emergency page (public)
          navigate(`/emergency/${patientId}`);
        }
      }, (error) => {
        // console.warn(error);
      });
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [showScanner, navigate]);

  const handleSendRequest = async () => {
    if(!patientEmail) return;
    setSending(true);
    try {
      await api.post('/doctor/request-access', { patientEmail });
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
      
      <div className="flex-1 min-h-[300px] mt-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle size={200} /></div>
         <h3 className="text-xl font-semibold text-slate-700 z-10">Cross-Platform Sync Established</h3>
         <p className="text-slate-500 max-w-lg mt-2 z-10">
            Reports dynamically uploaded from Patient portals are now integrated via the Supabase proxy. Navigate to the Directory to view individual patient reports and profiles.
         </p>
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

              <div id="qr-reader" className="overflow-hidden rounded-2xl border-4 border-emerald-50 bg-slate-50"></div>
              
              <div className="mt-6 text-center text-sm text-slate-500 font-medium pb-2">
                Focus the patient's QR code within the frame to access critical data instantly.
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
