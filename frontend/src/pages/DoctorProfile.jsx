import { useAuth } from '../context/AuthContext';
import {
  Stethoscope, Mail, Phone, GraduationCap, BadgeCheck,
  Building2, Clock, Activity, AlertCircle, User, Users,
  Calendar, CheckCircle, XCircle, Video
} from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Physician Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Your professional profile on MEDISYNC</p>
      </div>

      {/* Identity Card */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold backdrop-blur-sm shrink-0">
            {initials}
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
          <InfoRow icon={Calendar} label="Working Days" value={user.workingDays} color="text-blue-500" />
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

      </div>
    </div>
  );
};

export default DoctorProfile;
