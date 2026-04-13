import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  ArrowLeft, User, Activity, FileText, PlusCircle, Calendar,
  Download, Loader2, Phone, MapPin, Heart, Droplet, ShieldCheck,
  Mail, Users, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

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
  const initials = patient.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Card Header / Summary Bar */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 p-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-extrabold shrink-0 backdrop-blur-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold">{patient.name}</h3>
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

            {/* Patient ID badge */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Patient ID</p>
              <p className="text-sm font-bold text-slate-700 font-mono">#{patient.id}</p>
            </div>
          </div>

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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newPrescription, setNewPrescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [reportError, setReportError] = useState('');

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

      // Now fetch records and reports independently
      fetchRecords();
      fetchReports();
    } catch (err) {
      console.error('Error fetching patient profile', err);
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await api.get(`doctor/patients/${id}/records`);
      setRecords(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Error fetching records', err);
      setRecordError('Unable to load clinical records at this time.');
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await api.get(`doctor/patients/${id}/reports`);
      setReports(res.data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)));
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
      await fetchPatientDetails();
    } catch (error) {
      alert('Failed to create record. Please try again.');
    } finally { setSubmitting(false); }
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
      alert('Failed to download report.');
    } finally { setDownloadingId(null); }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/doctor-dashboard/patients')}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
            <p className="text-slate-500 text-sm">Full patient overview & clinical records</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm active:scale-95">
          <PlusCircle size={18} />
          {showAddForm ? 'Cancel' : 'Add Record'}
        </button>
      </div>

      {/* ── Full Patient Information Card ── */}
      <PatientInfoCard patient={patient} />

      {/* Add Record Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-primary-200 shadow-md p-6 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">New Medical Encounter</h3>
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

      {/* ── Medical Records Timeline ── */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary-500" /> Clinical Records
        </h3>
        {recordsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
        ) : recordError ? (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center text-red-600 font-medium">
                {recordError}
            </div>
        ) : records.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <FileText size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="font-medium">No clinical records yet.</p>
            <p className="text-sm mt-1">Click "Add Record" to create the first entry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => (
              <div key={record.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-l-full" />
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">{record.diagnosis}</span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar size={14} /> {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-2 whitespace-pre-line leading-relaxed">{record.prescription}</p>
                  </div>
                  <div className="text-sm text-slate-400 md:text-right shrink-0">
                    <p className="text-xs uppercase tracking-wide">Attending</p>
                    <p className="font-semibold text-slate-700 flex items-center md:justify-end gap-1 mt-1">
                      <User size={13} /> {record.doctorName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Patient Reports & AI Summaries ── */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-indigo-500" /> Patient Reports & AI Analysis
        </h3>
        {reportsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : reportError ? (
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center text-indigo-600 font-medium">
                {reportError}
            </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <FileText size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="font-medium">No reports uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-indigo-900">{r.fileName}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Uploaded: {new Date(r.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => handleDownload(r.id, r.fileName)} disabled={downloadingId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition disabled:opacity-50">
                    {downloadingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {downloadingId === r.id ? 'Downloading...' : 'Download'}
                  </button>
                </div>
                <div className="p-6">
                  <h4 className="text-xs font-extrabold text-indigo-600 mb-3 uppercase tracking-widest flex items-center gap-1.5">
                    ✨ Groq AI Analysis
                  </h4>
                  {r.aiSummary
                    ? <pre className="font-sans whitespace-pre-wrap leading-relaxed text-slate-700 text-sm">{r.aiSummary}</pre>
                    : <p className="italic text-slate-400 text-sm">No AI analysis generated for this document.</p>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManager;
