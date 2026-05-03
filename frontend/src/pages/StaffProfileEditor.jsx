import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  User, Stethoscope, BadgeCheck, GraduationCap, Building2,
  Clock, Activity, Save, ArrowLeft, Mail, Phone, Calendar,
  CheckCircle, AlertCircle, Video, Briefcase, Camera, MapPin,
  Wallet, CreditCard, Shield, Lock, Trash2, Check
} from 'lucide-react';
import DropZone from '../components/DropZone';

const StaffProfileEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [doctor, setDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gender: 'Male',
        dateOfBirth: '',
        phone: '',
        alternatePhone: '',
        specialization: '',
        medicalDegree: '',
        medicalLicenseNumber: '',
        medicalCouncil: '',
        licenseExpiryDate: '',
        yearsOfExperience: '',
        college: '',
        additionalCertifications: '',
        subSpecialties: '',
        languagesSpoken: '',
        proceduresHandled: '',
        treatmentFocus: '',
        publications: '',
        employeeId: '',
        opdRoomNumber: '',
        contractType: 'PERMANENT',
        salary: '',
        canPrescribe: true,
        canEditPatientData: false,
        canAccessReports: true,
        canManageAppointments: true,
        appointmentsEnabled: true,
        onlineConsultation: true,
        onlineConsultationFee: '',
        offlineConsultationFee: '',
        workingDays: '',
        consultationTimings: '',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: '15',
        slotBuffer: '0',
        maxPatientsPerDay: '30',
        breakTimings: '13:00 - 14:00'
    });

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        if (!id || id === 'undefined') {
            toast.error("Institutional protocol error: Missing personnel identifier");
            navigate('/hospital-dashboard');
            return;
        }
        const fetchDoctor = async () => {
            try {
                const res = await api.get(`/hospital/doctor/${id}`);
                const d = res.data;
                setDoctor(d);
                
                const [start, end] = (d.consultationTimings || '09:00 - 17:00').split(' - ');
                
                setFormData({
                    ...d,
                    startTime: start || '09:00',
                    endTime: end || '17:00'
                });
            } catch (err) {
                toast.error("Failed to load personnel profile");
                navigate('/hospital-dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDayToggle = (day) => {
        const current = formData.workingDays?.split(', ').filter(d => d) || [];
        const next = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        setFormData(prev => ({ ...prev, workingDays: next.join(', ') }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                consultationTimings: `${formData.startTime} - ${formData.endTime}`
            };
            await api.post(`/hospital/update-doctor/${id}`, payload);
            toast.success("Personnel profile synchronized successfully");
            navigate('/hospital-dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || "Synchronization failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Activity className="animate-spin text-primary" size={48} />
        </div>
    );

    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";
    const inputClass = "w-full px-6 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold focus:ring-2 ring-primary/10 transition-all placeholder:text-slate-300 shadow-sm";
    const sectionClass = "bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8";

    return (
        <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/hospital-dashboard')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
                        <ArrowLeft size={20} className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Personnel <span className="not-italic text-primary">Command Center</span></h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Editing Profile: {doctor?.name} • {doctor?.employeeId}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="px-8 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                        Synchronize Profile
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12 pb-24">
                {/* Section 1: Professional Identity */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">1. Professional Identity</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <div className="w-32 h-32 rounded-3xl bg-white shadow-inner flex items-center justify-center overflow-hidden border border-slate-200">
                                {doctor?.profilePictureUrl ? (
                                    <img src={doctor.profilePictureUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-slate-200" />
                                )}
                            </div>
                            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Institutional ID Proof Active</p>
                        </div>
                        <div className="md:col-span-2 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className={labelClass}>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>Specialization</label><input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className={inputClass} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className={labelClass}>Medical Degree</label><input type="text" name="medicalDegree" value={formData.medicalDegree} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>License Number</label><input type="text" name="medicalLicenseNumber" value={formData.medicalLicenseNumber} onChange={handleChange} className={inputClass} /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Clinical Configuration */}
                <div className={`${sectionClass} border-primary/10 bg-primary/[0.02]`}>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">2. Clinical Configuration</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className={labelClass}>OPD Room Number</label><input type="text" name="opdRoomNumber" value={formData.opdRoomNumber} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>Employee ID</label><input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className={inputClass} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className={labelClass}>Online Fee (₹)</label><input type="number" name="onlineConsultationFee" value={formData.onlineConsultationFee} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>Offline Fee (₹)</label><input type="number" name="offlineConsultationFee" value={formData.offlineConsultationFee} onChange={handleChange} className={inputClass} /></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Appointments Enabled</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Control live slot booking</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="appointmentsEnabled"
                                        className="sr-only peer"
                                        checked={formData.appointmentsEnabled}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Online Consultation</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Enable video sessions</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="onlineConsultation"
                                        className="sr-only peer"
                                        checked={formData.onlineConsultation}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Scheduling */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">3. Shift & Availability</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <label className={labelClass}>Working Days</label>
                            <div className="flex flex-wrap gap-3">
                                {daysOfWeek.map(day => {
                                    const isActive = formData.workingDays?.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleDayToggle(day)}
                                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                isActive
                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25 scale-105'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div><label className={labelClass}>Shift Start</label><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Shift End</label><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Break Timings</label><input type="text" name="breakTimings" value={formData.breakTimings} onChange={handleChange} className={inputClass} placeholder="13:00 - 14:00" /></div>
                            <div><label className={labelClass}>Slot Duration (Min)</label><input type="number" name="slotDuration" value={formData.slotDuration} onChange={handleChange} className={inputClass} /></div>
                            <div>
                                <label className={labelClass}>Clinical Buffer (Gap)</label>
                                <select name="slotBuffer" value={formData.slotBuffer} onChange={handleChange} className={inputClass}>
                                    <option value="0">No Gap</option>
                                    <option value="5">5 Mins</option>
                                    <option value="10">10 Mins</option>
                                    <option value="15">15 Mins</option>
                                </select>
                            </div>
                            <div><label className={labelClass}>Max Patients/Day</label><input type="number" name="maxPatientsPerDay" value={formData.maxPatientsPerDay} onChange={handleChange} className={inputClass} /></div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Academic & Research */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">4. Academic & Research</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div><label className={labelClass}>Alma Mater / College</label><input type="text" name="college" value={formData.college} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Additional Certifications</label><textarea name="additionalCertifications" rows="3" value={formData.additionalCertifications} onChange={handleChange} className={`${inputClass} min-h-[120px] resize-none`} /></div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={labelClass}>Treatment Focus</label><input type="text" name="treatmentFocus" value={formData.treatmentFocus} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Scientific Publications</label><textarea name="publications" rows="3" value={formData.publications} onChange={handleChange} className={`${inputClass} min-h-[120px] resize-none`} /></div>
                        </div>
                    </div>
                </div>

                {/* Section 5: Permissions */}
                <div className={`${sectionClass} border-amber-100 bg-amber-50/30`}>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em]">5. Governance & Permissions</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { key: 'canPrescribe', label: 'Prescribe', icon: Activity },
                            { key: 'canEditPatientData', label: 'Edit Data', icon: User },
                            { key: 'canAccessReports', label: 'Reports', icon: Shield },
                            { key: 'canManageAppointments', label: 'Schedule', icon: Calendar },
                        ].map(perm => (
                            <label key={perm.key} className={`flex flex-col items-center gap-4 p-6 rounded-[2.5rem] cursor-pointer transition-all duration-300 border-2
                                ${formData[perm.key] 
                                    ? 'bg-white border-amber-200 shadow-sm' 
                                    : 'bg-slate-50/50 border-transparent opacity-60'}
                            `}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                                    ${formData[perm.key] ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}
                                `}>
                                    <perm.icon size={24} />
                                </div>
                                <input 
                                    type="checkbox"
                                    name={perm.key}
                                    className="hidden"
                                    checked={formData[perm.key]}
                                    onChange={handleChange}
                                />
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{perm.label}</span>
                                {formData[perm.key] && <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            </label>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default StaffProfileEditor;
