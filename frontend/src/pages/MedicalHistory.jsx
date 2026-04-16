import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { 
  ClipboardList, Search, Calendar, Filter, 
  LayoutList, History, Loader2, Plus, Download, ChevronRight
} from 'lucide-react';
import MedicalTimeline from '../components/MedicalTimeline';

const MedicalHistory = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'list'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const res = await api.get('records/my-records');
                setRecords(res.data || []);
            } catch (err) {
                console.error("Failed to fetch medical records");
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []);

    const filteredRecords = records.filter(r => 
        r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-entry space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                        <History size={14} />
                        Clinical Archive
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Medical History</h1>
                    <p className="text-slate-500 font-medium max-w-lg">
                        Explore your verified clinical journey, diagnoses, and physician prescriptions in a secure timeline view.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                        <button 
                            onClick={() => setViewMode('timeline')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <History size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutList size={20} />
                        </button>
                    </div>
                    <button className="btn-premium bg-primary text-white">
                        <Plus size={18} />
                        Add Record
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by diagnosis, physician, or symptoms..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-premium pl-12"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none btn-premium bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="flex-1 md:flex-none btn-premium bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50">
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Content Display */}
            <div className="pt-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="text-primary animate-spin" size={48} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Decrypting Clinical Data...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-32 glass-panel border-dashed bg-slate-50/50">
                        <ClipboardList className="mx-auto text-slate-200 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-slate-800">No records found</h3>
                        <p className="text-slate-500 mt-2">Adjust your filters or add a new record to get started.</p>
                    </div>
                ) : viewMode === 'timeline' ? (
                    <MedicalTimeline records={filteredRecords} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRecords.map(record => (
                            <ListCard key={record.id} record={record} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- SUBCOMPONENTS --- */

const ListCard = ({ record }) => (
    <div className="glass-card p-6 group">
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                <ClipboardList size={24} />
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Visit</p>
                <p className="text-sm font-bold text-slate-700">{new Date(record.date).toLocaleDateString()}</p>
            </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate" title={record.diagnosis}>{record.diagnosis}</h3>
        
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[80px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Clinical Management</p>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed italic">"{record.prescription}"</p>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary/60" />
                    <span className="text-xs font-bold text-slate-500">{new Date(record.date).getFullYear()} Archive</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Dr. {record.doctorName}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </div>
    </div>
);

export default MedicalHistory;
