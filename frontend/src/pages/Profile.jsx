import { useAuth } from '../context/AuthContext';
import {
  UserCircle, Mail, Phone, MapPin, Droplet, Calendar,
  Activity, AlertCircle, Heart, ShieldCheck, Users
} from 'lucide-react';

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
  const { user, loading } = useAuth();

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Your personal and medical information on MEDISYNC</p>
      </div>

      {/* Identity Card */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold backdrop-blur-sm shrink-0">
            {initials}
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
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">Patient ID: #{user.id}</span>
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

        {/* Medical Info */}
        <Section title="Medical Information" icon={ShieldCheck}>
          <InfoRow icon={Droplet} label="Blood Group" value={user.bloodGroup} color="text-red-500" />
          <div className="py-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Known Conditions / Allergies</p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3">
              {user.medicalInfo || <span className="text-slate-300">No medical info added</span>}
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
};

export default Profile;
