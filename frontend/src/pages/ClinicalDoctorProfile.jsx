import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Stethoscope, Mail, Phone, GraduationCap, BadgeCheck,
  Building2, Clock, Activity, AlertCircle, User, Users, Star,
  Calendar, CheckCircle, XCircle, Video, Edit3, MapPin, CreditCard, Wallet
} from 'lucide-react';
import ClinicMap from '../components/ClinicMap';

const InfoRow = ({ icon: Icon, label, value, color = 'text-blue-600' }) => (
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
      <Icon size={18} className="text-blue-700" />
      <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
    </div>
    <div className="px-6 divide-y divide-slate-50">{children}</div>
  </div>
);

const DoctorProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log("Current Doctor Profile State:", user);

  if (loading) return (
    <div className="flex justify-center items-center p-20">
      <div className="animate-spin text-blue-600"><Activity size={36} /></div>
    </div>
  );

  if (!user) return (
    <div className="text-center p-12 text-slate-400">
      <AlertCircle size={40} className="mx-auto mb-3" />
      <p>Could not load profile. Please log in again.</p>
    </div>
  );

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
  const photoUrl = user.profilePictureUrl || `${api.defaults.baseURL}/auth/doctor/photo/${user.id}?t=${Date.now()}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {user.role === 'ROLE_HOSPITAL_ADMIN' ? 'Administrative Profile' : 'Physician Profile'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Your professional profile on MEDISYNC</p>
        </div>
        {!user.hospitalEntity ? (
          <button 
            onClick={() => navigate('/doctor-dashboard/profile/edit')}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl hover:bg-slate-50 transition shadow-sm active:scale-95"
          >
            <Edit3 size={18} className="text-blue-600" />
            Edit My Professional Profile
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold shadow-sm">
            <Building2 size={18} className="text-slate-400" /> 
            Institutional Profile (Managed by Admin)
          </div>
        )}
      </div>

      {/* Identity Card */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center backdrop-blur-sm shrink-0 border-2 border-white/30">
            <img 
              src={photoUrl} 
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center w-full h-full text-3xl font-extrabold uppercase bg-blue-500/50">
                {initials}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-extrabold">{user.name || 'Doctor'}</h3>
            <p className="text-blue-200 text-sm mt-1">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              {user.specialization && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Stethoscope size={12} /> {user.specialization}
                </span>
              )}
              {user.medicalDegree && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{user.medicalDegree}</span>
              )}
              {user.yearsOfExperience && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{user.yearsOfExperience} yrs exp</span>
              )}
              <span className="bg-emerald-400/30 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle size={12} /> Active Provider
              </span>
              <span className="bg-amber-400/30 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Star size={12} fill="currentColor" /> {user.averageRating || '0.0'} ({user.ratingCount || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Basic Details */}
        <Section title="Basic Details" icon={User}>
          <InfoRow icon={User} label="Full Name" value={user.name} />
          <InfoRow icon={Users} label="Gender" value={user.gender} color="text-purple-500" />
          <InfoRow icon={Calendar} label="Date of Birth" value={user.dateOfBirth} color="text-blue-500" />
          <InfoRow icon={Calendar} label="Age" value={user.age ? `${user.age} Years` : null} color="text-blue-500" />
        </Section>

        {/* Contact Information */}
        <Section title="Contact Information" icon={Phone}>
          <InfoRow icon={Mail} label="Email Address" value={user.email} color="text-blue-500" />
          <InfoRow icon={Phone} label="Mobile Number" value={user.phone} color="text-green-500" />
          <InfoRow icon={Phone} label="Alternate Mobile" value={user.alternatePhone} color="text-green-400" />
        </Section>

        {/* Professional Qualifications */}
        <Section title="Professional Qualifications" icon={GraduationCap}>
          <InfoRow icon={GraduationCap} label="Medical Degree" value={user.medicalDegree} color="text-indigo-500" />
          <InfoRow icon={Stethoscope} label="Specialization" value={user.specialization} color="text-blue-600" />
          <InfoRow icon={GraduationCap} label="College / University" value={user.college} color="text-indigo-400" />
          <InfoRow icon={BadgeCheck} label="Additional Certifications" value={user.additionalCertifications} color="text-amber-500" />
        </Section>

        {/* License & Verification */}
        <Section title="License & Verification" icon={BadgeCheck}>
          <InfoRow icon={BadgeCheck} label="Medical License Number" value={user.medicalLicenseNumber} color="text-emerald-600" />
          <div className="py-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">License Status</p>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-bold border border-emerald-200">
              <CheckCircle size={15} /> Verified Physician
            </span>
          </div>
        </Section>

        {/* Work Details */}
        <Section title="Work Details" icon={Building2}>
          <InfoRow icon={Building2} label="Hospital / Clinic" value={user.hospital} color="text-slate-600" />
          <InfoRow icon={Clock} label="Years of Experience" value={user.yearsOfExperience ? `${user.yearsOfExperience} years` : null} color="text-blue-500" />
          <InfoRow icon={BadgeCheck} label="Consultation Fee" value={user.consultationFee ? `₹ ${user.consultationFee}` : null} color="text-green-600" />
        </Section>

        {/* Availability */}
        <Section title="Availability" icon={Clock}>
          <div className="py-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Active Working Days</p>
            <div className="flex flex-wrap gap-2">
              {user.workingDays ? user.workingDays.split(', ').map(day => (
                <span key={day} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 shadow-sm">
                  {day}
                </span>
              )) : <span className="text-slate-300 italic text-sm">Not scheduled</span>}
            </div>
          </div>
          <InfoRow icon={Clock} label="Consultation Timings" value={user.consultationTimings} color="text-blue-500" />
          <div className="py-3 flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-indigo-500"><Video size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Online Consultation</p>
              <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold ${user.onlineConsultation ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500'}`}>
                {user.onlineConsultation
                  ? <><CheckCircle size={13} /> Available</>
                  : <><XCircle size={13} /> Not Available</>}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Transactional Identity" icon={Wallet}>
          <div className="py-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Preferred Channel</p>
            <div className="flex items-center gap-2">
               {user.preferredPaymentMode === 'RAZORPAY' && <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 flex items-center gap-2"><CreditCard size={14} /> Razorpay Route</span>}
               {user.preferredPaymentMode === 'UPI' && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center gap-2"><Activity size={14} /> Direct UPI</span>}
               {user.preferredPaymentMode === 'BOTH' && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 flex items-center gap-2"><CheckCircle size={14} /> Dual Channel</span>}
               {!user.preferredPaymentMode && <span className="text-slate-300 italic text-sm">Not configured</span>}
            </div>
          </div>
          <InfoRow icon={CreditCard} label="Razorpay Account ID" value={user.razorpayAccountId} color="text-indigo-500" />
          <InfoRow icon={Activity} label="Personal UPI ID (VPA)" value={user.upiId} color="text-emerald-500" />
          <div className="py-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Node Status</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${(user.razorpayAccountId || user.upiId) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
              {(user.razorpayAccountId || user.upiId) ? <><CheckCircle size={13} /> Secure Node Active</> : <><XCircle size={13} /> Offline Payments Only</>}
            </span>
          </div>
        </Section>

        {/* Clinic Mapping */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-red-600" />
                  <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Clinic Location Hub</h4>
                </div>
                {!user.clinicAddress && !user.hospitalEntity ? (
                  <button 
                    onClick={() => navigate('/doctor-dashboard/profile/edit')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all animate-pulse"
                  >
                    Add Location
                  </button>
                ) : (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                    Verified Terminal
                  </span>
                )}
              </div>
             <div className="p-6">
                <ClinicMap address={user.clinicAddress || user.hospitalEntity?.location} hospitalName={user.hospital} height="350px" />
                {user.clinicAddress && !user.hospitalEntity && (
                  <p className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-2">
                     <AlertCircle size={14} className="text-amber-500" />
                     If this location is incorrect, please update it in the Professional Profile Editor.
                  </p>
                )}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorProfile;
