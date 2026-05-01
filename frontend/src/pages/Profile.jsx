import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  UserCircle, Mail, Phone, MapPin, Droplet, Calendar,
  Activity, AlertCircle, Heart, ShieldCheck, Users,
  AlertTriangle, Pill, Stethoscope, Scissors, Download, QrCode,
  Edit3, Briefcase, Zap, Info, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';

const InfoRow = ({ icon: Icon, label, value, color = 'text-primary-500' }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className={`mt-0.5 shrink-0 ${color}`}><Icon size={18} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || <span className="text-slate-300 font-normal">Not provided</span>}</p>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
      <Icon size={18} className="text-primary-600" />
      <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
    </div>
    <div className="px-6 divide-y divide-slate-50">{children}</div>
  </div>
);

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteStep, setDeleteStep] = React.useState('request'); // request, confirm
  const [otp, setOtp] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRequestDeletion = async () => {
    setIsSubmitting(true);
    try {
      await api.post('auth/delete-account/request');
      setDeleteStep('confirm');
      toast.success("Security code sent to your registered email.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate deletion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!otp || otp.length !== 6) return toast.error("Please enter the 6-digit security code.");
    setIsSubmitting(true);
    try {
      await api.post('auth/delete-account/confirm', { otp });
      toast.success("Account permanently deleted.");
      setShowDeleteModal(false);
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || "Security verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-20">
      <div className="animate-spin text-primary-500"><Activity size={36} /></div>
    </div>
  );

  if (!user) return (
    <div className="text-center p-12 text-slate-400">
      <AlertCircle size={40} className="mx-auto mb-3" />
      <p>Could not load profile. Please log in again.</p>
    </div>
  );

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';
  const emergencyUrl = `${window.location.origin}/emergency/${user.id}`;
  const photoUrl = user.profilePictureUrl || `${api.defaults.baseURL}/auth/patient/photo/${user.id}?t=${Date.now()}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById('patient-qr-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); canvas.toBlob(blob => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `medisync-qr-${user.name?.replace(' ','_')}.png`; a.click();
    }); };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
          <p className="text-slate-500 text-sm mt-1">Your personal and medical information on MEDISYNC</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/profile/edit')}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl hover:bg-slate-50 transition shadow-sm active:scale-95"
        >
          <Edit3 size={18} className="text-primary-600" />
          Edit My Health Profile
        </button>
      </div>

      {/* Identity Card */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex overflow-hidden items-center justify-center backdrop-blur-sm shrink-0 border-2 border-white/30">
            <img 
              src={photoUrl} 
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center w-full h-full text-3xl font-extrabold uppercase bg-primary-600/50">
                {initials}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-extrabold">{user.name || 'Patient'}</h3>
            <p className="text-primary-200 text-sm mt-1">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              {user.bloodGroup && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Droplet size={12} /> {user.bloodGroup}
                </span>
              )}
              {user.gender && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{user.gender}</span>
              )}
              {user.age && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{user.age} yrs</span>
              )}
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{user.patientId || `MS-${String(user.id || '').padStart(4, '0')}`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal Details */}
        <Section title="Personal Details" icon={UserCircle}>
          <InfoRow icon={UserCircle} label="Full Name" value={user.name} />
          <InfoRow icon={Calendar} label="Date of Birth" value={user.dateOfBirth} color="text-blue-500" />
          <InfoRow icon={Calendar} label="Age" value={user.age ? `${user.age} Years` : null} color="text-blue-500" />
          <InfoRow icon={Users} label="Gender" value={user.gender} color="text-purple-500" />
          <InfoRow icon={Droplet} label="Blood Group" value={user.bloodGroup} color="text-red-500" />
        </Section>

        {/* Contact Information */}
        <Section title="Contact Information" icon={Phone}>
          <InfoRow icon={Mail} label="Email Address" value={user.email} color="text-blue-500" />
          <InfoRow icon={Phone} label="Mobile Number" value={user.phone} color="text-green-500" />
          <InfoRow icon={Phone} label="Alternate Mobile" value={user.alternatePhone} color="text-green-400" />
          <InfoRow icon={MapPin} label="Street / Area" value={user.street} color="text-orange-500" />
          <InfoRow icon={MapPin} label="City" value={user.city} color="text-orange-500" />
          <InfoRow icon={MapPin} label="State" value={user.state} color="text-orange-500" />
          <InfoRow icon={MapPin} label="PIN Code" value={user.pinCode} color="text-orange-500" />
        </Section>

        {/* Emergency Contact */}
        <Section title="Emergency Contact" icon={Heart}>
          <InfoRow icon={UserCircle} label="Contact Name" value={user.emergencyContactName} color="text-red-500" />
          <InfoRow icon={Users} label="Relationship" value={user.emergencyContactRelationship} color="text-pink-500" />
          <InfoRow icon={Phone} label="Phone Number" value={user.emergencyContactPhone} color="text-red-400" />
        </Section>

        {/* Critical Medical Sections */}
        <Section title="Known Allergies" icon={AlertTriangle}>
          <div className="py-3">
            <p className="text-sm text-slate-700 leading-relaxed bg-red-50 rounded-xl p-3 border border-red-100">
              {user.allergies || <span className="text-slate-300">None reported</span>}
            </p>
          </div>
        </Section>

        <Section title="Existing Medical Conditions" icon={Stethoscope}>
          <div className="py-3">
            <p className="text-sm text-slate-700 leading-relaxed bg-orange-50 rounded-xl p-3 border border-orange-100">
              {user.existingDiseases || <span className="text-slate-300">None reported</span>}
            </p>
          </div>
        </Section>

        <Section title="Current Medications" icon={Pill}>
          <div className="py-3">
            <p className="text-sm text-slate-700 leading-relaxed bg-blue-50 rounded-xl p-3 border border-blue-100">
              {user.currentMedications || <span className="text-slate-300">None reported</span>}
            </p>
          </div>
        </Section>

        <Section title="Past Major Surgeries" icon={Scissors}>
          <div className="py-3">
            <p className="text-sm text-slate-700 leading-relaxed bg-purple-50 rounded-xl p-3 border border-purple-100">
              {user.pastSurgeries || <span className="text-slate-300">None reported</span>}
            </p>
          </div>
        </Section>

        {/* ── NEW: Insurance Details ── */}
        <Section title="Insurance Information" icon={ShieldCheck}>
          <InfoRow icon={Briefcase} label="Provider" value={user.insuranceProvider} color="text-blue-600" />
          <InfoRow icon={Info} label="Policy Number" value={user.policyNumber} color="text-blue-500" />
          <InfoRow icon={Calendar} label="Validity" value={user.insuranceValidity} color="text-blue-400" />
        </Section>

        {/* ── NEW: Lifestyle & Habits ── */}
        <Section title="Lifestyle & Habits" icon={Zap}>
          <InfoRow icon={Activity} label="Smoking" value={user.smokingStatus} color="text-orange-600" />
          <InfoRow icon={Zap} label="Alcohol" value={user.alcoholStatus} color="text-emerald-600" />
          <InfoRow icon={Activity} label="Exercise" value={user.exerciseFrequency} color="text-blue-600" />
        </Section>

        {/* ── NEW: Advanced Medical ── */}
        <Section title="Detailed Medical History" icon={Info}>
          <InfoRow icon={Users} label="Family History" value={user.familyMedicalHistory} color="text-purple-600" />
          <InfoRow icon={Heart} label="Organ Donor Status" value={user.organDonorStatus} color="text-red-500" />
          <InfoRow icon={Stethoscope} label="Other Conditions" value={user.medicalInfo} color="text-slate-500" />
        </Section>

        {/* ── NEW: Clinical Access Passcode ── */}
        <Section title="Clinical Access Security" icon={ShieldCheck}>
          <div className="py-4 space-y-4">
            <div className="bg-primary-50 border border-primary-100 p-4 rounded-2xl flex items-start gap-3">
              <div className="mt-0.5 text-primary-600"><ShieldCheck size={20} /></div>
              <div>
                <p className="text-xs font-black text-primary-900 uppercase tracking-widest mb-1">Vault Unlock Passcode</p>
                <div className="flex items-center gap-6">
                   <p className="text-3xl font-black text-slate-900 tracking-[0.2em] font-mono">
                     {user.historyPasscode || 'XXXXXX'}
                   </p>
                   <button 
                    onClick={() => navigate('/dashboard/profile/edit')}
                    className="p-2 bg-white text-primary-600 rounded-xl border border-primary-100 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                   >
                     <Edit3 size={16} />
                   </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Give this code to your doctor for **Immediate Direct Access** to your full medical history without needing manual approval.
            </p>
          </div>
        </Section>

      </div>

      {/* ── QR Emergency Card ── */}
      {user.id && (
        <div className="bg-gradient-to-br from-red-900 to-red-700 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 text-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl inline-block">
                <QRCode
                  id="patient-qr-svg"
                  value={emergencyUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#991b1b"
                  level="H"
                />
              </div>
              <button onClick={handleDownloadQR}
                className="mt-3 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95 mx-auto">
                <Download size={14} /> Download QR
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <QrCode size={20} className="text-red-300" />
                <h3 className="text-xl font-extrabold">Your Emergency Medical QR</h3>
              </div>
              <p className="text-red-200 text-sm leading-relaxed mb-4">
                This unique QR code contains your critical medical information. In an emergency, any doctor or paramedic can scan this to instantly access:
              </p>
              <ul className="space-y-1.5 text-sm text-red-100">
                <li className="flex items-center gap-2"><span className="text-yellow-300">🩸</span> Blood Group & Age</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">📞</span> Emergency Contact</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">⚠️</span> Known Allergies</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">💊</span> Current Medications</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">🏥</span> Existing Conditions & Past Surgeries</li>
              </ul>
              <p className="text-xs text-red-300 mt-4 font-medium">
                💡 Print this QR and keep it in your wallet or on your phone's lock screen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-[40px] border border-red-100 p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 translate-x-1/4 -translate-y-1/4 group-hover:rotate-0 transition-transform duration-700">
              <AlertTriangle size={200} className="text-red-600" />
          </div>
          <div className="relative z-10 text-center md:text-left">
              <h4 className="text-2xl font-black text-red-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                  <AlertCircle size={24} className="text-red-500" /> Permanent Account Deletion
              </h4>
              <p className="text-red-600/70 font-medium mt-2 max-w-xl">
                  This action is irreversible. All clinical records, laboratory reports, appointments, and telemetry linkage 
                  will be PERMANENTLY scrubbed from the MediSync secure nodes.
              </p>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="relative z-10 px-8 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 shrink-0"
          >
              Delete My Account
          </button>
      </div>

      {/* Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                <div className="p-10 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <AlertTriangle size={40} />
                    </div>
                    
                    {deleteStep === 'request' ? (
                        <>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Critical Confirmation</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Are you absolutely sure you want to proceed? 
                                A security verification code will be sent to your email to confirm this action.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={handleRequestDeletion}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Generating Security Code..." : "Send Verification Code"}
                                </button>
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Enter Security Code</h3>
                            <p className="text-slate-500 font-medium mb-8">
                                Input the 6-digit verification code sent to your registered email to finalize deletion.
                            </p>
                            <input 
                                type="text"
                                maxLength="6"
                                placeholder="000000"
                                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-8 focus:border-red-500 transition-all outline-none"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            />
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={handleConfirmDeletion}
                                    disabled={isSubmitting || otp.length !== 6}
                                    className="w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Scrubbing Data..." : "Permanently Delete Data"}
                                </button>
                                <button 
                                    onClick={() => setDeleteStep('request')}
                                    className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                                >
                                    Back
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
