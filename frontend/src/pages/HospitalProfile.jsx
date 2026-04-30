import React, { useState, useEffect } from 'react';
import {
  Building2, Mail, Phone, MapPin, Shield, Edit3, Save, X,
  Globe, Hash, Briefcase, CheckCircle, AlertCircle, Camera, Loader2, Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const HOSPITAL_TYPES = [
  'Government', 'Private', 'Trust / NGO', 'Charitable',
  'Multi-Specialty', 'Clinic / Polyclinic', 'Diagnostic Centre',
];
const POSITIONS = [
  'Chief Administrator', 'Medical Director', 'CEO / Director',
  'Department Head', 'IT Operations', 'HR Manager', 'Finance Head',
];

const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {Icon && <Icon size={11} />} {label}
    </label>
    {children}
  </div>
);

const ReadValue = ({ value, accent }) => (
  <div className={`px-4 py-3 rounded-xl text-sm font-semibold border ${
    accent
      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
      : 'bg-slate-50 border-slate-100 text-slate-700'
  }`}>
    {value || <span className="text-slate-300 italic font-normal">Not set</span>}
  </div>
);

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all';

export default function HospitalProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', msg }
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    hospitalName: '', hospitalType: '', licenseCode: '', website: '',
    phone: '', contactEmail: '', state: '', city: '', pinCode: '', street: '',
    adminName: '', position: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/hospital/profile');
        const data = res.data;
        setProfile(data);
        const h = data.hospital || {};
        setForm({
          hospitalName:  h.name          || '',
          hospitalType:  h.hospitalType  || '',
          licenseCode:   h.licenseCode   || '',
          website:       h.website       || '',
          phone:         h.phone         || '',
          contactEmail:  h.contactEmail  || '',
          state:         h.state         || '',
          city:          h.city          || '',
          pinCode:       h.pinCode       || '',
          street:        h.street        || '',
          adminName:     data.name       || '',
          position:      data.position   || '',
        });
      } catch (e) {
        console.error('Profile fetch failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice({ type: 'error', msg: "Geolocation is not supported by your browser" });
      return;
    }

    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.address;

          setForm(prev => ({
            ...prev,
            state: address.state || prev.state,
            city: address.city || address.town || address.village || address.district || prev.city,
            pinCode: address.postcode || prev.pinCode,
            street: data.display_name || prev.street,
          }));

          setNotice({ type: 'success', msg: "Location detected successfully!" });
          setTimeout(() => setNotice(null), 3000);
        } catch (err) {
          setNotice({ type: 'error', msg: "Failed to fetch address details" });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setNotice({ type: 'error', msg: "Unable to retrieve your location. Please ensure location access is granted." });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleLogo = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(form));
      if (logoFile) fd.append('logo', logoFile);
      await api.post('/hospital/update-profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh profile
      const res = await api.get('/hospital/profile');
      setProfile(res.data);
      setEditing(false);
      setLogoFile(null);
      setNotice({ type: 'success', msg: 'Institutional profile updated successfully.' });
    } catch (e) {
      setNotice({ type: 'error', msg: e.response?.data?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const hospital = profile?.hospital || {};
  const logoSrc = logoPreview || hospital.logoUrl || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">
            Institutional <span className="not-italic text-primary-600">Identity</span>
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">
            Administrative credentials &amp; facility profile
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => { setEditing(false); setLogoFile(null); setLogoPreview(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              <X size={15} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Notice */}
      {notice && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold border ${
          notice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notice.msg}
          <button onClick={() => setNotice(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT: Logo + Admin Card ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Logo */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 flex flex-col items-center text-center gap-5">
            <div className="relative">
              <div className="w-28 h-28 rounded-[2rem] bg-primary-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {logoSrc
                  ? <img src={logoSrc} alt="Hospital Logo" className="w-full h-full object-cover" />
                  : <Building2 size={52} className="text-primary-400" />
                }
              </div>
              {editing && (
                <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary-700 shadow-lg transition-all">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {form.hospitalName || hospital.name || 'Institution'}
              </h2>
              <span className="inline-block mt-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                {form.hospitalType || hospital.hospitalType || 'Healthcare'}
              </span>
            </div>

            <div className="w-full h-px bg-slate-100" />

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Mail size={15} /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Email</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{hospital.contactEmail || user?.username || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Shield size={15} /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">License Code</p>
                  <p className="text-xs font-bold text-slate-700">{hospital.licenseCode || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle size={15} /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <p className="text-xs font-black text-emerald-600 uppercase">Active · Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Edit Forms ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hospital Identity */}
          <Section title="Hospital Identity" icon={Building2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Hospital / Institution Name" icon={Building2}>
                  {editing
                    ? <input name="hospitalName" value={form.hospitalName} onChange={handleChange} className={inputCls} placeholder="e.g. Narayana Health City" />
                    : <ReadValue value={hospital.name} />}
                </Field>
              </div>
              <Field label="Hospital Type" icon={Briefcase}>
                {editing
                  ? <select name="hospitalType" value={form.hospitalType} onChange={handleChange} className={inputCls}>
                      <option value="">Select Type</option>
                      {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  : <ReadValue value={hospital.hospitalType} />}
              </Field>
              <Field label="License Code" icon={Hash}>
                {editing
                  ? <input name="licenseCode" value={form.licenseCode} onChange={handleChange} className={inputCls} placeholder="HL-XXXX-XXXX" />
                  : <ReadValue value={hospital.licenseCode} />}
              </Field>
              <div className="md:col-span-2">
                <Field label="Official Website" icon={Globe}>
                  {editing
                    ? <input name="website" value={form.website} onChange={handleChange} className={inputCls} placeholder="https://www.hospital.com" />
                    : <ReadValue value={hospital.website} />}
                </Field>
              </div>
            </div>
          </Section>

          {/* Location & Contact */}
          <Section 
            title="Location & Contact" 
            icon={MapPin}
            action={editing && (
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm"
              >
                <Navigation size={12} className={locating ? 'animate-pulse' : ''} />
                {locating ? 'Detecting...' : 'Use Current Location'}
              </button>
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Institutional Phone" icon={Phone}>
                {editing
                  ? <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="10-digit number" maxLength={10} />
                  : <ReadValue value={hospital.phone} />}
              </Field>
              <Field label="Contact Email" icon={Mail}>
                {editing
                  ? <input name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} className={inputCls} />
                  : <ReadValue value={hospital.contactEmail} />}
              </Field>
              <Field label="State">
                {editing
                  ? <input name="state" value={form.state} onChange={handleChange} className={inputCls} placeholder="e.g. Karnataka" />
                  : <ReadValue value={hospital.state} />}
              </Field>
              <Field label="City / District">
                {editing
                  ? <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="e.g. Bengaluru" />
                  : <ReadValue value={hospital.city} />}
              </Field>
              <Field label="PIN Code">
                {editing
                  ? <input name="pinCode" value={form.pinCode} onChange={handleChange} className={inputCls} placeholder="6-digit PIN" maxLength={6} />
                  : <ReadValue value={hospital.pinCode} />}
              </Field>
              <div className="md:col-span-2">
                <Field label="Street Address / Locality" icon={MapPin}>
                  {editing
                    ? <input name="street" value={form.street} onChange={handleChange} className={inputCls} placeholder="e.g. 258/A, Hosur Road" />
                    : <ReadValue value={hospital.street} />}
                </Field>
              </div>
            </div>
          </Section>

          {/* Administrator Identity */}
          <Section title="Administrator Identity" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Administrator Full Name">
                  {editing
                    ? <input name="adminName" value={form.adminName} onChange={handleChange} className={inputCls} placeholder="Your legal name" />
                    : <ReadValue value={profile?.name} />}
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Your Position" icon={Briefcase}>
                  {editing
                    ? <select name="position" value={form.position} onChange={handleChange} className={inputCls}>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    : <ReadValue value={profile?.position} accent />}
                </Field>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, action, children }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Icon size={20} />
          </div>
          <h3 className="text-base font-black uppercase tracking-tight">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
