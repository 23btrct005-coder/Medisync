import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileStack, Stethoscope, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patientEmail, setPatientEmail] = useState('');
  const [sending, setSending] = useState(false);

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
    </div>
  );
};

export default DoctorDashboard;
