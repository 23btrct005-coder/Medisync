import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { Activity, ClipboardList, UserCheck, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ recordsCount: 0, latestDiagnosis: 'Loading...', doctor: 'Loading...' });
  const [doctorEmail, setDoctorEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardInfo = async () => {
      try {
        const res = await api.get('/records/my-records');
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
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/patient/requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error("Failed to fetch requests", e);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await api.post(`/patient/requests/${id}/accept`);
      alert("Access granted successfully!");
      fetchRequests(); // Refresh
    } catch(err) {
      alert("Failed to accept request.");
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.post(`/patient/requests/${id}/reject`);
      fetchRequests(); // Refresh
    } catch(err) {
      alert("Failed to reject request.");
    }
  };

  const handleLinkDoctor = async () => {
    if(!doctorEmail) return;
    setLinking(true);
    try {
      const res = await api.post('/patient/link-doctor', { doctorEmail });
      alert(res.data.message || 'Access successfully granted to ' + doctorEmail);
      setDoctorEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant access. Ensure the email is correct.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Patient'}!</h1>
            <p className="text-primary-100 max-w-xl">Your health dashboard is up to date. Check your latest medical records and reports below.</p>
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
                  <p className="text-slate-600 text-sm mt-2 text-center flex-1 flex flex-col justify-center">No pending requests from any doctors.</p>
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
      </div>
    </div>
  );
};

export default Dashboard;
