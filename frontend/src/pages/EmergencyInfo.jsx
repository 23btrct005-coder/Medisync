// Public Emergency Info Page — accessed by scanning patient's QR code
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle, Droplet, User, Phone, Heart,
  Pill, Stethoscope, Scissors, Activity, Shield, Calendar, Users,
  CheckCircle, ArrowRight, Lock
} from 'lucide-react';

const Badge = ({ color, children }) => {
  const colors = {
    red: 'bg-red-100 text-red-800 border-red-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${colors[color] || colors.blue} mr-2 mb-2`}>
      {children}
    </span>
  );
};

const CriticalSection = ({ icon: Icon, title, color, bgColor, borderColor, content, badges }) => {
  const items = content ? content.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-5`}>
      <h3 className={`flex items-center gap-2 font-extrabold text-[10px] uppercase tracking-widest mb-3 ${color} opacity-80`}>
        <Icon size={16} /> {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? items.map((item, i) => (
          <span key={i} className={`inline-block px-3 py-1.5 rounded-xl text-sm font-bold bg-white/80 border ${borderColor} ${color} shadow-sm`}>
            {item}
          </span>
        )) : (
          <span className="text-slate-400 text-sm font-medium italic px-1">None Reported / Stable</span>
        )}
      </div>
    </div>
  );
};

const EmergencyInfo = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, user: currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 🚀 Support for Numeric ID or Short Codes (MS-XXXX or TN-29-XXXX)
        const isShortCode = patientId && (isNaN(patientId) || patientId.includes('-'));
        const endpoint = isShortCode 
          ? `auth/emergency/shortcode/${patientId}` 
          : `auth/emergency/${patientId}`;
          
        const res = await api.get(endpoint);
        setPatient(res.data);
      } catch (err) {
        console.error("Critical patient data fetch failed", err);
        setError('Critical patient data could not be retrieved. Ensure the QR code or ID is valid.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const handleRequestAccess = async () => {
    setRequesting(true);
    setRequestError('');
    try {
      console.log(`Requesting access for patient ID: ${patient.id}`);
      await api.post('doctor/request-access', { patientId: patient.id });
      setRequestSuccess(true);
      toast.success('Clinical access request submitted successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send request. You might already have access or a pending request.';
      setRequestError(msg);
      toast.error(msg);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="animate-spin text-red-500"><Activity size={48} /></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm shadow-xl border border-red-200">
        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Not Found</h2>
        <p className="text-slate-500 mt-2 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 py-0 font-sans">
      {/* Emergency Header Banner */}
      <div className="bg-red-600 px-6 py-4 text-center shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <AlertTriangle size={28} className="text-yellow-300 animate-pulse" />
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">⚕ EMERGENCY MEDICAL ID</h1>
          <AlertTriangle size={28} className="text-yellow-300 animate-pulse" />
        </div>
        <p className="text-red-200 text-xs mt-1 uppercase tracking-widest font-bold">
          MEDISYNC — Critical Patient Information
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-12">

        {/* Identity Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-400">
          <div className="bg-gradient-to-r from-red-700 to-red-500 px-6 py-6 text-white relative">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex overflow-hidden items-center justify-center text-3xl font-black backdrop-blur-sm border-2 border-white/30">
                <img 
                  src={`${api.defaults.baseURL}/auth/patient/photo/${patient.id}`}
                  alt={patient.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center w-full h-full text-3xl font-black uppercase bg-red-600/50">
                   {(patient.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight capitalize">{patient.name || 'Unknown Patient'}</h2>
                <p className="text-red-200 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Reference ID: {patient.patientId}</p>
              </div>
            </div>
          </div>

          {/* Critical Vitals Row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="p-4 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Blood Group</p>
              <p className="text-3xl font-black text-red-600 mt-1">{patient.bloodGroup || 'N/A'}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Age</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{patient.age || 'N/A'}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Gender</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{patient.gender || 'N/A'}</p>
            </div>
          </div>

          {/* Physique Details */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
             <div className="px-6 py-4 flex items-center justify-center gap-3">
               <Activity size={18} className="text-slate-400" />
               <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Height</p>
                  <p className="text-sm font-black text-slate-700">{patient.height || 'N/A'}</p>
               </div>
             </div>
             <div className="px-6 py-4 flex items-center justify-center gap-3">
               <Droplet size={18} className="text-slate-400" />
               <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Weight</p>
                  <p className="text-sm font-black text-slate-700">{patient.weight || 'N/A'}</p>
               </div>
             </div>
          </div>

          {/* DOB */}
          {patient.dateOfBirth && (
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 text-slate-600">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Date of Birth:</span>
              <span className="text-sm font-semibold ml-1">{patient.dateOfBirth}</span>
            </div>
          )}
        </div>

        {/* Emergency Contact — HIGH PRIORITY */}
        {(patient.emergencyContactName || patient.emergencyContactPhone) && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-400 overflow-hidden">
            <div className="bg-orange-500 px-5 py-3">
              <h3 className="flex items-center gap-2 font-black text-white text-sm uppercase tracking-widest">
                <Phone size={16} /> Emergency Contact — CALL IMMEDIATELY
              </h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {patient.emergencyContactName && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Name</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{patient.emergencyContactName}</p>
                </div>
              )}
              {patient.emergencyContactRelationship && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Relation</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{patient.emergencyContactRelationship}</p>
                </div>
              )}
              {patient.emergencyContactPhone && (
                <div className="col-span-2">
                  <a href={`tel:${patient.emergencyContactPhone}`}
                    className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3.5 rounded-2xl text-lg transition active:scale-95 shadow-lg">
                    <Phone size={22} /> {patient.emergencyContactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Allergies — RED ALERT */}
        <CriticalSection
          icon={AlertTriangle}
          title="⚠ Known Allergies — DO NOT ADMINISTER"
          color="text-red-700"
          bgColor="bg-red-50"
          borderColor="border-red-400"
          content={patient.allergies}
        />

        {/* Existing Diseases */}
        <CriticalSection
          icon={Stethoscope}
          title="Existing Medical Conditions"
          color="text-orange-700"
          bgColor="bg-orange-50"
          borderColor="border-orange-300"
          content={patient.existingDiseases}
        />

        {/* Current Medications */}
        <CriticalSection
          icon={Pill}
          title="Current Medications"
          color="text-blue-700"
          bgColor="bg-blue-50"
          borderColor="border-blue-300"
          content={patient.currentMedications}
        />

        {/* Past Surgeries */}
        <CriticalSection
          icon={Scissors}
          title="Past Major Surgeries"
          color="text-purple-700"
          bgColor="bg-purple-50"
          borderColor="border-purple-300"
          content={patient.pastSurgeries}
        />

        {/* Additional Medical Notes */}
        {patient.medicalInfo && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-widest text-slate-500 mb-3">
              <Shield size={15} /> Additional Medical Notes
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{patient.medicalInfo}</p>
          </div>
        )}

        {/* Doctor Action — Request Full Access */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mt-8">
           <div className="flex flex-col items-center text-center">
              <Lock size={24} className="text-red-300 mb-2" />
              <h4 className="text-white font-bold tracking-tight">Authorized Medical Access</h4>
              <p className="text-red-100 text-sm mt-1 mb-5">Physician? Request full access to view clinical history, lab reports, and full profile.</p>
              
              {requestError && (
                <div className="w-full mb-4 p-3 bg-red-900/50 border border-red-400/30 rounded-xl text-red-100 text-xs text-left flex items-start gap-2">
                   <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-300" />
                   {requestError}
                </div>
              )}

              {userRole === 'ROLE_DOCTOR' ? (
                <button 
                  onClick={handleRequestAccess}
                  disabled={requesting || requestSuccess}
                  className={`w-full ${requestSuccess ? 'bg-green-500 text-white shadow-green-200' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/40'} font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-80 disabled:active:scale-100`}
                >
                  {requesting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      SUBMITTING AUTH REQUEST...
                    </>
                  ) : requestSuccess ? (
                    <>
                      <CheckCircle size={22} className="animate-in zoom-in duration-300" />
                      REQUEST SENT
                    </>
                  ) : (
                    <>
                      AUTHORIZE FULL CLINICAL ACCESS <ArrowRight size={20} />
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  className="w-full bg-white text-red-800 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition shadow-xl active:scale-95"
                >
                  PHYSICIAN GATEWAY <ArrowRight size={20} />
                </button>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-red-200 text-xs space-y-1 font-medium">
          <p className="flex items-center justify-center gap-1.5">
            <Heart size={13} className="text-red-300" />
            Powered by MEDISYNC Healthcare Portal
          </p>
          <p>This QR contains critical medical information. Handle with care.</p>
        </div>

      </div>
    </div>
  );
};

export default EmergencyInfo;
