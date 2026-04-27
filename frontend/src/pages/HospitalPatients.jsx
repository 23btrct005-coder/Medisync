import React, { useState, useEffect } from 'react';
import { User, Search, Activity, ChevronRight, Mail, Phone, Calendar } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/hospital/patients');
                setPatients(res.data);
            } catch (err) {
                toast.error("Failed to synchronize institutional patient registry");
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Activity className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Institutional <span className="not-italic text-primary">Registry</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 ml-1">Unified patient record management</p>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by ID or name..."
                        className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 ring-primary/5 outline-none w-full md:w-[350px] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <div key={patient.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <User size={32} />
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    {patient.bloodGroup || 'O+'}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic mb-1">{patient.name}</h3>
                            <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-6">ID: {patient.patientId}</p>
                            
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Mail size={14} className="mr-3" /> {patient.email}
                                </div>
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Phone size={14} className="mr-3" /> {patient.phone}
                                </div>
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Calendar size={14} className="mr-3" /> {patient.dateOfBirth}
                                </div>
                            </div>
                            
                            <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                Access Dossier <ChevronRight size={16} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Institutional registry currently empty</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalPatients;
