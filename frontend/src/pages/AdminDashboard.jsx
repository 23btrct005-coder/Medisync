import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  UserCheck, AlertCircle, CheckCircle, XCircle, 
  Stethoscope, GraduationCap, Briefcase, Calendar,
  ShieldCheck, Loader2, Search, Filter, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('admin/doctors/pending');
      setPendingDoctors(response.data);
    } catch (error) {
      console.error("Error fetching pending doctors", error);
      setMessage({ type: 'error', text: 'Failed to load pending applications.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`admin/doctors/${id}/approve`);
      setMessage({ type: 'success', text: 'Doctor approved successfully!' });
      setPendingDoctors(pendingDoctors.filter(d => d.id !== id));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve doctor.' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const executeReject = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`admin/doctors/${id}/reject`);
      setMessage({ type: 'success', text: 'Application rejected and removed.' });
      setPendingDoctors(pendingDoctors.filter(d => d.id !== id));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject application.' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleReject = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-800">Reject and permanently delete this application?</p>
        <div className="flex gap-2">
          <button onClick={() => { toast.dismiss(t.id); executeReject(id); }} className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold w-full">Reject</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold w-full">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const filteredDoctors = pendingDoctors.filter(d => 
    (d.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (d.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (d.medicalLicenseNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <ShieldCheck size={14} /> System Governance
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Physician Verification Pool
          </h2>
          <p className="text-slate-500 font-medium mt-2">Manual credential review and platform inclusion management</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl flex items-center px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Search by name, email or license..."
                    className="border-none text-sm p-0 focus:ring-0 placeholder-slate-400 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Global Status Message */}
      {message.text && (
        <div className={`p-4 rounded-3xl flex items-center gap-3 animate-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
          <span className="font-bold text-sm tracking-tight">{message.text}</span>
        </div>
      )}

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <UserCheck size={24} />
                </div>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">Action Required</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{pendingDoctors.length}</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Pending Verification</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                <CheckCircle size={24} />
            </div>
            <p className="text-3xl font-black text-slate-900">High</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Confidence Score</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl w-fit mb-4">
                < ShieldCheck size={24} />
            </div>
            <p className="text-3xl font-black text-slate-900">100%</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Registry Secure</p>
        </div>
      </div>

      {/* Pending List Table/Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-200 shadow-sm">
          <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Querying Medical Registry...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero Pending Applications</h3>
            <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">All medical professionals have been reviewed and verified. Good job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary-100 transition-all duration-300 group flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center border-4 border-slate-50 shadow-inner">
                    <img 
                        src={doctor.profilePictureUrl || `${api.defaults.baseURL}/auth/doctor/photo/${doctor.id}?t=${Date.now()}`} 
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="hidden items-center justify-center w-full h-full">
                        <Stethoscope size={32} className="text-slate-300" />
                    </div>
                </div>
                <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {doctor.name}
                        <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-widest">Unverified</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                            <GraduationCap size={16} className="text-primary-500" /> {doctor.specialization} ({doctor.medicalDegree})
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                            <ShieldCheck size={16} className="text-emerald-500" /> License: {doctor.medicalLicenseNumber}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                            <Briefcase size={16} className="text-indigo-500" /> {doctor.yearsOfExperience} yrs experience
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <span className="px-3 py-1.5 bg-slate-50 rounded-2xl text-[11px] font-black font-mono text-slate-400 border border-slate-100">
                            UID: #{doctor.id}
                        </span>
                        <span className="px-3 py-1.5 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-500 border border-slate-100">
                            {doctor.email}
                        </span>
                        <span className="px-3 py-1.5 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-500 border border-slate-100">
                            {doctor.hospital || "Independent Practitioner"}
                        </span>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <button
                    onClick={() => handleReject(doctor.id)}
                    disabled={actionLoading === doctor.id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-red-500 hover:bg-red-50 font-black text-sm rounded-2xl border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                    <XCircle size={18} />
                    Reject
                </button>
                <button
                    onClick={() => handleApprove(doctor.id)}
                    disabled={actionLoading === doctor.id}
                    className="flex-2 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 text-white hover:bg-primary-700 font-black text-sm rounded-2xl shadow-xl shadow-primary-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {actionLoading === doctor.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Approve Credentials
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Tip */}
      <div className="bg-primary-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl shrink-0">
                  <Info size={32} className="text-primary-300" />
              </div>
              <div>
                  <h4 className="text-2xl font-black tracking-tight mb-2">Platform Integrity Protocol</h4>
                  <p className="text-primary-100/70 font-medium max-w-2xl leading-relaxed">
                      Verification of medical licenses ensures the safety of all patients on the platform. 
                      Once you approve a doctor, they gain full access to patient linkage and clinical record analysis tools.
                  </p>
              </div>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 translate-x-1/2 -translate-y-1/2">
              <ShieldCheck size={300} />
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
