import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, AlertOctagon, UserCheck, Zap, Info } from 'lucide-react';

const AIDisclaimer = () => {
  const navigate = useNavigate();
  const lastUpdated = "April 16, 2026";

  const points = [
    {
      title: "1. Assistive Nature of AI",
      icon: <Bot className="text-indigo-600" size={24} />,
      content: "The artificial intelligence features on Medisync, including automated medical report analysis, clinical summaries, and diagnostic suggestions, are powered by advanced Large Language Models (LLMs). These features are designed to assist healthcare professionals and patients—not to replace them."
    },
    {
      title: "2. Not a Medical Diagnosis",
      icon: <AlertOctagon className="text-red-500" size={24} />,
      content: "AI-generated content is NOT a medical diagnosis, clinical prognosis, or treatment plan. It is a secondary analysis of provided data. You should never change your medication, treatment, or health behavior based solely on AI-generated information."
    },
    {
      title: "3. Physician Review Required",
      icon: <UserCheck className="text-green-600" size={24} />,
      content: "All AI summaries and insights must be verified, signed-off, and validated by a qualified human physician. Clinical decisions should always be based on the doctor's professional judgment, physical examination, and primary diagnostic data."
    },
    {
      title: "4. Technical Limitations & Hallucinations",
      icon: <Zap className="text-amber-500" size={24} />,
      content: "While our models (including Groq and OpenAI integrations) are state-of-the-art, AI is subject to technical limitations. This includes the potential for 'hallucinations'—where the model may generate plausible but medically incorrect or irrelevant information. Users must exercise caution when interpreting automated summaries."
    },
    {
      title: "5. Privacy during AI Processing",
      icon: <Info className="text-indigo-600" size={24} />,
      content: "When clinical data is processed for AI analysis, it is handled using stateless API calls. Our AI partners do not use your personal medical records for training their base models, ensuring your clinical privacy remains intact."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="group mb-8 flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {/* AI Themed Header */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 px-8 py-16 text-white relative overflow-hidden text-center">
            {/* Animated-like background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-20 w-8 h-8 bg-white/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-white/10 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-lg border border-white/20 shadow-inner">
                <Bot size={48} className="text-indigo-300" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">AI Clinical Disclaimer</h1>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
                Understanding the role of Artificial Intelligence in your healthcare journey at Medisync.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {points.map((point, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border border-slate-100 transition-all hover:shadow-md hover:border-indigo-100 ${idx === 0 ? 'md:col-span-2 bg-indigo-50/30' : 'bg-slate-50/50'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      {point.icon}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{point.title}</h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {point.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="p-4 bg-white rounded-2xl shadow-sm shrink-0">
                  <AlertOctagon size={40} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-red-900 mb-2">Critical Safety Confirmation</h3>
                  <p className="text-red-800 text-sm leading-relaxed opacity-90">
                    If you are experiencing a medical emergency, do NOT rely on AI analysis. 
                    Immediately contact emergency services (911/100/102) or go to the 
                    nearest hospital. AI tools on this platform are designed for chronic 
                    data management and elective analysis—not emergency diagnostics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 text-center">
            <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
              By using our AI features, you acknowledge that you have read and accepted this disclaimer.
            </p>
            <button 
              onClick={() => navigate(-1)}
              className="px-10 py-3 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-400 transition-all shadow-lg active:scale-95"
            >
              I Accept & Proceed
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-xs uppercase tracking-widest font-medium">
          Medisync AI Governance Board &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default AIDisclaimer;
