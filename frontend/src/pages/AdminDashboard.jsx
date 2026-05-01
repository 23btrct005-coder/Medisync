import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  UserCheck, AlertCircle, CheckCircle, XCircle, 
  Stethoscope, GraduationCap, Briefcase, Calendar,
  ShieldCheck, Loader2, Search, Filter, Info, Building2,
  MapPin, Mail, Phone, Globe, Award, FileText, X
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const location = useLocation();
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  const [activeTab, setActiveTab] = useState('pending_doctors'); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // AUTO-SYNC: Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // background fetch
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (activeTab === 'pending_doctors') {
        const response = await api.get('admin/doctors/pending');
        setPendingDoctors(response.data);
      } else if (activeTab === 'pending_hospitals') {
        const response = await api.get('admin/hospitals/pending');
        setPendingHospitals(response.data);
      } else if (activeTab === 'all_doctors') {
        const response = await api.get('admin/doctors/all');
        setAllDoctors(response.data);
      } else if (activeTab === 'all_hospitals') {
        const response = await api.get('admin/hospitals/all');
        setAllHospitals(response.data);
      }
    } catch (error) {
      console.error("Error fetching admin data", error);
      if (showLoading) setMessage({ type: 'error', text: 'Failed to synchronize clinical registry.' });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleAccess = async (userId, itemId) => {
    setActionLoading(itemId);
    try {
      const response = await api.post(`admin/users/${userId}/toggle`);
      toast.success(response.data.message);
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle user access.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id, type = 'doctors') => {
    setActionLoading(id);
    try {
      const endpoint = type === 'doctors' ? `admin/doctors/${id}/approve` : `admin/hospitals/${id}/approve`;
      await api.post(endpoint);
      toast.success(`${type === 'doctors' ? 'Doctor' : 'Hospital'} approved successfully!`);
      if (type === 'doctors') {
        setPendingDoctors(pendingDoctors.filter(d => d.id !== id));
      } else {
        setPendingHospitals(pendingHospitals.filter(h => h.id !== id));
      }
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to approve ${type === 'doctors' ? 'doctor' : 'hospital'}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const executeReject = async (id, type = 'doctors') => {
    setActionLoading(id);
    try {
      const endpoint = type === 'doctors' ? `admin/doctors/${id}/reject` : `admin/hospitals/${id}/reject`;
      await api.post(endpoint);
      toast.success('Application rejected.');
      if (type === 'doctors') {
        setPendingDoctors(pendingDoctors.filter(d => d.id !== id));
      } else {
        setPendingHospitals(pendingHospitals.filter(h => h.id !== id));
      }
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (id, email, type = 'doctors') => {
    const userInput = window.prompt(`CRITICAL: To permanently delete this ${type === 'doctors' ? 'doctor' : 'hospital'} and ALL associated medical records, please type their email address (${email}) to confirm:`);
    
    if (userInput === email) {
      setActionLoading(id);
      try {
        const endpoint = type === 'doctors' ? `admin/doctors/${id}/purge` : `admin/hospitals/${id}/purge`;
        await api.delete(endpoint);
        toast.success("Account purged permanently from the registry.");
        setSelectedItem(null);
        fetchData(false);
      } catch (error) {
        toast.error(error.response?.data?.message || "Purge failed. Insufficient administrative clearance.");
      } finally {
        setActionLoading(null);
      }
    } else if (userInput !== null) {
      toast.error("Email mismatch. Verification failed.");
    }
  };

  const handleReject = (id, type = 'doctors') => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-800 text-sm">Reject and permanently delete this {type === 'doctors' ? 'physician' : 'hospital'} application?</p>
        <div className="flex gap-2">
          <button onClick={() => { toast.dismiss(t.id); executeReject(id, type); }} className="bg-red-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest w-full shadow-lg shadow-red-500/20">Reject</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest w-full border border-slate-200">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const getFilteredData = () => {
    let data = [];
    if (activeTab === 'pending_doctors') data = pendingDoctors;
    else if (activeTab === 'pending_hospitals') data = pendingHospitals;
    else if (activeTab === 'all_doctors') data = allDoctors;
    else if (activeTab === 'all_hospitals') data = allHospitals;

    return data.filter(item => {
      const name = (item.name || item.hospital_name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const license = (item.medicalLicenseNumber || item.license_code || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search) || license.includes(search);
    });
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activeTab.includes('doctors') ? 'bg-primary-50 text-primary-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {activeTab.includes('doctors') ? <Stethoscope size={24} /> : <Building2 size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">
                    {activeTab.includes('doctors') ? selectedItem.name : selectedItem.hospital_name}
                  </h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">Verification Dossier</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {activeTab.includes('doctors') ? (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</p>
                      <p className="font-bold text-slate-900">{selectedItem.specialization}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Council</p>
                      <p className="font-bold text-slate-900">{selectedItem.medicalCouncil || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Number</p>
                      <p className="font-bold text-primary-600 font-mono">{selectedItem.medicalLicenseNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Expiry</p>
                      <p className="font-bold text-red-500 font-mono">{selectedItem.licenseExpiryDate || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                      <p className="font-bold text-slate-900">{selectedItem.yearsOfExperience} Years</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender / DOB</p>
                      <p className="font-bold text-slate-900">{selectedItem.gender} | {selectedItem.dateOfBirth}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID / OPD</p>
                      <p className="font-bold text-slate-900">{selectedItem.employeeId || "N/A"} | {selectedItem.opdRoomNumber || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Contract</p>
                      <p className="font-bold text-slate-900">{selectedItem.contractType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Salary</p>
                      <p className="font-bold text-emerald-600">₹{selectedItem.salary || "0"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Share</p>
                      <p className="font-bold text-emerald-600">{selectedItem.revenueSharePercentage || "0"}%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permissions Matrix</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'canPrescribe', label: 'Prescribe' },
                            { key: 'canEditPatientData', label: 'Edit Data' },
                            { key: 'canAccessReports', label: 'Reports' },
                            { key: 'canManageAppointments', label: 'Schedule' },
                        ].map(perm => (
                            <div key={perm.key} className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${selectedItem[perm.key] ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                {selectedItem[perm.key] ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                <span className="text-[10px] font-black uppercase tracking-tight">{perm.label}</span>
                            </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                          <Mail size={16} className="text-slate-400" /> {selectedItem.email}
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                          <Phone size={16} className="text-slate-400" /> {selectedItem.phone}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                      <Building2 size={16} className="text-slate-400" /> {selectedItem.hospital || "Independent / Other"}
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                      <GraduationCap size={16} className="text-slate-400" /> {selectedItem.college}
                    </div>
                    {selectedItem.additionalCertifications && (
                        <div className="flex items-center gap-3 text-slate-600 font-medium text-sm italic">
                          <Award size={16} className="text-primary-400" /> {selectedItem.additionalCertifications}
                        </div>
                    )}
                  </div>

                  <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest">UPI Payment ID</p>
                        <p className="font-mono text-sm font-bold text-primary-900">{selectedItem.upiId || "Not Provided"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest">Availability</p>
                        <p className="text-xs font-bold text-primary-900">{selectedItem.workingDays} | {selectedItem.consultationTimings}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Name</p>
                      <p className="font-bold text-slate-900">{selectedItem.admin_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</p>
                      <p className="font-bold text-slate-900">{selectedItem.position}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital License</p>
                      <p className="font-bold text-indigo-600 font-mono">{selectedItem.license_code}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                      <p className="font-bold text-slate-900">{selectedItem.city}, {selectedItem.state}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <div className="flex items-center gap-3 text-indigo-900 font-black text-xs uppercase tracking-widest mb-4">
                      <ShieldCheck size={16} /> Institutional Profile
                    </div>
                    <p className="text-sm text-indigo-900/70 font-medium leading-relaxed">
                      This facility has applied for full MediSync integration. 
                      Once verified, the Chief Administrator will be able to manage staff rosters 
                      and view regional health analytics for {selectedItem.hospital_name}.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              {activeTab.includes('pending') ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReject(selectedItem.id, activeTab.includes('doctors') ? 'doctors' : 'hospitals')}
                    className="flex-1 py-4 bg-white border border-slate-200 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all active:scale-95"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedItem.id, activeTab.includes('doctors') ? 'doctors' : 'hospitals')}
                    className={`flex-1 py-4 ${activeTab.includes('doctors') ? 'bg-primary-600 shadow-primary-600/20' : 'bg-indigo-600 shadow-indigo-600/20'} text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95`}
                  >
                    Confirm Verification
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleToggleAccess(selectedItem.user_id, selectedItem.id)}
                    className={`w-full py-4 ${selectedItem.enabled ? 'bg-red-600 shadow-red-600/20' : 'bg-emerald-600 shadow-emerald-600/20'} text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95`}
                  >
                    {selectedItem.enabled ? 'Revoke System Access' : 'Grant System Access'}
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(selectedItem.id, selectedItem.email, activeTab.includes('doctors') ? 'doctors' : 'hospitals')}
                    className="w-full py-3 bg-white border border-red-100 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <XCircle size={14} /> Permanently Purge Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <ShieldCheck size={14} /> System Governance
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Administrative Pool
          </h2>
          <p className="text-slate-500 font-medium mt-2">Real-time manual credential review and institutional verification</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl flex items-center px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Search registry..."
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <UserCheck size={24} />
                </div>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">Action Required</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{pendingDoctors.length}</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Pending Doctors</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <ShieldCheck size={24} />
                </div>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">Review Needed</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{pendingHospitals.length}</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Pending Institutions</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                <CheckCircle size={24} />
            </div>
            <p className="text-3xl font-black text-slate-900">High</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Security Score</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl w-fit mb-4 relative">
                <Loader2 size={24} className="animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
            </div>
            <p className="text-3xl font-black text-slate-900 italic uppercase">Sync</p>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Interval: 30s</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'pending_doctors', label: 'Pending Docs', count: pendingDoctors.length },
          { id: 'pending_hospitals', label: 'Pending Hubs', count: pendingHospitals.length },
          { id: 'all_doctors', label: 'All Registry', count: allDoctors.length },
          { id: 'all_hospitals', label: 'Institutions', count: allHospitals.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItem(null); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Pending List Table/Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-200 shadow-sm">
          <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Querying MediSync Registry...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Empty Dataset</h3>
            <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">No records found matching your current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary-100 transition-all duration-300 group flex flex-col xl:flex-row xl:items-center justify-between gap-8 cursor-pointer"
            >
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center border-4 border-slate-50 shadow-inner">
                    {activeTab.includes('doctors') ? (
                      <img 
                        src={item.profilePictureUrl || `${api.defaults.baseURL}/auth/doctor/photo/${item.id}?t=${Date.now()}`} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <Building2 size={36} className="text-indigo-400" />
                    )}
                    <div className="hidden items-center justify-center w-full h-full">
                        <Stethoscope size={32} className="text-slate-300" />
                    </div>
                </div>
                <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        {item.name || item.hospital_name}
                        {!item.approved && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-widest not-italic">Pending</span>}
                        {item.enabled === false && <span className="text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase tracking-widest not-italic">Suspended</span>}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                            {activeTab.includes('doctors') ? <GraduationCap size={16} className="text-primary-500" /> : <UserCheck size={16} className="text-indigo-500" />}
                            {item.specialization || `Admin: ${item.admin_name}`}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                            <ShieldCheck size={16} className="text-emerald-500" /> License: {item.medicalLicenseNumber || item.license_code}
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100" onClick={e => e.stopPropagation()}>
                {activeTab.includes('pending') ? (
                  <>
                    <button
                        onClick={() => handleReject(item.id, activeTab.includes('doctors') ? 'doctors' : 'hospitals')}
                        disabled={actionLoading === item.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-red-500 hover:bg-red-50 font-black text-sm rounded-2xl border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <XCircle size={18} /> Reject
                    </button>
                    <button
                        onClick={() => handleApprove(item.id, activeTab.includes('doctors') ? 'doctors' : 'hospitals')}
                        disabled={actionLoading === item.id}
                        className={`flex-2 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 ${activeTab.includes('doctors') ? 'bg-primary-600' : 'bg-indigo-600'} text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50`}
                    >
                        {actionLoading === item.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Verify
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleAccess(item.user_id, item.id)}
                    disabled={actionLoading === item.id}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 ${item.enabled ? 'bg-white text-red-600 border-red-100' : 'bg-emerald-600 text-white shadow-emerald-600/20'} font-black text-xs uppercase tracking-widest rounded-2xl border shadow-lg transition-all active:scale-95 disabled:opacity-50`}
                  >
                    {actionLoading === item.id ? <Loader2 size={18} className="animate-spin" /> : (item.enabled ? <XCircle size={18} /> : <CheckCircle size={18} />)}
                    {item.enabled ? 'Suspend Access' : 'Grant Access'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Tip & Danger Zone */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-primary-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
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

          <div className="bg-red-50 border border-red-100 rounded-[40px] p-10 flex flex-col justify-between">
              <div>
                  <h4 className="text-xl font-black text-red-900 mb-2">Danger Zone</h4>
                  <p className="text-red-600/70 text-sm font-medium leading-relaxed">
                      Permanently delete all physician, patient, and institutional profiles. This action is irreversible.
                  </p>
              </div>
              <button 
                onClick={() => {
                    if (window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE all data except your admin account. Are you absolutely sure?")) {
                        api.post('/admin/system/wipe')
                            .then(() => {
                                toast.success("System wiped successfully");
                                fetchData();
                            })
                            .catch(() => toast.error("Wipe failed"));
                    }
                }}
                className="mt-6 w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
              >
                  Reset Entire System
              </button>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
