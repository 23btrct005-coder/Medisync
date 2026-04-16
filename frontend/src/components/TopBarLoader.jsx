import React from 'react';

const TopBarLoader = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100 overflow-hidden">
      <div 
        className="h-full bg-primary-600 shadow-[0_0_10px_rgba(14,165,233,0.7)]" 
        style={{
            width: '50%',
            animation: 'topbar-loading 1.5s infinite ease-in-out'
        }} 
      />
      <style>{`
        @keyframes topbar-loading {
          0% { transform: translateX(-100%); width: 20%; }
          50% { width: 60%; }
          100% { transform: translateX(300%); width: 20%; }
        }
      `}</style>
    </div>
  );
};

export default TopBarLoader;
