import React, { useState } from 'react';
import { Plus, Trash2, FileText, Download, Save, Pill, Clock, Info, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';

const PrescriptionForm = ({ patient, onComplete }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('');
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' }
  ]);
  const [saving, setSaving] = useState(false);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' }]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const generatePDF = (prescriptionData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('MEDISYNC CLINICAL PRESCRIPTION', 105, 20, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 25, 190, 25);
    
    // Patient Info
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Patient: ${patient.name}`, 20, 35);
    doc.text(`ID: ${patient.id}`, 20, 42);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35);
    
    // Diagnosis
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Diagnosis', 20, 60);
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(diagnosis || 'General Consultation', 20, 67);
    
    // Medications Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 75, 170, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Medicine', 25, 81);
    doc.text('Dosage', 85, 81);
    doc.text('Frequency', 115, 81);
    doc.text('Duration', 160, 81);
    
    // Medications List
    let y = 90;
    doc.setFontSize(10);
    medications.forEach((med, i) => {
      doc.text(med.name || 'N/A', 25, y);
      doc.text(med.dosage || '-', 85, y);
      doc.text(med.frequency || '-', 115, y);
      doc.text(med.duration || '-', 160, y);
      
      if (med.instructions) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`* ${med.instructions}`, 25, y + 5);
        y += 15;
      } else {
        y += 10;
      }
    });
    
    // Footer / Notes
    if (notes) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Clinical Advice', 20, y + 10);
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(notes, 20, y + 17, { maxWidth: 170 });
    }
    
    if (followUpDays) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + parseInt(followUpDays));
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(`Suggested Follow-up: ${followUpDate.toLocaleDateString()}`, 20, 270);
    }
    
    doc.save(`Prescription_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSave = async () => {
    if (!diagnosis) {
      toast.error('Clinical diagnosis is required.');
      return;
    }
    setSaving(true);
    try {
      const followUpDate = followUpDays ? new Date(Date.now() + parseInt(followUpDays) * 86400000).toISOString().split('T')[0] : null;

      const payload = {
        diagnosis,
        clinicalNotes: notes,
        medications: JSON.stringify(medications),
        followUpDate
      };

      const res = await api.post(`/prescriptions/doctor/patients/${patient.id}`, payload);
      toast.success('Clinical prescription dispatched.');
      generatePDF(res.data);
      if (onComplete) onComplete(res.data);
    } catch (err) {
      toast.error('Failed to save prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

      <div className="glass-panel p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Primary Diagnosis</label>
            <input 
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Type 2 Diabetes, Acute Viral Infection..."
              className="input-premium py-4"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Follow-up Window</label>
            <select 
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              className="input-premium py-4"
            >
              <option value="">No Follow-up Necessary</option>
              <option value="3">In 3 Days</option>
              <option value="7">In 1 Week</option>
              <option value="14">In 2 Weeks</option>
              <option value="30">In 1 Month</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Pill size={14} className="text-primary" /> Medication Course
            </label>
            <button 
              onClick={addMedication}
              className="p-1.5 bg-slate-50 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div key={idx} className="flex flex-col lg:flex-row gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 items-start lg:items-center animate-in fade-in slide-in-from-right-4">
                <div className="flex-1 w-full space-y-1">
                   <input 
                    placeholder="Medicine Name"
                    value={med.name}
                    onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
                   />
                   <input 
                    placeholder="Instructions (e.g. Empty Stomach)"
                    value={med.instructions}
                    onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[10px] text-slate-500 font-medium italic"
                   />
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                   <input 
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                    className="w-24 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-slate-100"
                   />
                   <input 
                    placeholder="Freq"
                    value={med.frequency}
                    onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                    className="w-24 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-slate-100"
                   />
                   <input 
                    placeholder="Dur"
                    value={med.duration}
                    onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                    className="w-24 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-slate-100"
                   />
                   {medications.length > 1 && (
                     <button onClick={() => removeMedication(idx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors">
                       <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
            <Info size={14} /> Clinical Advice & Notes
          </label>
          <textarea 
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional instructions, lifestyle advice, or clinical warnings..."
            className="input-premium py-4 min-h-[100px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
           <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-premium bg-slate-900 text-white shadow-xl hover:shadow-primary/20 hover:-translate-y-1"
           >
             {saving ? 'Syncing...' : (
               <>
                 <Save size={18} />
                 Authorize & Issue
               </>
             )}
           </button>
           <button 
            onClick={() => generatePDF({ diagnosis, clinicalNotes: notes, medications: JSON.stringify(medications) })}
            className="btn-premium bg-slate-100 text-slate-600 hover:bg-slate-200"
           >
             <Download size={18} />
             Preview PDF
           </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionForm;
