import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, UserPlus, Filter, Trash2, Edit3, 
  ChevronRight, Activity, X, Check, Save, Clock, 
  MapPin, Settings, AlertCircle
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import PremiumDropdown from '../components/PremiumDropdown';

const PREDEFINED_DOCTOR_SERVICES = [
    "General Consultation", "Specialist Consultation", "Emergency Care",
    "Home Visit", "Telemedicine", "Vaccination", "Diagnostic Review",
    "Minor Procedures", "Second Opinion", "Health Screening"
];

const PREDEFINED_INSTITUTIONAL_SERVICES = [
    "24/7 Emergency", "MRI Scan", "CT Scan", "X-Ray", "Blood Bank", 
    "ICU (Intensive Care Unit)", "NICU", "Dialysis", "Physiotherapy", 
    "Pathology Lab", "In-house Pharmacy", "Ambulance", "Operation Theater",
    "Telemedicine", "Vaccination Center", "Home Care Services"
];

const HospitalDoctorRoster = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [editData, setEditData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const fetchRoster = async () => {
        try {
            const res = await api.get('/hospital/doctors');
            setDoctors(res.data);
        } catch (err) {
            toast.error("Failed to load institutional roster");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, []);

    const handleDeleteDoctor = async (id) => {
        if (!id || id === 'undefined') {
            toast.error("Identification failure: Invalid physician ID");
            return;
        }
        if (!window.confirm("CRITICAL: Purging this record will permanently revoke institutional access. Continue?")) return;
        try {
            await api.delete(`/hospital/delete-doctor/${id}`);
            toast.success("Physician record purged successfully");
            setDoctors(doctors.filter(d => d.id !== id));
        } catch (err) {
            toast.error("Failed to purge physician record");
        }
    };

    const handleUpdateDoctor = async (e) => {
        if (e) e.preventDefault();
        if (!editingDoctor?.id) {
            toast.error("Synchronization target not identified");
            return;
        }
        setSubmitting(true);
        try {
            const workingDays = editData.workingDaysArray?.join(', ') || '';
            const payload = { 
                ...editData, 
                workingDays,
                consultationTimings: `${editData.startTime} - ${editData.endTime}`
            };
            await api.post(`/hospital/update-doctor/${editingDoctor.id}`, payload);
            toast.success("Physician profile synchronized");
            setEditingDoctor(null);
            fetchRoster();
        } catch (err) {
            toast.error("Synchronization failed");
        } finally {
            setSubmitting(false);
        }
    };

    const startEditing = (doctor) => {
        const days = doctor.workingDays ? doctor.workingDays.split(',').map(d => d.trim()) : [];
        setEditingDoctor(doctor);
        setEditData({
            ...doctor,
            workingDaysArray: days,
            startTime: doctor.consultationTimings?.split(' - ')[0] || '09:00',
            endTime: doctor.consultationTimings?.split(' - ')[1] || '17:00'
        });
    };

    const handleDayToggle = (day) => {
        const current = editData.workingDaysArray || [];
        const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
        setEditData({ ...editData, workingDaysArray: next });
    };

    const filteredDoctors = doctors
        .filter(d => {
            const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                d.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpecialty = specialtyFilter ? d.specialization === specialtyFilter : true;
            return matchesSearch && matchesSpecialty;
        })
        .sort((a, b) => {
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
            if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
            if (sortBy === 'specialty-asc') return (a.specialization || '').localeCompare(b.specialization || '');
            return 0;
        });

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1";
    const inputClass = "w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 ring-primary/5 transition-all outline-none";

    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <Activity className="animate-spin text-primary" size={32} />
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Staff<span className="not-italic text-primary">Roster</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Managing {doctors.length} Clinical Professionals</p>
                </div>
                <div className="flex-1">
                    <FilterBar 
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        placeholder="Filter clinical professionals by name, specialty, or license..."
                        sortValue={sortBy}
                        onSortChange={setSortBy}
                        sortOptions={[
                            { label: 'Name (A-Z)', value: 'name-asc' },
                            { label: 'Name (Z-A)', value: 'name-desc' },
                            { label: 'Specialty (A-Z)', value: 'specialty-asc' }
                        ]}
                        filters={[
                            {
                                key: 'specialization',
                                label: 'All Specialties',
                                value: specialtyFilter,
                                options: Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean))).map(s => ({ label: s, value: s }))
                            }
                        ]}
                        onFilterChange={(key, val) => setSpecialtyFilter(val)}
                    />
                </div>
                <button 
                    onClick={() => navigate('/hospital-dashboard/staff/onboard')}
                    className="px-8 py-5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mb-8"
                >
                    <UserPlus size={18} />
                    Onboard New Staff
                </button>
            </div>

            {/* Roster Table */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Physician Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Verification</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Data</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDoctors.map((doctor) => (
                                <tr key={doctor.id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/5 overflow-hidden border border-primary/10 flex items-center justify-center">
                                                {doctor.profilePictureUrl ? (
                                                    <img src={doctor.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Activity className="text-primary/30" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-slate-800 text-sm uppercase italic">{doctor.name}</p>
                                                    {doctor.user?.lastActive && (
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            new Date() - new Date(doctor.user.lastActive) < 300000 
                                                            ? 'bg-emerald-500 animate-pulse' 
                                                            : 'bg-slate-300'
                                                        }`} 
                                                        title={new Date() - new Date(doctor.user.lastActive) < 300000 ? 'Online' : `Last seen: ${new Date(doctor.user.lastActive).toLocaleString()}`}
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {doctor.specialization} 
                                                    {doctor.user?.lastActive && new Date() - new Date(doctor.user.lastActive) >= 300000 && (
                                                        <span className="ml-2 lowercase font-medium"> • last seen {Math.floor((new Date() - new Date(doctor.user.lastActive)) / 60000)}m ago</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-600 truncate max-w-[180px]">{doctor.email}</p>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                                Institutional Verified
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-600">{doctor.medicalDegree}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">License: {doctor.medicalLicenseNumber}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {doctor.approved ? (
                                            <span className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Authorized
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                                <AlertCircle size={12} /> Pending Approval
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => startEditing(doctor)}
                                                className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 rounded-xl transition-all hover:scale-110"
                                                title="Quick Config"
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDoctor(doctor.id)}
                                                className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all hover:scale-110"
                                                title="Purge Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Config Modal */}
            {editingDoctor && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">
                        <div className="p-10 bg-slate-900 text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 -mr-32 -mt-32 rounded-full blur-[80px]" />
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                        {editingDoctor.profilePictureUrl ? (
                                            <img src={editingDoctor.profilePictureUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users size={32} className="text-white/20" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Configure <span className="not-italic text-primary">{editingDoctor.name}</span></h3>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{editingDoctor.specialization} • {editingDoctor.employeeId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingDoctor(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateDoctor} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Clinical Configuration</h4>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Appointments</p>
                                            <p className="text-[8px] font-bold text-emerald-600/60 uppercase mt-0.5">{editData.appointmentsEnabled ? 'Accepting' : 'Paused'}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={editData.appointmentsEnabled !== false}
                                                onChange={(e) => setEditData({...editData, appointmentsEnabled: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label className={labelClass}>OPD Room Number</label>
                                        <input type="text" value={editData.opdRoomNumber || ''} onChange={(e) => setEditData({...editData, opdRoomNumber: e.target.value})} className={inputClass} placeholder="OPD-204" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Online Fee (₹)</label><input type="number" value={editData.onlineConsultationFee || ''} onChange={(e) => setEditData({...editData, onlineConsultationFee: e.target.value})} className={inputClass} /></div>
                                    <div><label className={labelClass}>Offline Fee (₹)</label><input type="number" value={editData.offlineConsultationFee || ''} onChange={(e) => setEditData({...editData, offlineConsultationFee: e.target.value})} className={inputClass} /></div>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelClass}>Shift Timing Slots</label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Starts</label><input type="time" value={editData.startTime} onChange={(e) => setEditData({...editData, startTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Ends</label><input type="time" value={editData.endTime} onChange={(e) => setEditData({...editData, endTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Break</label><input type="text" value={editData.breakTimings || ''} onChange={(e) => setEditData({...editData, breakTimings: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" placeholder="13:00 - 14:00" /></div>
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Slot (Min)</label><input type="number" value={editData.slotDuration || '15'} onChange={(e) => setEditData({...editData, slotDuration: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                                        <div>
                                            <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Buffer (Gap)</label>
                                            <select value={editData.slotBuffer || '0'} onChange={(e) => setEditData({...editData, slotBuffer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold">
                                                <option value="0">0m</option>
                                                <option value="5">5m</option>
                                                <option value="10">10m</option>
                                                <option value="15">15m</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelClass}>Working Days</label>
                                    <div className="flex flex-wrap gap-3">
                                        {daysOfWeek.map(day => {
                                            const isActive = editData.workingDaysArray?.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDayToggle(day)}
                                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                        isActive ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClass}>Clinical Services</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[...PREDEFINED_DOCTOR_SERVICES, ...PREDEFINED_INSTITUTIONAL_SERVICES].map(service => {
                                            const isSelected = editData.services?.split(', ').includes(service);
                                            return (
                                                <button
                                                    key={service}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = editData.services ? editData.services.split(', ').filter(s => s) : [];
                                                        const next = isSelected ? current.filter(s => s !== service) : [...current, service];
                                                        setEditData({ ...editData, services: next.join(', ') });
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                                                        isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}
                                                >
                                                    {service}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/30 shrink-0 flex items-center gap-4">
                            <button type="button" onClick={() => { setEditingDoctor(null); navigate(`/hospital-dashboard/staff/edit/${editingDoctor.id}`); }} className="flex-1 py-5 bg-white border border-slate-200 text-primary text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                                <Edit3 size={14} /> Edit Full Profile
                            </button>
                            <div className="flex-[2] flex gap-4">
                                <button type="button" onClick={() => setEditingDoctor(null)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all">Cancel</button>
                                <button onClick={handleUpdateDoctor} disabled={submitting} className="flex-[2] py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50">
                                    {submitting ? 'Syncing...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalDoctorRoster;
