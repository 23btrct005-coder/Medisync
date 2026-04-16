import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Cloud, RefreshCw } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = "April 16, 2026";

  const sections = [
    {
      title: "1. Information We Collect",
      icon: <Shield className="text-primary-600" size={24} />,
      content: (
        <div className="space-y-3">
          <p>Medisync collects several types of information to provide and improve our clinical services:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li><strong>Personal Identity Information:</strong> Name, date of birth, gender, and contact details (email, phone number).</li>
            <li><strong>Clinical Data:</strong> Medical history, allergy information, medication records, and vitals.</li>
            <li><strong>Diagnostic Media:</strong> Radiology images (X-rays, MRIs), laboratory reports (PDFs), and clinical notes.</li>
            <li><strong>Technical Data:</strong> IP address, device type, and usage patterns to ensure security and site optimization.</li>
          </ul>
        </div>
      )
    },
    {
      title: "2. How We Use Your Data",
      icon: <RefreshCw className="text-primary-600" size={24} />,
      content: (
        <div className="space-y-3">
          <p>Your data is processed strictly for clinical and operational purposes:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Facilitating doctor-patient communication and appointment management.</li>
            <li>Providing AI-assisted clinical report summaries for faster diagnostic review.</li>
            <li>Enabling emergency access through your unique QR code.</li>
            <li>Improving platform performance and security monitoring.</li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Data Security & Encryption",
      icon: <Lock className="text-primary-600" size={24} />,
      content: (
        <div className="space-y-3 text-slate-600">
          <p>We implement multi-layered security protocols to protect your sensitive health information:</p>
          <p><strong>Encryption at Rest:</strong> All medical records and diagnostic images are stored using AES-256 bit encryption.</p>
          <p><strong>Encryption in Transit:</strong> Data transmitted between your device and our servers is protected using TLS 1.3 protocol.</p>
          <p><strong>Access Auditing:</strong> Every instance of data access by a healthcare provider is logged and auditable by the patient.</p>
        </div>
      )
    },
    {
      title: "4. Data Sharing & Third Parties",
      icon: <Eye className="text-primary-600" size={24} />,
      content: (
        <div className="space-y-3 text-slate-600">
          <p><strong>We do not sell your personal or medical data to third parties.</strong> Data is shared only with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your authorized healthcare providers (Doctors, Clinics).</li>
            <li>Emergency responders (only when your Emergency QR is scanned).</li>
            <li>Our secure AI processing partners (OpenAI/Groq) for clinical analysis, where data is processed in a stateless manner.</li>
          </ul>
        </div>
      )
    },
    {
      title: "5. Your Data Rights",
      icon: <Cloud className="text-primary-600" size={24} />,
      content: (
        <div className="space-y-3 text-slate-600">
          <p>Under HIPAA and Global Data Protection regulations, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access and download your entire medical record any time.</li>
            <li>Request corrections to inaccurate personal information.</li>
            <li>Revoke access permissions from specific doctors or medical institutions.</li>
            <li>Request the deletion of your account and all associated personal data (right to be forgotten).</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="group mb-8 flex items-center text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-primary-600 px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
              <p className="text-primary-100 text-lg">Your health data is your property. We just keep it safe.</p>
              <div className="mt-6 inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md">
                Last updated: {lastUpdated}
              </div>
            </div>
          </div>

          {/* Intro */}
          <div className="p-8 border-b border-slate-100">
            <p className="text-slate-600 leading-relaxed">
              At Medisync, we understand that medical privacy is a fundamental human right. 
              This policy describes how we collect, protect, and handle your sensitive clinical 
              information when you use our platform. By using Medisync, you are entrusting 
              us with your health data, and we take that responsibility seriously.
            </p>
          </div>

          {/* Content Sections */}
          <div className="p-8 space-y-12">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-xl">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 ml-1">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Card */}
          <div className="bg-slate-50 p-8 border-t border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Have questions about your privacy?</h3>
                <p className="text-sm text-slate-500">Our Data Protection Officer is here to help.</p>
              </div>
              <a 
                href="mailto:privacy@medisync.health" 
                className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm"
              >
                Contact Privacy Team
              </a>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-xs uppercase tracking-widest font-medium">
          Medisync Clinical Data Protection Initiative &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
