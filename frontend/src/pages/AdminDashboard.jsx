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
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'registry'
  const [subTab, setSubTab] = useState('doctors'); // 'doctors' or 'hospitals'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    // Derive viewMode from URL
    const mode = location.pathname.includes('registry') ? 'registry' : 'pending';
    setViewMode(mode);
    fetchData();
  }, [location.pathname, subTab]);

  // AUTO-SYNC: Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // background fetch
    }, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, subTab]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (viewMode === 'pending') {
        if (subTab === 'doctors') {
          const response = await api.get('admin/doctors/pending');
          setPendingDoctors(response.data);
        } else {
          const response = await api.get('admin/hospitals/pending');
          setPendingHospitals(response.data);
        }
      } else {
        if (subTab === 'doctors') {
          const response = await api.get('admin/doctors/all');
          setAllDoctors(response.data);
        } else {
          const response = await api.get('admin/hospitals/all');
          setAllHospitals(response.data);
        }
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
        const endpoint = type === 'doctors' ? `/admin/doctors/${id}/purge` : `/admin/hospitals/${id}/purge`;
        await api.post(endpoint);
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
    if (viewMode === 'pending') {
      data = subTab === 'doctors' ? pendingDoctors : pendingHospitals;
    } else {
      data = subTab === 'doctors' ? allDoctors.filter(d => d.approved) : allHospitals.filter(h => h.approved);
    }

    return data.filter(item => {
      const name = (item.name || item.hospital_name || item.hospitalName || "").toLowerCase();
      const email = (item.email || item.contactEmail || item.contact_email || "").toLowerCase();
      const license = (item.medicalLicenseNumber || item.license_code || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search) || license.includes(search);
    });
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-8 right-8 text-white hover:text-primary-400 transition-colors">
            <X size={40} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${subTab === 'doctors' ? 'bg-primary-50 text-primary-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {subTab === 'doctors' ? <Stethoscope size={24} /> : <Building2 size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">
                    {subTab === 'doctors' ? selectedItem.name : selectedItem.hospital_name}
                  </h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">Verification Dossier</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {subTab === 'doctors' ? (
                <>
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] overflow-hidden border-4 border-white shadow-lg shrink-0">
                      <img 
                        src={selectedItem.profilePictureUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200"} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setPreviewImage(selectedItem.profilePictureUrl)}
                      />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedItem.name}</h4>
                      <p className="text-xs font-bold text-primary-600 mt-1 uppercase tracking-widest">{selectedItem.specialization} | {selectedItem.medicalDegree}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[9px] font-black uppercase rounded-full border border-primary-100">
                          {selectedItem.contractType || "PERMANENT"}
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full border border-emerald-100">
                          Exp: {selectedItem.yearsOfExperience}y
                        </span>
                      </div>
                    </div>
                  </div>

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
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-red-500 font-mono">{selectedItem.licenseExpiryDate || "N/A"}</p>
                        {selectedItem.licenseDocumentUrl && (
                            <button onClick={() => setPreviewImage(selectedItem.licenseDocumentUrl)} className="text-primary-600 hover:text-primary-700 transition-transform hover:scale-110">
                                <FileText size={16} />
                            </button>
                        )}
                      </div>
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

                  {(selectedItem.hospital && selectedItem.hospital !== "Independent / Other") && (
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
                  )}

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

                  {selectedItem.licenseDocumentUrl && (
                    <div className="pt-2">
                        <button 
                          onClick={() => setPreviewImage(selectedItem.licenseDocumentUrl)}
                          className="flex items-center justify-center gap-2 w-full py-4 bg-primary-50 text-primary-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-primary-100 hover:bg-primary-100 transition-all shadow-sm"
                        >
                          <ShieldCheck size={16} /> Preview Verified Medical License
                        </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Location & Contact</p>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedItem.clinicStreet || selectedItem.clinicAddress}, ${selectedItem.clinicCity}, ${selectedItem.clinicState} ${selectedItem.clinicPinCode}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                            <Globe size={12} /> View on Google Maps
                        </a>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4 group cursor-pointer" 
                         onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedItem.clinicStreet || selectedItem.clinicAddress}, ${selectedItem.clinicCity}, ${selectedItem.clinicState} ${selectedItem.clinicPinCode}`)}`, '_blank')}>
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                            <MapPin size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{selectedItem.clinicStreet || selectedItem.clinicAddress || "Independent Practice"}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                {selectedItem.clinicCity || "N/A"}, {selectedItem.clinicState || "N/A"} {selectedItem.clinicPinCode || ""}
                            </p>
                        </div>
                    </div>
                  </div>

                  {(selectedItem.subSpecialties || selectedItem.proceduresHandled || selectedItem.publications) && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Expertise & Research</p>
                        <div className="grid grid-cols-1 gap-3">
                            {selectedItem.subSpecialties && (
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Sub-Specialties</p>
                                    <p className="text-xs font-medium text-slate-900 leading-relaxed">{selectedItem.subSpecialties}</p>
                                </div>
                            )}
                            {selectedItem.proceduresHandled && (
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Procedures & Surgical Expertise</p>
                                    <p className="text-xs font-medium text-slate-900 leading-relaxed">{selectedItem.proceduresHandled}</p>
                                </div>
                            )}
                            {selectedItem.publications && (
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Medical Research & Publications</p>
                                    <p className="text-xs font-medium text-slate-900 leading-relaxed italic">{selectedItem.publications}</p>
                                </div>
                            )}
                        </div>
                    </div>
                  )}

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
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] overflow-hidden border-4 border-white shadow-lg shrink-0">
                      <img 
                        src={selectedItem.logo_url || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200"} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setPreviewImage(selectedItem.logo_url)}
                      />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedItem.hospital_name}</h4>
                      <p className="text-xs font-bold text-primary-600 mt-1 uppercase tracking-widest">{selectedItem.hospital_type} | {selectedItem.ownership_type}</p>
                      {selectedItem.website && (
                        <a href={selectedItem.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-2 hover:text-primary-500 transition-colors">
                          <Globe size={12} /> {selectedItem.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator Credentials</p>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden shadow-sm shrink-0">
                          <img 
                            src={selectedItem.profile_picture_url || "https://images.unsplash.com/photo-1559839734-2b71f1536783?w=100"} 
                            className="w-full h-full object-cover cursor-pointer" 
                            onClick={() => setPreviewImage(selectedItem.profile_picture_url)}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{selectedItem.admin_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{selectedItem.position}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 ml-1">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <Mail size={16} className="text-slate-300" /> {selectedItem.contact_email}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <Phone size={16} className="text-slate-300" /> {selectedItem.phone}
                        </div>
                        {selectedItem.admin_phone && (
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <Info size={16} className="text-slate-300" /> {selectedItem.admin_phone} (Direct)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Logistics</p>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital License</p>
                        <p className="font-bold text-indigo-600 font-mono text-sm">{selectedItem.license_code}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Registry</p>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{selectedItem.street}</p>
                        <p className="text-xs text-slate-500 font-medium">{selectedItem.city}, {selectedItem.state} {selectedItem.pin_code}</p>
                      </div>
                      {selectedItem.google_maps_url && (
                        <a href={selectedItem.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all">
                          <MapPin size={12} /> View Location Matrix
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity & Infrastructure</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Beds</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">{selectedItem.total_beds || "N/A"}</p>
                      </div>
                      {[
                        { label: 'ICU', value: selectedItem.icu_available },
                        { label: 'Ambulance', value: selectedItem.ambulance_available },
                        { label: 'Emergency', value: selectedItem.emergency_services_available },
                      ].map(service => (
                        <div key={service.label} className={`p-4 rounded-3xl border text-center ${service.value ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1">{service.label}</p>
                          <p className="text-xs font-black uppercase">{service.value ? "Active" : "None"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal & Compliance Documentation</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Government IDs</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">GST Number</span>
                            <span className="text-slate-900 font-mono font-bold">{selectedItem.gst_number || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">PAN Number</span>
                            <span className="text-slate-900 font-mono font-bold">{selectedItem.pan_number || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 bg-primary-50/30 rounded-3xl border border-primary-100/50">
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-2">Registration Authority</p>
                        <p className="text-xs font-bold text-slate-900 leading-tight">{selectedItem.registration_authority || "Local Medical Council"}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Date: {selectedItem.registration_date || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'License Cert', url: selectedItem.registration_certificate_url, icon: ShieldCheck },
                        { label: 'NABH Cert', url: selectedItem.nabh_certificate_url, icon: Award },
                        { label: 'Tax Proof', url: selectedItem.tax_certificate_url, icon: FileText },
                        { label: 'Addr Proof', url: selectedItem.address_proof_url, icon: MapPin },
                        { label: 'Admin ID', url: selectedItem.id_proof_url, icon: UserCheck },
                      ].map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => doc.url && setPreviewImage(doc.url)}
                          disabled={!doc.url}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${doc.url ? 'bg-white border-slate-200 hover:border-primary-500 hover:shadow-lg group' : 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'}`}
                        >
                          <doc.icon size={20} className={doc.url ? 'text-primary-500 group-hover:scale-110 transition-transform' : 'text-slate-300'} />
                          <span className="text-[9px] font-black uppercase tracking-tight text-slate-600">{doc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50/50 rounded-[40px] border border-indigo-100 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 text-indigo-900 font-black text-xs uppercase tracking-[0.2em] mb-4">
                        <ShieldCheck size={16} /> Global Verification Note
                      </div>
                      <p className="text-sm text-indigo-900/70 font-medium leading-relaxed">
                        Full MediSync integration pending manual document review. Once verified, {selectedItem.admin_name} will gain chief administrative control over the {selectedItem.hospital_name} node.
                      </p>
                    </div>
                    <Building2 size={120} className="absolute -bottom-10 -right-10 text-indigo-500/10 -rotate-12" />
                  </div>
                </>
              )}
            </div>            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              {viewMode === 'pending' ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReject(selectedItem.id, subTab === 'doctors' ? 'doctors' : 'hospitals')}
                    className="flex-1 py-4 bg-white border border-slate-200 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all active:scale-95"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedItem.id, subTab === 'doctors' ? 'doctors' : 'hospitals')}
                    className={`flex-1 py-4 ${subTab === 'doctors' ? 'bg-primary-600 shadow-primary-600/20' : 'bg-indigo-600 shadow-indigo-600/20'} text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95`}
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
 
                  {/* Edit Access ONLY for non-institutional doctors */}
                  {subTab === 'doctors' && (!selectedItem.hospital || selectedItem.hospital === "Independent / Other") && (
                    <button
                        onClick={() => toast.error("Live Editing Module is currently in read-only audit mode.")}
                        className="w-full py-4 bg-primary-50 text-primary-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-primary-100 hover:bg-primary-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <FileText size={16} /> Edit Professional Profile
                    </button>
                  )}
                  <button
                    onClick={() => handlePermanentDelete(selectedItem.id, selectedItem.email || selectedItem.contactEmail || selectedItem.contact_email, subTab === 'doctors' ? 'doctors' : 'hospitals')}
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

      {/* Secondary Entity Switcher (Doctors vs. Hospitals) */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'doctors', label: 'Physicians', icon: Stethoscope },
          { id: 'hospitals', label: 'Institutions', icon: Building2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setSubTab(tab.id); setSelectedItem(null); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              subTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
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
                    {subTab === 'doctors' ? (
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
                            {subTab === 'doctors' ? <GraduationCap size={16} className="text-primary-500" /> : <UserCheck size={16} className="text-indigo-500" />}
                            {item.specialization || `Admin: ${item.admin_name}`}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                            <ShieldCheck size={16} className="text-emerald-500" /> License: {item.medicalLicenseNumber || item.license_code}
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100" onClick={e => e.stopPropagation()}>
                {viewMode === 'pending' ? (
                  <>
                    <button
                        onClick={() => handleReject(item.id, subTab === 'doctors' ? 'doctors' : 'hospitals')}
                        disabled={actionLoading === item.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-red-500 hover:bg-red-50 font-black text-sm rounded-2xl border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <XCircle size={18} /> Reject
                    </button>
                    <button
                        onClick={() => handleApprove(item.id, subTab === 'doctors' ? 'doctors' : 'hospitals')}
                        disabled={actionLoading === item.id}
                        className={`flex-2 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 ${subTab === 'doctors' ? 'bg-primary-600' : 'bg-indigo-600'} text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50`}
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
