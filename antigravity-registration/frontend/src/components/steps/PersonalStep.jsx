import { motion } from 'framer-motion';
import { useForm } from '../../context/FormContext';
import { Camera, Bot, ArrowRight, User } from 'lucide-react';

const PersonalStep = () => {
  const { formData, updateFormData, nextStep, prevStep } = useForm();
  
  const handleAI = () => {
    // Mocking AI fill
    updateFormData({
      fullName: 'John Orion Nova',
      dob: '2085-05-15',
      age: 26,
      gender: 'Male',
      nationalId: 'NDX-9989-11',
      maritalStatus: 'Single',
      occupation: 'Astro-Engineer'
    });
  };

  const handleChange = (e) => updateFormData({ [e.target.name]: e.target.value });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="glass-card w-full p-8"
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-white flex items-center">
          <User className="mr-3 text-neon-blue" /> Personal Matrix
        </h2>
        <button onClick={handleAI} className="flex items-center text-neon-purple hover:text-white transition-all text-sm border border-neon-purple px-3 py-1 rounded-full hover:shadow-neon-purple">
          <Bot size={16} className="mr-1" /> Auto-fill AI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Photo Upload Mock */}
        <div className="md:col-span-2 flex justify-center mb-4">
          <div className="relative group cursor-pointer w-32 h-32 rounded-full border-2 border-dashed border-neon-blue flex items-center justify-center bg-space-900 overflow-hidden hover:shadow-neon-blue transition-all">
             <Camera className="text-neon-cyan group-hover:scale-110 transition-transform" />
             <div className="absolute inset-0 bg-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <p className="absolute bottom-2 text-xs text-neon-blue mx-auto text-center w-full">Scan Face</p>
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Full Designation</label>
          <input name="fullName" value={formData.fullName} onChange={handleChange} className="input-antigravity" placeholder="Enter Full Name" />
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">National ID (Aadhaar/SSN)</label>
          <input name="nationalId" value={formData.nationalId} onChange={handleChange} className="input-antigravity" placeholder="Scan or Enter ID" />
        </div>

        <div className="flex gap-4">
           <div className="flex flex-col flex-1">
             <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">DOB</label>
             <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-antigravity" />
           </div>
           <div className="flex flex-col w-20">
             <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Age</label>
             <input type="number" name="age" value={formData.age} onChange={handleChange} className="input-antigravity" />
           </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="input-antigravity appearance-none">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Marital Status</label>
            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="input-antigravity appearance-none">
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-xs text-neon-blue mb-1 uppercase tracking-widest">Occupation</label>
          <input name="occupation" value={formData.occupation} onChange={handleChange} className="input-antigravity" placeholder="Current field of work" />
        </div>

      </div>

      <div className="flex justify-between mt-10">
        <button onClick={prevStep} className="text-slate-400 hover:text-white transition-all px-4 py-2">Abort</button>
        <button onClick={nextStep} className="btn-neon flex items-center">Proceed <ArrowRight className="ml-2" size={18} /></button>
      </div>
    </motion.div>
  );
};

export default PersonalStep;
