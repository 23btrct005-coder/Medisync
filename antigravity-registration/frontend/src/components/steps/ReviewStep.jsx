import { motion } from 'framer-motion';
import { useForm } from '../../context/FormContext';
import { ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';

const ReviewStep = () => {
  const { formData, updateFormData, nextStep, prevStep } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => updateFormData({ [e.target.name]: e.target.value });

  const submitToCore = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Security key hashes do not match.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const resp = await axios.post('http://localhost:5001/api/patients/register', { data: JSON.stringify(formData) });
      if (resp.data.success) {
        nextStep(); // to success
      }
    } catch (err) {
      setError('Core uplink failed. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="glass-card w-full p-8"
    >
      <div className="flex items-center mb-8 border-b border-white/10 pb-4">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 flex items-center">
          <ShieldCheck className="mr-3 text-red-500" /> Security Override & Review
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-space-900/50 p-6 rounded-xl border border-white/5 mb-8">
        <div>
          <h3 className="text-neon-cyan uppercase tracking-widest text-xs mb-2">Subject Name</h3>
          <p className="text-white text-lg">{formData.fullName || 'Unknown Entity'}</p>
        </div>
        <div>
          <h3 className="text-neon-cyan uppercase tracking-widest text-xs mb-2">Primary Comms</h3>
          <p className="text-white text-lg">{formData.email || 'Unregistered'}</p>
        </div>
        <div className="md:col-span-2">
           <h3 className="text-neon-cyan uppercase tracking-widest text-xs mb-2">Telemetry Snapshot</h3>
           <div className="flex gap-4">
             <span className="bg-space-800 px-3 py-1 rounded-full text-sm border border-white/10">Blood: {formData.bloodGroup || 'N/A'}</span>
             <span className="bg-space-800 px-3 py-1 rounded-full text-sm border border-white/10">Age: {formData.age || 'N/A'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Master Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-antigravity border-red-500/50 focus:ring-red-500" placeholder="••••••••" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Verify Master</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-antigravity border-red-500/50 focus:ring-red-500" placeholder="••••••••" />
        </div>
      </div>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

      <div className="flex justify-between mt-10">
        <button disabled={loading} onClick={prevStep} className="text-slate-400 hover:text-white transition-all px-4 py-2 flex items-center"><ArrowLeft size={18} className="mr-2" /> Back</button>
        <button disabled={loading} onClick={submitToCore} className="btn-neon flex items-center border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          {loading ? 'Uplinking...' : 'Commit to Core'} <ArrowRight className="ml-2" size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewStep;
