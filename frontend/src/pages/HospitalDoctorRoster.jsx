import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Search, ShieldAlert, ChevronRight, UserPlus, Filter, Calendar } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalDoctorRoster = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingDoctor, setEditingDoctor] = useState(null);
    const [editData, setEditData] = useState({});
    const [updating, setUpdating] = useState(false);

    const fetchRoster = async () => {
        try {
            const res = await api.get('/hospital/doctors');
            setDoctors(res.data);
        } catch (err) {
            toast.error("Failed to sync physician roster");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, []);

    const approveDoctor = async (id) => {
        try {
            await api.post(`/hospital/approve-doctor/${id}`);
            toast.success("Physician credentials verified and approved");
            setDoctors(prev => prev.map(d => d.id === id ? { ...d, approved: true } : d));
        } catch (err) {
            toast.error("Institutional approval failed");
        }
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const formatTime = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const parseTime12hTo24h = (time12h) => {
        if (!time12h) return '09:00';
        const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return '09:00';
        let [_, h, m, ampm] = match;
        h = parseInt(h);
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
    };

    const handleUpdateDoctor = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const workingDays = editData.workingDaysArray?.join(', ') || '';
            const consultationTimings = `${formatTime(editData.startTime)} - ${formatTime(editData.endTime)}`;
            
            const payload = {
                ...editData,
                workingDays,
                consultationTimings
            };

            await api.post(`/hospital/update-doctor/${editingDoctor.id}`, payload);
            toast.success("Physician profile updated successfully");
            setEditingDoctor(null);
            fetchRoster();
        } catch (err) {
            toast.error("Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    const startEditing = (doctor) => {
        const days = doctor.workingDays ? doctor.workingDays.split(',').map(d => d.trim()) : [];
        const times = doctor.consultationTimings ? doctor.consultationTimings.split('-').map(t => t.trim()) : [];
        
        setEditingDoctor(doctor);
        setEditData({
            ...doctor,
            workingDaysArray: days,
            startTime: times[0] ? parseTime12hTo24h(times[0]) : '09:00',
            endTime: times[1] ? parseTime12hTo24h(times[1]) : '17:00'
        });
    };

    const handleDayToggle = (day) => {
        setEditData(prev => ({
            ...prev,
            workingDaysArray: prev.workingDaysArray?.includes(day)
                ? prev.workingDaysArray.filter(d => d !== day)
                : [...(prev.workingDaysArray || []), day]
        }));
    };

    const filteredDoctors = (Array.isArray(doctors) ? doctors : []).filter(doc => {
        const name = doc?.name?.toLowerCase() || '';
        const specialty = doc?.specialization?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || specialty.includes(search);
    });

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Activity className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Staff <span className="not-italic text-primary">Roster</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 ml-1">Institutional physician management & verification</p>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter by name or specialty..."
                        className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 ring-primary/5 outline-none w-full md:w-[350px] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Physician Identity</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Verification</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Data</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDoctors.length > 0 ? (
                                filteredDoctors.map((doctor) => (
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
                                                    <p className="font-black text-slate-800 text-sm uppercase italic">{doctor.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doctor.specialization}</p>
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
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Registry Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!doctor.approved && (
                                                    <button 
                                                        onClick={() => approveDoctor(doctor.id)}
                                                        className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        Authorize
                                                    </button>
                                                )}
                                                <button 
                                                     onClick={() => startEditing(doctor)}
                                                     className="p-2.5 bg-slate-100 text-slate-500 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm"
                                                 >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <ShieldAlert size={48} className="text-slate-100" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No physicians matching your query</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
                        <div className="p-8 bg-slate-900 text-white rounded-t-[3rem]">
                            <h3 className="text-xl font-black uppercase tracking-tight italic">Update <span className="not-italic text-primary">Physician</span></h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Profile Editor</p>
                        </div>
                        <form onSubmit={handleUpdateDoctor} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                                    <input 
                                        type="text" required
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Specialization</label>
                                    <input 
                                        type="text" required
                                        value={editData.specialization}
                                        onChange={(e) => setEditData({...editData, specialization: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Medical Degree</label>
                                    <input 
                                        type="text" required
                                        value={editData.medicalDegree}
                                        onChange={(e) => setEditData({...editData, medicalDegree: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">License Number</label>
                                    <input 
                                        type="text" required
                                        value={editData.medicalLicenseNumber}
                                        onChange={(e) => setEditData({...editData, medicalLicenseNumber: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Years of Experience</label>
                                    <input 
                                        type="number" required
                                        value={editData.yearsOfExperience}
                                        onChange={(e) => setEditData({...editData, yearsOfExperience: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Age</label>
                                    <input 
                                        type="number" required
                                        value={editData.age}
                                        onChange={(e) => setEditData({...editData, age: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div className="col-span-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Working Days</label>
                                     <div className="flex flex-wrap gap-2">
                                         {daysOfWeek.map(day => (
                                             <button
                                                 key={day}
                                                 type="button"
                                                 onClick={() => handleDayToggle(day)}
                                                 className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                     editData.workingDaysArray?.includes(day)
                                                         ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                         : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                 }`}
                                             >
                                                 {day}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Shift Starts</label>
                                     <input 
                                         type="time" required
                                         value={editData.startTime}
                                         onChange={(e) => setEditData({...editData, startTime: e.target.value})}
                                         className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                     />
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Shift Ends</label>
                                     <input 
                                         type="time" required
                                         value={editData.endTime}
                                         onChange={(e) => setEditData({...editData, endTime: e.target.value})}
                                         className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                     />
                                 </div>
                                 <div className="col-span-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">UPI ID</label>
                                     <input 
                                         type="text"
                                         value={editData.upiId || ''}
                                         onChange={(e) => setEditData({...editData, upiId: e.target.value})}
                                         className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 font-mono"
                                         placeholder="doctor@upi"
                                     />
                                 </div>

                                {/* Administrative Section */}
                                <div className="col-span-2 pt-4 border-t border-slate-50">
                                                                         <div className="flex items-center justify-between mb-4">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Institutional Administrative Data</p>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => { setEditingDoctor(null); navigate('/hospital-dashboard/appointments'); }}
                                                className="text-[8px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                                            >
                                                <Calendar size={10} /> View Ledger
                                            </button>
                                            <a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer" className="text-[8px] text-primary hover:underline font-black uppercase tracking-widest">Razorpay Dash</a>
                                        </div>
                                     </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Staff ID</label>
                                    <input 
                                        type="text"
                                        value={editData.staffId || ''}
                                        onChange={(e) => setEditData({...editData, staffId: e.target.value})}
                                        className="w-full px-5 py-3 bg-blue-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-200"
                                        placeholder="EMP-XXXX"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Joining Date</label>
                                    <input 
                                        type="date"
                                        value={editData.joiningDate || ''}
                                        onChange={(e) => setEditData({...editData, joiningDate: e.target.value})}
                                        className="w-full px-5 py-3 bg-blue-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-200"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Salary / Payout</label>
                                    <input 
                                        type="text"
                                        value={editData.salary || ''}
                                        onChange={(e) => setEditData({...editData, salary: e.target.value})}
                                        className="w-full px-5 py-3 bg-blue-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-200"
                                        placeholder="e.g. 1,50,000"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Contract Type</label>
                                    <select 
                                        value={editData.contractType || ''}
                                        onChange={(e) => setEditData({...editData, contractType: e.target.value})}
                                        className="w-full px-5 py-3 bg-blue-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-200 appearance-none"
                                    >
                                        <option value="">Select Type...</option>
                                        <option value="PERMANENT">Permanent</option>
                                        <option value="VISITING">Visiting</option>
                                        <option value="INTERN">Intern</option>
                                        <option value="CONSULTANT">Consultant</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setEditingDoctor(null)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={updating}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalDoctorRoster;
