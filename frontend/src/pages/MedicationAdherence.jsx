import React, { useState, useEffect } from 'react';
import { Pill, Clock, Calendar, CheckCircle2, AlertCircle, Plus, Info, Zap, Activity } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const MedicationAdherence = () => {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);

    const mockMeds = [
        { id: 1, medicineName: 'Metformin', dosage: '500mg', frequency: 'Twice daily', time: '08:00 AM', taken: true },
        { id: 2, medicineName: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', time: '10:00 PM', taken: false },
        { id: 3, medicineName: 'Vitamin D3', dosage: '2000IU', frequency: 'Once daily', time: '09:00 AM', taken: true },
    ];

    useEffect(() => {
        const fetchMeds = async () => {
            try {
                const res = await api.get('/patient/medications');
                setMedications(res.data?.length > 0 ? res.data : mockMeds);
            } catch (err) {
                setMedications(mockMeds);
            } finally {
                setLoading(false);
            }
        };
        fetchMeds();
    }, []);

    const toggleMed = (id) => {
        setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
        toast.success("Adherence updated successfully");
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        Smart <span className="not-italic text-primary">Adherence</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Automatic medication synchronization hub</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 hover:bg-slate-800 transition-all">
                    <Plus size={16} /> Log Manual Intake
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Clock className="text-primary" size={24} />
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Today's Schedule</h2>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        </div>

                        <div className="space-y-4">
                            {medications.map((med) => (
                                <div 
                                    key={med.id} 
                                    onClick={() => toggleMed(med.id)}
                                    className={`group flex items-center gap-6 p-6 rounded-3xl border transition-all cursor-pointer ${
                                        med.taken 
                                            ? 'bg-emerald-50/50 border-emerald-100 scale-[0.98] opacity-80' 
                                            : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                                        med.taken ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                    }`}>
                                        {med.taken ? <CheckCircle2 size={28} /> : <Pill size={28} />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`text-lg font-black tracking-tight leading-none uppercase ${med.taken ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                {med.medicineName || med.name}
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.dosage}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock size={12} /> {med.time || 'Schedule'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar size={12} /> {med.frequency}
                                            </span>
                                        </div>
                                    </div>

                                    {!med.taken && (
                                        <div className="hidden group-hover:flex items-center gap-2 text-primary">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Log Intake</span>
                                            <Zap size={14} className="animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Activity size={120} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-1 leading-none uppercase tracking-tight italic">Score: <span className="not-italic">94%</span></h3>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-6">Expert Adherence Level</p>
                            
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-6">
                                <div className="bg-white h-full w-[94%]" />
                            </div>

                            <p className="text-xs font-medium leading-relaxed opacity-80 mb-2 font-bold uppercase tracking-tight">Your consistency is within the clinical optimal range.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                <AlertCircle size={18} />
                             </div>
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Critical Note</h4>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight mb-6">
                            If you miss a dose by more than 4 hours, do not double the next dose. Consult your physician immediately via the medical brief node.
                        </p>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sync with Apple Health</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicationAdherence;
