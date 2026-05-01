import React from 'react';
import { Check, Circle } from 'lucide-react';

const OnboardingProgress = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between w-full mb-12 px-2">
      {steps.map((step, idx) => {
        const stepNumber = idx + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center relative group">
              <div 
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 z-10 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' 
                    : isActive 
                      ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-110' 
                      : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <span className="text-sm font-black">{stepNumber}</span>}
              </div>
              <span className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                isActive ? 'text-primary' : 'text-slate-400'
              }`}>
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-4 bg-slate-100 relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-emerald-500 transition-all duration-700 ease-in-out origin-left"
                  style={{ transform: `scaleX(${isCompleted ? 1 : 0})` }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OnboardingProgress;
