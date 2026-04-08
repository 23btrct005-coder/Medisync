import { motion } from 'framer-motion';
import { useForm } from '../../context/FormContext';
import { Activity, ArrowRight, ArrowLeft } from 'lucide-react';

const MedicalStep = () => {
  const { formData, updateFormData, nextStep, prevStep } = useForm();
  
  const handleChange = (e) => updateFormData({ [e.target.name]: e.target.value });
  
  const handleCheckbox = (e) => updateFormData({ [e.target.name]: e.target.checked });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="glass-card w-full p-8"
    >
      <div className="flex items-center mb-8 border-b border-white/10 pb-4">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-green-400 flex items-center">
          <Activity className="mr-3 text-green-400" /> Medical Telemetry
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Blood Type</label>
          <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input-antigravity appearance-none">
            <option value="">Select</option>
            <option value="O+">O+</option>
            <option value="A+">A+</option>
            <option value="B+">B+</option>
            <option value="AB+">AB+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div className="flex gap-4 md:col-span-2">
            <div className="flex flex-col flex-1">
              <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Height (cm)</label>
              <input name="height" value={formData.height} onChange={handleChange} className="input-antigravity" placeholder="180" />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Mass (kg)</label>
              <input name="weight" value={formData.weight} onChange={handleChange} className="input-antigravity" placeholder="75" />
            </div>
        </div>

        <div className="flex flex-col md:col-span-3">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Allergies (Comma separated)</label>
          <input name="newAllergy" value={formData.newAllergy} onChange={handleChange} className="input-antigravity" placeholder="e.g. Penicillin, Peanuts" />
        </div>

        <div className="flex flex-col md:col-span-3">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Current Medications</label>
          <textarea name="currentMedications" value={formData.currentMedications} onChange={handleChange} className="input-antigravity resize-none" rows="2" placeholder="List active prescriptions" />
        </div>

        <div className="flex flex-col md:col-span-3">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Past Surgeries / Procedures</label>
          <textarea name="pastSurgeries" value={formData.pastSurgeries} onChange={handleChange} className="input-antigravity resize-none" rows="2" placeholder="Append medical history logs" />
        </div>

        <div className="flex items-center gap-4 md:col-span-3 p-4 bg-space-900/50 rounded-xl border border-white/5">
           <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="hasDisability" checked={formData.hasDisability} onChange={handleCheckbox} className="w-5 h-5 rounded border-gray-300 text-neon-purple focus:ring-neon-purple bg-transparent" />
              <span className="text-sm tracking-wider">Register Disability</span>
           </label>
           {formData.hasDisability && (
              <input name="disabilityDetails" value={formData.disabilityDetails} onChange={handleChange} className="input-antigravity flex-1 py-1" placeholder="Specify details" />
           )}
        </div>

      </div>

      <div className="flex justify-between mt-10">
        <button onClick={prevStep} className="text-slate-400 hover:text-white transition-all px-4 py-2 flex items-center"><ArrowLeft size={18} className="mr-2" /> Back</button>
        <button onClick={nextStep} className="btn-neon flex items-center border-green-500 text-green-400 hover:bg-green-500 hover:text-black hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]">Proceed <ArrowRight className="ml-2" size={18} /></button>
      </div>
    </motion.div>
  );
};

export default MedicalStep;
