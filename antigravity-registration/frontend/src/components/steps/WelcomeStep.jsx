import { motion } from 'framer-motion';
import { useForm } from '../../context/FormContext';
import { Rocket, Sparkles } from 'lucide-react';

const WelcomeStep = () => {
  const { nextStep } = useForm();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="glass-card w-full p-10 text-center"
    >
      <motion.div 
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto w-32 h-32 mb-8 relative rounded-full flex items-center justify-center bg-space-900 border-2 border-neon-blue shadow-neon-blue"
      >
        <Rocket size={48} className="text-neon-cyan" />
      </motion.div>
      
      <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
        ANTIGRAVITY ONBOARDING
      </h1>
      
      <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
        Experience zero-friction registration. Step into the next generation of seamless medial triage.
      </p>
      
      <button 
        onClick={nextStep}
        className="btn-neon flex items-center justify-center mx-auto text-lg"
      >
        <Sparkles className="mr-2" /> Initiate Sequence
      </button>
    </motion.div>
  );
};

export default WelcomeStep;
