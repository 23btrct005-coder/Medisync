import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, UserPlus, Heart, ShieldCheck, Mail, 
  MapPin, Activity as ActivityIcon, User, 
  Stethoscope, FileText, CheckCircle, ArrowRight, ArrowLeft,
  Bot, AlertCircle, Phone, Lock, Eye, EyeOff, ClipboardList
} from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';

// Modular Step Indicator
const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-between mb-8 max-w-sm mx-auto">
    {[...Array(totalSteps)].map((_, i) => (
      <React.Fragment key={i}>
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${i + 1 <= currentStep ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
          {i + 1 < currentStep ? <CheckCircle size={20} /> : <span className="font-black text-sm">{i + 1}</span>}
          {i + 1 === currentStep && <motion.div layoutId="step-glow" className="absolute inset-0 bg-emerald-500/30 blur-lg rounded-full" />}
        </div>
        {i < totalSteps - 1 && (
          <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${i + 1 < currentStep ? 'bg-emerald-500' : 'bg-slate-100'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const RegisterPro = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',
    otpCode: '',
    // Step 2: Identity
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    nationalId: '',
    maritalStatus: '',
    occupation: '',
    // Step 3: Body & Identity
    bloodGroup: '',
    height: '',
    weight: '',
    hasDisability: 'false',
    disabilityDetails: '',
    // Step 4: Contact & Social
    phone: '',
    alternatePhone: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    altEmergencyPhone: '',
    // Step 5: Clinical History
    allergies: '',
    existingDiseases: '',
    currentMedications: '',
    pastSurgeries: '',
    // Step 6: Lifestyle
    smokingStatus: '',
    alcoholStatus: '',
    exerciseFrequency: '',
    organDonorStatus: 'Undecided'
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-age calculation
    if (name === 'dateOfBirth' && value) {
      const today = new Date();
      const dob = new Date(value);
      let calculatedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) calculatedAge--;
      setFormData(prev => ({ ...prev, age: String(calculatedAge) }));
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) { setError('Email required.'); return; }
    setVerifying(true);
    try {
      await api.post('auth/request-otp', { email: formData.email });
      setOtpSent(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally { setVerifying(false); }
  };

  const handleVerifyOtp = async () => {
    setVerifying(true);
    try {
      await api.post('auth/verify-otp', { email: formData.email, otp: formData.otpCode });
      setEmailVerified(true);
      setOtpSent(false);
      setCurrentStep(2);
      setError('');
    } catch (err) {
      setError('Invalid code.');
    } finally { setVerifying(false); }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('userData', JSON.stringify(formData));
      if (profilePicture) formDataToSend.append('profilePicture', profilePicture);

      await api.post('auth/register/patient', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Onboarding complete. Welcome to the OS.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finish onboarding.');
    } finally { setLoading(false); }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // Input Utility
  const InputField = ({ label, name, type = 'text', placeholder, options }) => (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {options ? (
        <select name={name} value={formData[name]} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none">
          <option value="">Select {label}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 selection:bg-emerald-100">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20"><Activity size={20} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-800">Unified Onboarding</h1>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden">
          {/* Glass Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10" />
          
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Node Setup</h2>
                  <p className="text-slate-400 text-sm">Verify your clinical identifier to begin expansion.</p>
                </div>
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}
                
                <InputField label="Clinical Email" name="email" type="email" placeholder="e.g. john@medisync.io" />
                {!otpSent ? (
                  <button onClick={handleSendOtp} disabled={verifying} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                    {verifying ? 'Provisioning...' : 'Secure Verification'}
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <InputField label="6-Digit Node Key" name="otpCode" placeholder="000000" />
                    <button onClick={handleVerifyOtp} disabled={verifying} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                      {verifying ? 'Authenticating...' : 'Validate & Next'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identity Calibration</h2>
                  <p className="text-slate-400 text-sm">Your secure baseline personal record.</p>
                </div>
                <div className="flex justify-center mb-6">
                  <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><InputField label="Full Clinical Name" name="name" /></div>
                  <InputField label="Gender" name="gender" options={['Male', 'Female', 'Other', 'Non-Binary']} />
                  <InputField label="Date of Birth" name="dateOfBirth" type="date" />
                  <InputField label="National ID Number" name="nationalId" placeholder="UIDAI/Voter/Passport" />
                  <InputField label="Marital Status" name="maritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Back</button>
                  <button onClick={nextStep} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">Proceed</button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Medical Metrics</h2>
                  <p className="text-slate-400 text-sm">Vital physical identifiers for accurate care.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Blood Group" name="bloodGroup" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                  <InputField label="Height (cm)" name="height" placeholder="e.g. 175" />
                  <InputField label="Weight (kg)" name="weight" placeholder="e.g. 70" />
                  <InputField label="Disability Status" name="hasDisability" options={['true', 'false']} />
                </div>
                {formData.hasDisability === 'true' && (
                  <div className="pt-2"><InputField label="Disability Details" name="disabilityDetails" placeholder="Describe status..." /></div>
                )}
                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Back</button>
                  <button onClick={nextStep} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">Proceed</button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Social Network</h2>
                  <p className="text-slate-400 text-sm">Where we can reach you and your emergency circle.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Primary Mobile" name="phone" placeholder="10 Digits" />
                  <InputField label="Occupation" name="occupation" />
                  <InputField label="City" name="city" />
                  <InputField label="State" name="state" />
                  <div className="md:col-span-2"><InputField label="Street / Residential Area" name="street" /></div>
                  <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Emergency Contact</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Full Name" name="emergencyContactName" />
                      <InputField label="Relationship" name="emergencyContactRelationship" options={['Spouse', 'Parent', 'Sibling', 'Guardian']} />
                      <InputField label="Primary Phone" name="emergencyContactPhone" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Back</button>
                  <button onClick={nextStep} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">Proceed</button>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clinical History</h2>
                  <p className="text-slate-400 text-sm">Crucial data for AI diagnostic engine analysis.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <InputField label="Known Allergies" name="allergies" placeholder="e.g. Penicillin, Peanuts" />
                  <InputField label="Current Chronic Diseases" name="existingDiseases" placeholder="e.g. Hypertension, Diabetes" />
                  <InputField label="Active Medications" name="currentMedications" placeholder="e.g. Metformin 500mg" />
                  <InputField label="Past Surgeries / Procedures" name="pastSurgeries" placeholder="Year and Type" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Back</button>
                  <button onClick={nextStep} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">Proceed</button>
                </div>
              </motion.div>
            )}

            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Habit & Lifestyle</h2>
                  <p className="text-slate-400 text-sm">Final calibration for personalized health optimization.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Smoking Frequency" name="smokingStatus" options={['Non-Smoker', 'Occasional', 'Regular', 'Frequent']} />
                  <InputField label="Alcohol Intake" name="alcoholStatus" options={['None', 'Social', 'Weekly', 'Regular']} />
                  <InputField label="Exercise Frequency" name="exerciseFrequency" options={['None', 'Once Weekly', '3-4 Times/Week', 'Daily']} />
                  <InputField label="Organ Donor Status" name="organDonorStatus" options={['Yes', 'No', 'Undecided']} />
                </div>
                
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mt-4">
                  <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                     <Bot size={14} className="inline mr-1 mb-1" />
                     The "Unified Healthcare OS" will use this clinical baseline to synchronize with your AI Diagnostic Engine and emergency medical responders.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Back</button>
                  <button onClick={handleFinalSubmit} disabled={loading} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                    {loading ? 'Finalizing...' : 'Complete Onboarding'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
           Powered by Antigravity Pro Clinical Engine 2026
        </p>
      </div>
    </div>
  );
};

export default RegisterPro;
