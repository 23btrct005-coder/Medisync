import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { ArrowLeft, User, Activity, FileText, PlusCircle, Calendar, Download, Loader2 } from 'lucide-react';

const PatientManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newPrescription, setNewPrescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const [patientRes, recordsRes, reportsRes] = await Promise.all([
        api.get(`/doctor/patients/${id}`),
        api.get(`/doctor/patients/${id}/records`),
        api.get(`/doctor/patients/${id}/reports`)
      ]);
      setPatient(patientRes.data);
      setRecords(recordsRes.data.sort((a,b) => new Date(b.date) - new Date(a.date)));
      setReports(reportsRes.data.sort((a,b) => new Date(b.uploadDate) - new Date(a.uploadDate)));
    } catch (err) {
      console.error("Error fetching patient specific data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!newDiagnosis || !newPrescription) return;
    
    setSubmitting(true);
    try {
      await api.post(`/doctor/patients/${id}/records`, {
        diagnosis: newDiagnosis,
        prescription: newPrescription,
        date: new Date().toISOString().split('T')[0]
      });
      setNewDiagnosis('');
      setNewPrescription('');
      setShowAddForm(false);
      await fetchPatientDetails();
    } catch (error) {
      console.error("Failed to add medical record", error);
      alert("Failed to create record. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    setDownloadingId(reportId);
    try {
      const res = await api.get(`/reports/download/${reportId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download report. You might not have permission or the session expired.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
         <div className="animate-spin text-primary-500"><Activity size={48} /></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12 text-slate-500">Patient not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/doctor-dashboard/patients')}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
            <p className="text-slate-500 text-sm">Patient ID: #{patient.id} • {patient.age} yrs • {patient.bloodGroup}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <PlusCircle size={20} className="mr-2" />
          {showAddForm ? 'Cancel' : 'Add Record'}
        </button>
      </div>

      {/* Patient Alert/Summary */}
      {patient.medicalInfo && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
           <h4 className="text-sm font-semibold text-amber-800 mb-1">Medical Alerts & Conditions</h4>
           <p className="text-sm text-amber-700">{patient.medicalInfo}</p>
        </div>
      )}

      {/* Add Form Canvas */}
      {showAddForm && (
        <div className="card border-primary-200 shadow-md">
           <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">New Medical Encounter</h3>
           <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Acute Bronchitis"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prescription / Treatment Plan</label>
                  <textarea 
                    required
                    rows="4"
                    placeholder="Provide medication details, dosage, and instructions..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={newPrescription}
                    onChange={(e) => setNewPrescription(e.target.value)}
                  ></textarea>
              </div>
              <div className="flex justify-end pt-2">
                 <button 
                   type="submit" 
                   disabled={submitting}
                   className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                 >
                   {submitting ? 'Saving...' : 'Save Record Setup'}
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* Historical Records Timeline */}
      <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">Chronological History</h3>
      
      {records.length === 0 ? (
         <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p>No historical records exist for this patient.</p>
         </div>
      ) : (
         <div className="space-y-4">
            {records.map(record => (
               <div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                     <div>
                        <div className="flex items-center space-x-3 mb-2">
                           <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                              {record.diagnosis}
                           </span>
                           <span className="text-sm text-slate-500 flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {new Date(record.date).toLocaleDateString()}
                           </span>
                        </div>
                        <p className="text-slate-700 mt-3 whitespace-pre-line">{record.prescription}</p>
                     </div>
                     
                     <div className="md:text-right mt-4 md:mt-0 text-sm text-slate-500">
                        <p>Attending Provider:</p>
                        <p className="font-semibold text-slate-800 flex items-center md:justify-end mt-1">
                           <User size={14} className="mr-1 text-slate-400" />
                           {record.doctorName}
                        </p>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Patient Uploaded Reports & AI */}
      <h3 className="text-xl font-bold text-slate-800 mt-12 mb-4 flex items-center">
         <FileText className="mr-2 text-primary-500" /> Patient Medical Reports & AI Summaries
      </h3>

      {reports.length === 0 ? (
         <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p>No external reports have been uploaded by this patient.</p>
         </div>
      ) : (
         <div className="space-y-6">
            {reports.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                       <div>
                          <p className="font-semibold text-indigo-900">{r.fileName}</p>
                          <p className="text-sm text-indigo-700/70 mt-0.5">Uploaded: {new Date(r.uploadDate).toLocaleDateString()}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <button 
                             onClick={() => handleDownload(r.id, r.fileName)}
                             disabled={downloadingId === r.id}
                             className="flex items-center px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:bg-white/80 transition-colors disabled:opacity-50"
                             title="Download Original Document"
                          >
                             {downloadingId === r.id ? (
                                <Loader2 size={14} className="animate-spin" />
                             ) : (
                                <Download size={14} className="mr-1.5" />
                             )}
                             {downloadingId === r.id ? 'Loading...' : 'Download File'}
                          </button>
                          <span className="px-3 py-1 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider">
                             Analyzed
                          </span>
                       </div>
                    </div>
                   <div className="p-6 bg-white">
                      <h4 className="text-sm font-bold text-indigo-600 mb-3 flex items-center uppercase tracking-wider">
                         ✨ Groq AI Visualization
                      </h4>
                      <div className="prose prose-md max-w-none text-slate-700">
                         {r.aiSummary ? (
                             <pre className="font-sans whitespace-pre-wrap leading-relaxed">{r.aiSummary}</pre>
                         ) : (
                             <p className="italic text-slate-400">No AI visualization generated for this document.</p>
                         )}
                      </div>
                   </div>
                </div>
            ))}
         </div>
      )}

    </div>
  );
};

export default PatientManager;
