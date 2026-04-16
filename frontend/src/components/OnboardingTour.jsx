import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ShieldCheck, Sparkles, QrCode, HeartPulse } from 'lucide-react';

const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('medisync_tour_seen');
    if (!hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1500);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to Medisync",
      description: "Experience the next generation of healthcare. Your clinical records are now securely isolated and AI-enhanced.",
      icon: <HeartPulse className="text-primary" size={48} />,
      color: "bg-primary/10"
    },
    {
      title: "Advanced Security",
      description: "We've enabled Row Level Security (RLS) at the database layer. Every byte of your data is cryptographically isolated to your identity.",
      icon: <ShieldCheck className="text-emerald-500" size={48} />,
      color: "bg-emerald-50"
    },
    {
      title: "Emergency QR",
      description: "Your critical data is available in seconds for emergency responders via your personal QR code. Scan-ready for high-stakes moments.",
      icon: <QrCode className="text-indigo-500" size={48} />,
      color: "bg-indigo-50"
    },
    {
      title: "Clinical Assistant",
      description: "Discuss your lab results and imaging findings in real-time with our Clinical AI Assistant. Complex medical terms, simplified.",
      icon: <Sparkles className="text-purple-500" size={48} />,
      color: "bg-purple-50"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('medisync_tour_seen', 'true');
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <button onClick={handleClose} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center space-y-6">
          <div className={`w-24 h-24 ${step.color} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-float`}>
            {step.icon}
          </div>

          <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-900 leading-tight">{step.title}</h2>
             <p className="text-slate-500 font-medium leading-relaxed">{step.description}</p>
          </div>

          <div className="pt-8 flex flex-col gap-4">
            <button 
              onClick={handleNext}
              className="btn-premium bg-primary text-white w-full py-4 text-md group"
            >
              {currentStep === steps.length - 1 ? 'Start Healthcare Journey' : 'Learn More'}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex justify-center gap-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
