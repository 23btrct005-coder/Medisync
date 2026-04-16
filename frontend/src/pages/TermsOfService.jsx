import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, UserCheck, AlertTriangle, FileText, Globe } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();
  const lastUpdated = "April 16, 2026";

  const terms = [
    {
      title: "1. Acceptance of Terms",
      icon: <Scale className="text-secondary-600" size={24} />,
      content: "By accessing or using the Medisync platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
    },
    {
      title: "2. Registration & Account Security",
      icon: <UserCheck className="text-secondary-600" size={24} />,
      content: (
        <ul className="list-disc pl-5 space-y-2">
            <li>Users must be at least 18 years old or have parental/guardian consent.</li>
            <li>You are responsible for maintaining the confidentiality of your password and account credentials.</li>
            <li>You agree to provide accurate, current, and complete information during the registration process.</li>
            <li>Medisync reserves the right to suspend accounts that provide false medical or identity information.</li>
        </ul>
      )
    },
    {
      title: "3. Scope of Service (Medical Disclaimer)",
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className="font-bold text-slate-900">Medisync is a software platform, not a medical provider.</p>
          <p>We provide the infrastructure for doctors and patients to manage health data. We do not provide medical advice, diagnosis, or treatment. Any information obtained through the platform (including AI-generated summaries) should be used solely for informational purposes and confirmed with a qualified healthcare professional.</p>
        </div>
      )
    },
    {
      title: "4. Emergency QR Feature",
      icon: <Globe className="text-secondary-600" size={24} />,
      content: "By enabling your Emergency QR code, you grant temporary authorization for any individual who scans the code to view your emergency medical profile. This feature is provided 'as is' and Medisync is not responsible for any actions taken or not taken by third parties who access this information in an emergency situation."
    },
    {
      title: "5. User Conduct",
      icon: <FileText className="text-secondary-600" size={24} />,
      content: (
        <div className="space-y-2">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the platform for any illegal purpose.</li>
            <li>Upload medical records that do not belong to you without authorization.</li>
            <li>Reverse engineer or attempt to extract the platform's source code or AI models.</li>
            <li>Interfere with the security or operation of the platform.</li>
          </ul>
        </div>
      )
    },
    {
      title: "6. Limitation of Liability",
      icon: <Scale className="text-red-600" size={24} />,
      content: "In no event shall Medisync or its partners be liable for any damages (including, without limitation, damages for loss of clinical data, or due to business interruption) arising out of the use or inability to use the platform, even if Medisync has been notified of the possibility of such damage."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="group mb-8 flex items-center text-sm font-semibold text-slate-500 hover:text-secondary-600 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-slate-900 px-8 py-12 text-white relative">
            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
              <p className="text-slate-400 text-lg">The legal framework for our healthcare partnership.</p>
              <div className="mt-6 inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-md">
                Effective Date: {lastUpdated}
              </div>
            </div>
            {/* Geometric accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/10 to-transparent"></div>
          </div>

          <div className="p-8 space-y-10">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-2xl">
              <div className="flex gap-4">
                <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                <div>
                  <h3 className="text-amber-800 font-bold mb-1">Important Notice</h3>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Please read these terms carefully. They include important limitations of liability 
                    and disclaimers regarding the medical nature of our services.
                  </p>
                </div>
              </div>
            </div>

            {terms.map((term, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    {term.icon}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{term.title}</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 ml-1 leading-relaxed">
                  {term.content}
                </div>
              </div>
            ))}
          </div>

          {/* Accept Footer */}
          <div className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col items-center text-center">
            <p className="text-sm text-slate-500 mb-4 max-w-lg">
              By continuing to register or log in to Medisync, you confirm that you have read, 
              understood, and agree to be bound by these Terms of Service.
            </p>
            <button 
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              I Understand and Agree
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-xs uppercase tracking-widest font-medium">
          Medisync Platform Governance &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
