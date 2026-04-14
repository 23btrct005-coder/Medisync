import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import QRCode from 'react-qr-code';
import { Activity, ClipboardList, UserCheck, Calendar, QrCode, X, Download, UserX, Loader2, Video, MapPin, Clock } from 'lucide-react';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import BookingModal from './BookingModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ recordsCount: 0, latestDiagnosis: 'Loading...', doctor: 'Loading...' });
  const [doctorEmail, setDoctorEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [revokingId, setRevokingId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  useEffect(() => {
    const fetchDashboardInfo = async () => {
      try {
        const res = await api.get('records/my-records');
        const records = res.data;
        if(records && records.length > 0) {
            const latest = records.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
            setStats({
                recordsCount: records.length,
                latestDiagnosis: latest.diagnosis,
                doctor: latest.doctorName
            });
        } else {
            setStats({ recordsCount: 0, latestDiagnosis: 'None', doctor: 'None' });
        }
      } catch (error) {
        console.error("Failed to load dashboard info");
      }
    };
    
    fetchDashboardInfo();
    fetchRequests();
    fetchLinkedDoctors();
    fetchAppointments();

    // Poll for new requests every 30 seconds
    const intervalId = setInterval(fetchRequests, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('patient/requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error("Failed to fetch requests", e);
    }
  };

  const fetchLinkedDoctors = async () => {
    try {
      const res = await api.get('patient/doctors');
      setDoctors(res.data || []);
    } catch (e) {
      console.error("Failed to fetch linked doctors", e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('appointments/my-appointments');
      setAppointments(res.data || []);
    } catch (e) {
      console.error("Failed to fetch appointments", e);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await api.post(`patient/requests/${id}/accept`);
      alert("Access granted successfully!");
      fetchRequests(); // Refresh
    } catch(err) {
      alert("Failed to accept request.");
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.post(`patient/requests/${id}/reject`);
      fetchRequests(); // Refresh
    } catch(err) {
      alert("Failed to reject request.");
    }
  };

  const handleLinkDoctor = async () => {
    if(!doctorEmail) return;
    setLinking(true);
    try {
      const res = await api.post('patient/link-doctor', { doctorEmail });
      alert(res.data.message || 'Access successfully granted to ' + doctorEmail);
      setDoctorEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant access. Ensure the email is correct.');
    } finally {
      setLinking(false);
    }
  };

  const handleRevokeAccess = async (doctorId) => {
    if (!window.confirm("Are you sure you want to revoke this doctor's access? They will no longer be able to view your records.")) return;
    
    setRevokingId(doctorId);
    try {
      await api.delete(`patient/doctors/${doctorId}`);
      setDoctors(doctors.filter(d => d.id !== doctorId));
    } catch (err) {
      alert("Failed to revoke access. Please try again.");
    } finally {
      setRevokingId(null);
    }
  };

  const emergencyUrl = `${window.location.origin}/emergency/${user?.id}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById('dashboard-qr-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `medisync-emergency-qr.png`;
        a.click();
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <ProfileCompletionBanner />
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Patient'}!</h1>
                <p className="text-primary-100 max-w-xl">Your health dashboard is up to date. Check your latest medical records and reports below.</p>
            </div>
            <button 
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-2xl backdrop-blur-md transition border border-white/30 active:scale-95 shadow-lg group"
            >
                <QrCode size={24} className="group-hover:rotate-12 transition-transform" />
                Show My Emergency QR
            </button>
        </div>
        <Activity className="absolute right-8 top-8 text-white opacity-10" size={120} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card border-l-4 border-l-blue-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Medical Records</p>
              <p className="text-3xl font-bold text-slate-800">{stats.recordsCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <ClipboardList size={28} />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Latest Diagnosis</p>
              <p className="text-xl font-bold text-slate-800 truncate max-w-[150px]">{stats.latestDiagnosis}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <Activity size={28} />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-purple-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Assigned Doctor</p>
              <p className="text-xl font-bold text-slate-800 truncate max-w-[150px]">{stats.doctor}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full text-purple-600">
              <UserCheck size={28} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                  <div className="flex items-center space-x-2 mb-2">
                      <UserCheck className="text-primary-600" size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Health Providers</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">You can manually grant access directly via their registered Email Address.</p>
                  
                  <div className="flex space-x-3">
                      <input 
                         type="email" 
                         placeholder="Doctor Email Address..." 
                         value={doctorEmail}
                         onChange={(e) => setDoctorEmail(e.target.value)}
                         className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm" 
                      />
                      <button 
                         onClick={handleLinkDoctor}
                         disabled={linking}
                         className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition disabled:opacity-50 text-sm whitespace-nowrap"
                      >
                         {linking ? 'Processing...' : 'Grant Access'}
                      </button>
                  </div>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                  <Activity className="text-emerald-500" size={20} />
                  <h3 className="text-lg font-semibold text-slate-800">Connection Requests</h3>
              </div>
              
              {requests.length === 0 ? (
                  <p className="text-slate-600 text-sm mt-2 text-center flex-1 flex flex-col justify-center">No pending requests.</p>
              ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[140px] pr-2">
                     {requests.map(req => (
                        <div key={req.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center">
                            <div>
                               <p className="text-sm font-semibold text-slate-800">Dr. {req.doctor?.name}</p>
                               <p className="text-xs text-slate-500">{req.doctor?.email}</p>
                            </div>
                            <div className="flex space-x-2">
                               <button onClick={() => handleAcceptRequest(req.id)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-xs font-bold transition">Accept</button>
                               <button onClick={() => handleRejectRequest(req.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-bold transition">Reject</button>
                            </div>
                        </div>
                     ))}
                  </div>
              )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                  <UserCheck className="text-primary-500" size={20} />
                  <h3 className="text-lg font-semibold text-slate-800">Authorized Doctors</h3>
              </div>
              
              {doctors.length === 0 ? (
                  <p className="text-slate-600 text-sm mt-2 text-center flex-1 flex flex-col justify-center italic">No active authorizations.</p>
              ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[140px] pr-2">
                      {doctors.map(doc => (
                        <div key={doc.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center group">
                            <div className="flex-1">
                               <p className="text-sm font-semibold text-slate-800">Dr. {doc.name}</p>
                               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{doc.specialization || 'Clinical Specialist'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setBookingDoctor(doc)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1"
                                >
                                    <Calendar size={12} /> Book
                                </button>
                                <button 
                                  onClick={() => handleRevokeAccess(doc.id)}
                                  disabled={revokingId === doc.id}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors active:scale-90 disabled:opacity-50"
                                  title="Revoke Access"
                                >
                                  {revokingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                                </button>
                            </div>
                        </div>
                     ))}
                  </div>
              )}
          </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Clock size={20} /></div>
                  <h3 className="text-xl font-bold text-slate-800">My Appointments</h3>
              </div>
          </div>

          {appointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <Calendar className="mx-auto text-slate-200 mb-2" size={48} />
                  <p className="text-slate-400 font-medium italic">No appointments scheduled yet.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointments.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)).map(appt => (
                      <div key={appt.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                          {appt.status === 'BOOKED' && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />}
                          
                          <div className="flex items-center justify-between mb-4 relative z-10">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${appt.status === 'BOOKED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {appt.status}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {appt.consultationType === 'ONLINE' ? <Video size={12} className="text-blue-500" /> : <MapPin size={12} className="text-emerald-500" />}
                                  {appt.consultationType}
                              </span>
                          </div>

                          <div className="space-y-3 relative z-10">
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">With Physician</p>
                                  <p className="text-md font-bold text-slate-800">Dr. {appt.doctor?.name}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1"><Calendar size={14} className="text-blue-500" /> {appt.appointmentDate}</p>
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1"><Clock size={14} className="text-blue-500" /> {appt.timeSlot}</p>
                                  </div>
                              </div>
                              
                              {appt.consultationType === 'OFFLINE' && appt.doctor?.clinicAddress && (
                                  <div className="pt-2 border-t border-slate-50">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                                      <p className="text-[11px] text-slate-600 italic line-clamp-1">{appt.doctor.clinicAddress}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
          <BookingModal 
             doctor={bookingDoctor} 
             onClose={() => setBookingDoctor(null)} 
             onBookingSuccess={fetchAppointments} 
          />
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300 border border-slate-100">
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <QrCode size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">Your Emergency ID</h3>
                 <p className="text-sm text-slate-500 mt-1 mb-6">Scan this QR to view critical medical data instantly.</p>

                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-block mb-6">
                    <QRCode 
                        id="dashboard-qr-svg"
                        value={emergencyUrl}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#991b1b"
                        level="H"
                    />
                 </div>

                 <div className="flex gap-3">
                    <button 
                        onClick={handleDownloadQR}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition shadow-lg active:scale-95"
                    >
                        <Download size={18} /> Download
                    </button>
                    <button 
                        onClick={() => setShowQRModal(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition active:scale-95"
                    >
                        Close
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
