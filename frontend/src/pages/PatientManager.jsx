import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  ArrowLeft, User, Activity, FileText, PlusCircle, Calendar,
  Download, Loader2, Phone, MapPin, Heart, Droplet, ShieldCheck,
  Mail, Users, AlertCircle, ChevronDown, ChevronUp,
  Briefcase, Zap, Info, Scissors, Pill, Stethoscope, History,
  RefreshCw, CheckCircle2, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import ClinicalAlertBanner from '../components/ClinicalAlertBanner';
import PrescriptionForm from '../components/PrescriptionForm';
import ReportPreviewModal from '../components/ReportPreviewModal';
import MedicalTimeline from '../components/MedicalTimeline';
import StructuredAiReport from '../components/StructuredAiReport';
import AiSummaryModal from '../components/AiSummaryModal';

// ── Reusable row for info display ──────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, color = 'text-primary-500' }) => (
  value ? (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-slate-100 last:border-0">
      <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}: </span>
        <span className="text-sm font-semibold text-slate-800">{value}</span>
      </div>
    </div>
  ) : null
);

// ── Patient Info Card ──────────────────────────────────────────────────────
const PatientInfoCard = ({ patient }) => {
  const [expanded, setExpanded] = useState(true);
  const initials = (patient?.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';
  const photoUrl = patient?.id ? `${api.defaults.baseURL}/auth/patient/photo/${patient.id}` : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Card Header / Summary Bar */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 p-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-extrabold shrink-0 border-2 border-white/30 backdrop-blur-sm overflow-hidden">
            <img 
              src={photoUrl} 
              alt={patient.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center w-full h-full">
              {initials}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold">{patient?.name || 'Authorized Subject'}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.gender && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">{patient.gender}</span>
              )}
              {patient.age && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">{patient.age} yrs</span>
              )}
              {patient.bloodGroup && (
                <span className="bg-red-400/30 border border-red-300/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Droplet size={11} /> {patient.bloodGroup}
                </span>
              )}
              {patient.dateOfBirth && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Calendar size={11} /> DOB: {patient.dateOfBirth}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-white/20 hover:bg-white/30 transition rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1 shrink-0"
          >
            {expanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Details</>}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">

          {/* Contact Information */}
          <div className="p-5">
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              <Phone size={13} className="text-primary-500" /> Contact
            </h4>
            <InfoRow icon={Mail} label="Email" value={patient.email} color="text-blue-500" />
            <InfoRow icon={Phone} label="Mobile" value={patient.phone} color="text-green-500" />
            <InfoRow icon={Phone} label="Alternate" value={patient.alternatePhone} color="text-green-400" />
            <InfoRow icon={MapPin} label="City" value={patient.city} color="text-orange-500" />
            <InfoRow icon={MapPin} label="State" value={patient.state} color="text-orange-500" />
            <InfoRow icon={MapPin} label="PIN Code" value={patient.pinCode} color="text-orange-400" />
            {patient.street && (
              <InfoRow icon={MapPin} label="Street" value={patient.street} color="text-orange-300" />
            )}
          </div>

          {/* Medical Info */}
          <div className="p-5">
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              <ShieldCheck size={13} className="text-primary-500" /> Medical Info
            </h4>
            <InfoRow icon={Droplet} label="Blood Group" value={patient.bloodGroup} color="text-red-500" />
            <InfoRow icon={Calendar} label="Date of Birth" value={patient.dateOfBirth} color="text-blue-500" />
            <InfoRow icon={User} label="Age" value={patient.age ? `${patient.age} years` : null} color="text-blue-400" />
            <InfoRow icon={Users} label="Gender" value={patient.gender} color="text-purple-500" />
            {patient.medicalInfo && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Medical Alerts
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">{patient.medicalInfo}</p>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="p-5">
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              <Heart size={13} className="text-red-500" /> Emergency Contact
            </h4>
            <InfoRow icon={User} label="Name" value={patient.emergencyContactName} color="text-red-500" />
            <InfoRow icon={Users} label="Relation" value={patient.emergencyContactRelationship} color="text-pink-500" />
            <InfoRow icon={Phone} label="Phone" value={patient.emergencyContactPhone} color="text-red-400" />

            {/* Insurance Info */}
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 mt-6 pt-4 border-t border-slate-50">
              <ShieldCheck size={13} className="text-blue-500" /> Insurance ⚠️
            </h4>
            <InfoRow icon={Briefcase} label="Provider" value={patient.insuranceProvider} color="text-blue-600" />
            <InfoRow icon={Info} label="Policy #" value={patient.policyNumber} color="text-blue-500" />
            <InfoRow icon={Calendar} label="Validity" value={patient.insuranceValidity} color="text-blue-400" />
          </div>

        </div>
      )}

      {/* Advanced Clinical Details Row */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-t border-slate-100 bg-slate-50/30">
          
          <div className="p-5">
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              <Zap size={13} className="text-orange-500" /> Lifestyle & Habits ⚠️
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <InfoRow icon={Activity} label="Smoking" value={patient.smokingStatus} color="text-orange-600" />
              <InfoRow icon={Zap} label="Alcohol" value={patient.alcoholStatus} color="text-emerald-600" />
              <InfoRow icon={Activity} label="Exercise" value={patient.exerciseFrequency} color="text-blue-600" />
              <InfoRow icon={Heart} label="Organ Donor" value={patient.organDonorStatus} color="text-red-500" />
            </div>
          </div>

          <div className="p-5">
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              <Info size={13} className="text-purple-500" /> Advanced Health ⚠️
            </h4>
            <div className="space-y-3">
              {patient.familyMedicalHistory && (
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Family Medical History</p>
                   <p className="text-xs text-slate-700 leading-relaxed font-medium">{patient.familyMedicalHistory}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Allergies</p>
                   <p className="text-xs text-red-600 font-bold">{patient.allergies || 'None'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Surgeries</p>
                   <p className="text-xs text-purple-600 font-bold">{patient.pastSurgeries || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {expanded && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Clinical Integrity: High</span>
            <span>Patient ID: #{patient.id}</span>
        </div>
      )}
    </div>
  );
};

// ── Main PatientManager Page ──────────────────────────────────────────────
const PatientManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncLabel, setSyncLabel] = useState('Just Now');
  const [revealedAiReports, setRevealedAiReports] = useState({});

  // Relative time formatter
  const getRelativeTime = (date) => {
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just Now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncLabel(getRelativeTime(lastSyncTime));
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newPrescription, setNewPrescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [reanalyzingId, setReanalyzingId] = useState(null);
  const [savingNotesId, setSavingNotesId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({}); // { reportId: text }

  const [recordsLoading, setRecordsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [reportError, setReportError] = useState('');

  const [previewData, setPreviewData] = useState({
    isOpen: false,
    url: null,
    name: '',
    type: '',
    id: null
  });

  const [isPrescriptionMinimized, setIsPrescriptionMinimized] = useState(false);

  const [summaryModal, setSummaryModal] = useState({
    isOpen: false,
    jsonData: null,
    legacyReasoning: null
  });

  useEffect(() => { fetchPatientDetails(); }, [id]);

  const fetchPatientDetails = async () => {
    if (!id) return;
    setLoading(true);
    setRecordError('');
    setReportError('');

    try {
      const patientRes = await api.get(`doctor/patients/${id}`);
      setPatient(patientRes.data);
      setLoading(false); // Display patient card as soon as possible

      // Now fetch records, prescriptions and reports independently
      fetchRecords();
      fetchPrescriptions();
      fetchReports();
      setLastSyncTime(new Date());
      setSyncLabel('Just Now');
    } catch (err) {
      console.error('Error fetching patient profile', err);
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await api.get(`doctor/patients/${id}/records`);
      const data = Array.isArray(res.data) ? res.data : [];
      setRecords(data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
    } catch (err) {
      console.error('Error fetching records', err);
      setRecordError('Unable to load clinical records at this time.');
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get(`prescriptions/doctor/patients/${id}`);
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error('Error fetching prescriptions', err);
    }
  };

  // Merge records, prescriptions and reports for the chronological pulse
  const clinicalTimeline = [
    ...(records || []).map(r => ({ ...r, type: 'CONSULTATION', timestamp: r.date ? new Date(r.date) : new Date(0) })),
    ...(prescriptions || []).map(p => ({ ...p, type: 'PRESCRIPTION', timestamp: p.createdAt ? new Date(p.createdAt) : new Date(0) })),
    ...(reports || []).map(r => ({ ...r, type: 'REPORT', timestamp: r.documentDate ? new Date(r.documentDate) : (r.uploadDate ? new Date(r.uploadDate) : (r.createdAt ? new Date(r.createdAt) : new Date(0))) }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await api.get(`doctor/patients/${id}/reports`);
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = data.sort((a, b) => new Date(b.documentDate || b.uploadDate || 0) - new Date(a.documentDate || a.uploadDate || 0));
      setReports(sorted);
      
      // Initialize editing notes with existing ones
      const initialNotes = {};
      data.forEach(r => {
        initialNotes[r.id] = r.doctorNotes || '';
      });
      setEditingNotes(initialNotes);
    } catch (err) {
      console.error('Error fetching reports', err);
      setReportError('Unable to load patient reports at this time.');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`doctor/patients/${id}/records`, {
        diagnosis: newDiagnosis,
        prescription: newPrescription,
        date: new Date().toISOString().split('T')[0],
      });
      setNewDiagnosis(''); setNewPrescription(''); setShowAddForm(false);
      toast.success('Clinical record created.');
      await fetchPatientDetails();
    } catch (error) {
      toast.error('Failed to create record. Please try again.');
    } finally { setSubmitting(false); }
  };

  const toggleAiReveal = (reportId) => {
    setRevealedAiReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const handleDownload = async (reportId, fileName) => {
    setDownloadingId(reportId);
    try {
      const res = await api.get(`reports/download/${reportId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) {
      toast.error('Failed to download report.');
    } finally { setDownloadingId(null); }
  };

  const handleReanalyze = async (reportId) => {
    setReanalyzingId(reportId);
    try {
      const res = await api.post(`reports/${reportId}/reanalyze`);
      const updatedReport = res.data;
      setReports(reports.map(r => r.id === reportId ? updatedReport : r));
      toast.success('AI Re-analysis applied.');
    } catch (err) {
      toast.error('AI Re-analysis failed. Please verify your API keys.');
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleSaveNotes = async (reportId) => {
    setSavingNotesId(reportId);
    try {
      await api.post(`reports/${reportId}/notes`, { notes: editingNotes[reportId] });
      // Update local reports list with the new note
      setReports(reports.map(r => r.id === reportId ? { ...r, doctorNotes: editingNotes[reportId] } : r));
      toast.success('Clinical notes saved.');
    } catch (err) {
      toast.error('Failed to save clinical notes.');
    } finally {
      setSavingNotesId(null);
    }
  };

  const handlePreview = async (report) => {
    setDownloadingId(report.id);
    try {
      const res = await api.get(`reports/download/${report.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: report.fileType }));
      setPreviewData({
        isOpen: true,
        url,
        name: report.fileName,
        type: report.fileType,
        id: report.id
      });
    } catch (error) {
      console.error("Preview failed", error);
      toast.error("Failed to load clinical preview.");
    } finally {
      setDownloadingId(null);
    }
  };

  const closePreview = () => {
    if (previewData.url) window.URL.revokeObjectURL(previewData.url);
    setPreviewData({ ...previewData, isOpen: false, url: null, id: null });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin text-primary-500"><Activity size={48} /></div>
    </div>
  );

  if (!patient) return (
    <div className="text-center py-12 text-slate-500">Patient not found.</div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      {/* Premium Patient Central Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between items-start gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate('/doctor-dashboard/patients')}
            className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-4 group"
          >
            <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-primary-50">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Back to Directory</span>
          </button>
          <div className="flex items-center gap-4">
             <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
               <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Global Patient Identifier: {id}</p>
             </div>
             <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-left duration-700">
                <div className="relative">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">Security Node Sync</span>
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                      {syncLabel === 'Just Now' ? 'Connected' : `Synced ${syncLabel}`}
                   </span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={fetchPatientDetails}
            className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 transition-all font-bold text-sm shadow-sm active:scale-95 group"
           >
             <RefreshCw size={18} className={`text-slate-400 group-hover:rotate-180 transition-transform duration-700 ${recordsLoading ? 'animate-spin text-primary' : ''}`} />
             Sync Data
           </button>
           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl transition-all font-black text-sm shadow-xl active:scale-95 ${showAddForm ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
           >
             <PlusCircle size={18} />
             {showAddForm ? 'Cancel Session' : 'Record Session'}
           </button>
        </div>
      </div>

      {/* Critical Info Highlight */}
      <ClinicalAlertBanner patient={patient} />

      {/* ── Full Patient Information Card ── */}
      <PatientInfoCard patient={patient} />

      {/* E-Prescription System */}
      <div className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${isPrescriptionMinimized ? 'p-4' : 'p-8'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Pill size={20} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 leading-none">E-Prescription Terminal</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Authorized Subject ID: {id}</p>
             </div>
          </div>
          <button 
            onClick={() => setIsPrescriptionMinimized(!isPrescriptionMinimized)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            {isPrescriptionMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {!isPrescriptionMinimized && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <PrescriptionForm patient={patient} onComplete={() => {
               fetchRecords();
               // Optional: switch to records view
            }} />
          </div>
        )}
      </div>

      {/* Add General Clinical Note */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-primary-200 shadow-md p-6 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">New General Encounter</h3>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis</label>
              <input type="text" required placeholder="e.g. Acute Bronchitis"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                value={newDiagnosis} onChange={(e) => setNewDiagnosis(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Prescription / Treatment Plan</label>
              <textarea required rows="4" placeholder="Medication details, dosage, and instructions..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                value={newPrescription} onChange={(e) => setNewPrescription(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 active:scale-95">
                {submitting ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={20} className="text-primary-500" /> Clinical History Pulse
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {clinicalTimeline.length} Verified Events
          </span>
        </h3>
        {recordsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
        ) : recordError ? (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center text-red-600 font-medium">
                {recordError}
            </div>
        ) : clinicalTimeline.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium italic">
            No clinical history pulse recorded for this subject.
          </div>
        ) : (
          <div className="bg-slate-50/50 rounded-[3rem] p-8 border border-slate-100 shadow-inner">
             <MedicalTimeline 
              events={clinicalTimeline} 
              onPreviewReport={(rep) => handlePreview(rep)}
              onViewAiSummary={(ev) => setSummaryModal({
                isOpen: true,
                jsonData: ev.aiSummary || ev.diagnosis,
                legacyReasoning: ev.clinicalReasoning
              })}
             />
          </div>
        )}

      <AiSummaryModal 
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal({ ...summaryModal, isOpen: false })}
        jsonData={summaryModal.jsonData}
        legacyReasoning={summaryModal.legacyReasoning}
      />

      <ReportPreviewModal 
        isOpen={previewData.isOpen}
        onClose={closePreview}
        reportUrl={previewData.url}
        reportName={previewData.name}
        fileType={previewData.type}
        onDownload={() => handleDownload(previewData.id, previewData.name)}
      />
    </div>
  );
};

export default PatientManager;
