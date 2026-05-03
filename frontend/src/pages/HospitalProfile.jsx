import React, { useState, useEffect } from 'react';
import { Building2, Shield, CreditCard, Globe, MapPin, Phone, Mail, FileText, Camera, CheckCircle, AlertCircle, Save, Loader2, Activity, User } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const HospitalProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Deletion State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletionStep, setDeletionStep] = useState(1); // 1: Request, 2: Verify
    const [deletionOtp, setDeletionOtp] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');

    const [formData, setFormData] = useState({
        hospitalName: '',
        hospitalType: '',
        licenseCode: '',
        website: '',
        phone: '',
        contactEmail: '',
        state: '',
        city: '',
        pinCode: '',
        street: '',
        // Legal & Compliance
        gstNumber: '',
        panNumber: '',
        nabhId: '',
        isoId: '',
        // Infrastructure
        totalBeds: '',
        icuBeds: '',
        operationTheatersCount: '',
        ambulanceCount: '',
        nurseCount: '',
        generalStaffCount: '',
        emergencyServicesAvailable: true,
        // Financial
        insuranceProviders: '',
        billingContactEmail: '',
        billingContactPhone: '',
        // Online Presence
        googleMapsUrl: '',
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        // Admin Profile
        adminName: '',
        position: '',
        // Financial Settlements
        razorpayKeyId: '',
        razorpayKeySecret: '',
        upiId: '',
        preferredPaymentMode: 'RAZORPAY'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hospital/profile');
            const adminData = res.data;
            const h = adminData.hospital;
            
            setProfile(adminData);
            setFormData({
                hospitalName: h.name || '',
                hospitalType: h.hospitalType || '',
                licenseCode: h.licenseCode || '',
                website: h.website || '',
                phone: h.phone || '',
                contactEmail: h.contactEmail || '',
                state: h.state || '',
                city: h.city || '',
                pinCode: h.pinCode || '',
                street: h.street || '',
                gstNumber: h.gstNumber || '',
                panNumber: h.panNumber || '',
                nabhId: h.nabhId || '',
                isoId: h.isoId || '',
                totalBeds: h.totalBeds || '',
                icuBeds: h.icuBeds || '',
                operationTheatersCount: h.operationTheatersCount || '',
                ambulanceCount: h.ambulanceCount || '',
                nurseCount: h.nurseCount || '',
                generalStaffCount: h.generalStaffCount || '',
                emergencyServicesAvailable: h.emergencyServicesAvailable !== false,
                insuranceProviders: h.insuranceProviders || '',
                billingContactEmail: h.billingContactEmail || '',
                billingContactPhone: h.billingContactPhone || '',
                googleMapsUrl: h.googleMapsUrl || '',
                facebookUrl: h.facebookUrl || '',
                twitterUrl: h.twitterUrl || '',
                instagramUrl: h.instagramUrl || '',
                adminName: adminData.name || '',
                position: adminData.position || '',
                razorpayKeyId: h.razorpayKeyId || '',
                razorpayKeySecret: h.razorpayKeySecret || '',
                upiId: h.upiId || '',
                preferredPaymentMode: h.preferredPaymentMode || 'RAZORPAY'
            });
            if (h.logoUrl) setLogoPreview(h.logoUrl);
        } catch (err) {
            toast.error("Failed to load institutional profile");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('data', JSON.stringify(formData));
            if (logo) {
                data.append('logo', logo);
            }

            await api.post('/hospital/update-profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Institutional profile synchronized successfully");
            fetchProfile();
        } catch (err) {
            toast.error(err.response?.data?.message || "Sync failed");
        } finally {
            setSaving(false);
        }
    };

    const handleRequestDeletion = async () => {
        try {
            await api.post('/auth/request-deletion-otp', { email: profile?.email });
            toast.success("Security code sent to your administrative email");
            setDeletionStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to initiate deletion");
        }
    };

    const handleConfirmDeletion = async () => {
        if (!deletionOtp) return toast.error("Please enter the verification code");
        setIsDeleting(true);
        try {
            await api.post('/auth/confirm-account-deletion', { 
                email: profile?.email, 
                otp: deletionOtp 
            });
            toast.success("Account permanently removed. Redirecting...");
            setTimeout(() => {
                logout();
                navigate('/');
            }, 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Verification failed");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Institutional Node...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
            <div className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        Inst. <span className="not-italic text-primary">Profile</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2 ml-1">
                        Institutional Sovereignty & Compliance Registry
                    </p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Synchronizing...' : 'Save Configuration'}
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[2.5rem] border border-slate-200/60 backdrop-blur-md mb-12 w-fit">
                {[
                    { id: 'identity', label: 'Identity', icon: Building2 },
                    { id: 'compliance', label: 'Compliance', icon: Shield },
                    { id: 'operations', label: 'Operations', icon: Activity },
                    { id: 'environment', label: 'Environment', icon: Globe },
                    { id: 'settlements', label: 'Settlements', icon: CreditCard },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-primary shadow-xl shadow-primary/5 border border-slate-200' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Identity & Logo */}
                <div className="lg:col-span-1 space-y-8 text-left">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                        <div className="relative inline-block mb-6 group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Hospital Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="text-slate-200" size={48} />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all">
                                <Camera size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                            </label>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{formData.hospitalName || 'Institutional Node'}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry ID: {formData.licenseCode || 'PENDING'}</p>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -mr-16 -mt-16 rounded-full blur-2xl" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <Shield className="text-primary" size={20} />
                                <h4 className="text-white text-xs font-black uppercase tracking-widest italic">Admin <span className="not-italic text-primary">Dossier</span></h4>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Administrative Lead</label>
                                <input 
                                    type="text" 
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                                    className="w-full bg-white/5 border-none rounded-xl text-white text-xs font-bold px-4 py-3 focus:ring-1 ring-primary/50"
                                    placeholder="Lead Administrator Name"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Official Designation</label>
                                <input 
                                    type="text" 
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    className="w-full bg-white/5 border-none rounded-xl text-white text-xs font-bold px-4 py-3 focus:ring-1 ring-primary/50"
                                    placeholder="e.g. Medical Director"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Configuration */}
                <div className="lg:col-span-2 space-y-8 text-left">
                    {activeTab === 'identity' && (
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Basic <span className="not-italic text-blue-600">Identification</span></h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital Name</label>
                                    <input 
                                        type="text" required
                                        value={formData.hospitalName}
                                        onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital Type</label>
                                    <select 
                                        value={formData.hospitalType}
                                        onChange={(e) => setFormData({...formData, hospitalType: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-100 appearance-none"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Private">Private</option>
                                        <option value="Government">Government</option>
                                        <option value="Trust">Trust</option>
                                        <option value="Charitable">Charitable</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Code</label>
                                    <input 
                                        type="text" required
                                        value={formData.licenseCode}
                                        onChange={(e) => setFormData({...formData, licenseCode: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-100 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Website</label>
                                    <input 
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-blue-100"
                                        placeholder="https://hospital.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'compliance' && (
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Legal & <span className="not-italic text-amber-600">Compliance</span></h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number (India)</label>
                                    <input 
                                        type="text"
                                        value={formData.gstNumber}
                                        onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-amber-100 font-mono"
                                        placeholder="27AAAAA0000A1Z5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Number</label>
                                    <input 
                                        type="text"
                                        value={formData.panNumber}
                                        onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-amber-100 font-mono"
                                        placeholder="ABCDE1234F"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NABH ID</label>
                                    <input 
                                        type="text"
                                        value={formData.nabhId}
                                        onChange={(e) => setFormData({...formData, nabhId: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-amber-100"
                                        placeholder="NABH-2024-XXXX"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ISO Certification ID</label>
                                    <input 
                                        type="text"
                                        value={formData.isoId}
                                        onChange={(e) => setFormData({...formData, isoId: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-amber-100"
                                        placeholder="ISO 9001:2015"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'operations' && (
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Activity size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Medical <span className="not-italic text-emerald-600">Infrastructure</span></h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Beds</label>
                                    <input 
                                        type="number"
                                        value={formData.totalBeds}
                                        onChange={(e) => setFormData({...formData, totalBeds: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-emerald-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ICU Beds</label>
                                    <input 
                                        type="number"
                                        value={formData.icuBeds}
                                        onChange={(e) => setFormData({...formData, icuBeds: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-emerald-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OT Count</label>
                                    <input 
                                        type="number"
                                        value={formData.operationTheatersCount}
                                        onChange={(e) => setFormData({...formData, operationTheatersCount: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-emerald-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ambulances</label>
                                    <input 
                                        type="number"
                                        value={formData.ambulanceCount}
                                        onChange={(e) => setFormData({...formData, ambulanceCount: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-emerald-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nurse Count</label>
                                    <input 
                                        type="number"
                                        value={formData.nurseCount}
                                        onChange={(e) => setFormData({...formData, nurseCount: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-emerald-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">General Staff</label>
                                    <input 
                                        type="number"
                                        value={formData.generalStaffCount}
                                        onChange={(e) => setFormData({...formData, generalStaffCount: e.target.value})}
                                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-emerald-100"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <AlertCircle className="text-emerald-600" size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">24/7 Emergency Services Active</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, emergencyServicesAvailable: !prev.emergencyServicesAvailable}))}
                                    className={`w-12 h-6 rounded-full relative transition-all ${formData.emergencyServicesAvailable ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.emergencyServicesAvailable ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'environment' && (
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Globe size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Environmental <span className="not-italic text-indigo-600">Presence</span></h3>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                        <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                                        <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / Region</label>
                                        <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                                        <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Street Address</label>
                                    <input type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Maps URL</label>
                                        <input type="url" value={formData.googleMapsUrl} onChange={(e) => setFormData({...formData, googleMapsUrl: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Insurance Providers</label>
                                        <input type="text" value={formData.insuranceProviders} onChange={(e) => setFormData({...formData, insuranceProviders: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-indigo-100" placeholder="Star, HDFC, etc." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settlements' && (
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                                    <CreditCard size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Financial <span className="not-italic text-primary">Settlements</span></h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razorpay Key ID</label>
                                    <input type="text" value={formData.razorpayKeyId} onChange={(e) => setFormData({...formData, razorpayKeyId: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razorpay Secret</label>
                                    <input type="password" value={formData.razorpayKeySecret} onChange={(e) => setFormData({...formData, razorpayKeySecret: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional UPI ID</label>
                                    <input type="text" value={formData.upiId} onChange={(e) => setFormData({...formData, upiId: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 font-mono" />
                                </div>
                            </div>
                            <div className="mt-8">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-4">Preferred Payout Channel</label>
                                <div className="flex gap-4">
                                    {['RAZORPAY', 'UPI', 'BOTH'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setFormData({...formData, preferredPaymentMode: mode})}
                                            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                formData.preferredPaymentMode === mode
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-16 pt-12 border-t border-slate-100">
                <div className="bg-red-50 rounded-[3.5rem] p-10 border border-red-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 -mr-32 -mt-32 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="text-left">
                            <h3 className="text-2xl font-black text-red-900 uppercase tracking-tight italic">Permanent <span className="not-italic">Deletion Zone</span></h3>
                            <p className="text-sm text-red-700/70 font-medium mt-2 max-w-xl">
                                Once initiated, your hospital profile, staff roster, clinical archives, and administrative access will be <span className="font-bold underline">permanently wiped</span> from the MediSync network. This action is irreversible.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="px-10 py-5 bg-red-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                        >
                            Initiate Permanent Deletion
                        </button>
                    </div>
                </div>
            </div>

            {/* Deletion Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden border border-red-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <AlertCircle size={40} />
                            </div>
                            
                            {deletionStep === 1 ? (
                                <>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic mb-4">Security <span className="not-italic text-red-600">Verification</span></h3>
                                    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                        To protect against unauthorized deletion, we must send a high-security verification code to: <br/>
                                        <span className="font-bold text-slate-900">{profile?.email}</span>
                                    </p>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setShowDeleteModal(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleRequestDeletion}
                                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                                        >
                                            Send Code
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic mb-4">Confirm <span className="not-italic text-red-600">Identity</span></h3>
                                    <p className="text-sm text-slate-500 font-medium mb-8">Enter the 6-digit verification code sent to your email.</p>
                                    
                                    <input 
                                        type="text"
                                        maxLength="6"
                                        value={deletionOtp}
                                        onChange={(e) => setDeletionOtp(e.target.value)}
                                        className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 bg-slate-50 border-none rounded-3xl mb-8 focus:ring-2 ring-red-100"
                                        placeholder="000000"
                                    />

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => { setDeletionStep(1); setShowDeleteModal(false); }}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Back
                                        </button>
                                        <button 
                                            onClick={handleConfirmDeletion}
                                            disabled={isDeleting}
                                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                                        >
                                            {isDeleting ? 'Wiping Node...' : 'Delete Permanently'}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={handleRequestDeletion}
                                        className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                                    >
                                        Resend Code
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
</div>
);
};

export default HospitalProfile;
