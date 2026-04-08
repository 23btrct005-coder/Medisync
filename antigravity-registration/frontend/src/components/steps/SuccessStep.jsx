import { motion } from 'framer-motion';
import { useForm } from '../../context/FormContext';
import { CheckCircle, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

const SuccessStep = () => {
  const { formData } = useForm();
  
  const downloadIdCard = () => {
    const card = document.getElementById('holographic-card');
    html2canvas(card, { backgroundColor: '#0B0D17' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `patient-${formData.fullName.replace(/\s+/g, '-')}-id.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="glass-card w-full p-10 flex flex-col items-center text-center"
    >
      <motion.div 
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-neon-cyan mb-6"
      >
        <CheckCircle size={80} className="filter drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]" />
      </motion.div>

      <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
        Onboarding Complete
      </h2>
      <p className="text-slate-300 max-w-md mb-8">
        Your physiological footprint has been successfully encrypted into the core database.
      </p>

      {/* Holographic ID Card */}
      <div id="holographic-card" className="relative p-[2px] bg-gradient-to-br from-neon-blue via-space-900 to-neon-purple rounded-2xl mb-8 w-full max-w-sm">
         <div className="bg-space-900/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center">
            <h3 className="text-neon-cyan text-sm tracking-widest uppercase mb-4">Medisync Global ID</h3>
            
            <div className="p-3 bg-white rounded-xl mb-4">
              <QRCode value={`medisync://${formData.nationalId || '0000'}`} size={120} />
            </div>
            
            <p className="text-xl font-bold mb-1">{formData.fullName}</p>
            <p className="text-slate-400 text-sm">Blood: <span className="text-red-400 font-bold">{formData.bloodGroup}</span></p>
         </div>
      </div>

      <button onClick={downloadIdCard} className="btn-neon flex items-center bg-transparent">
        <Download className="mr-2" size={18} /> Extract Local ID File
      </button>

    </motion.div>
  );
};

export default SuccessStep;
