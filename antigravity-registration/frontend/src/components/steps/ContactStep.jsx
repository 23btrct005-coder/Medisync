import { motion } from 'framer-motion';
import { useForm } from '../../context/FormContext';
import { ArrowRight, MapPin, ArrowLeft } from 'lucide-react';

const ContactStep = () => {
  const { formData, updateFormData, nextStep, prevStep } = useForm();
  
  const handleChange = (e) => updateFormData({ [e.target.name]: e.target.value });
  
  const handleAddress = (e) => {
    updateFormData({ address: { ...formData.address, [e.target.name]: e.target.value } });
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
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-blue flex items-center">
          <MapPin className="mr-3 text-neon-purple" /> Comms & Coordinates
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Mobile Frequency</label>
          <div className="flex gap-2">
            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="input-antigravity flex-1" placeholder="Primary Comms" />
            <button className="bg-space-700 border border-neon-cyan text-neon-cyan px-2 rounded-xl text-xs hover:bg-neon-cyan hover:text-black transition">Verify OTP</button>
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Alt Comms</label>
          <input name="altMobileNumber" value={formData.altMobileNumber} onChange={handleChange} className="input-antigravity" placeholder="Backup Comms" />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Holonet Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-antigravity" placeholder="user@galaxy.net" />
        </div>

        <div className="md:col-span-2 pt-4">
          <h3 className="text-sm font-semibold text-white/70 mb-4 tracking-wider uppercase">Planetary Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="street" value={formData.address.street} onChange={handleAddress} className="input-antigravity md:col-span-2" placeholder="Sector / Street" />
            <input name="city" value={formData.address.city} onChange={handleAddress} className="input-antigravity" placeholder="City" />
            <input name="state" value={formData.address.state} onChange={handleAddress} className="input-antigravity" placeholder="State/Region" />
            <input name="pincode" value={formData.address.pincode} onChange={handleAddress} className="input-antigravity" placeholder="ZipCode" />
            <input name="country" value={formData.address.country} onChange={handleAddress} className="input-antigravity" placeholder="Realm/Country" />
          </div>
        </div>

      </div>

      <div className="flex justify-between mt-10">
        <button onClick={prevStep} className="text-slate-400 hover:text-white transition-all px-4 py-2 flex items-center"><ArrowLeft size={18} className="mr-2" /> Back</button>
        <button onClick={nextStep} className="btn-neon flex items-center">Proceed <ArrowRight className="ml-2" size={18} /></button>
      </div>
    </motion.div>
  );
};

export default ContactStep;
