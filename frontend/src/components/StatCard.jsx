import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  const colorMap = {
    primary: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-100/10',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl border ${selectedColor} transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 italic animate-pulse">
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">{title}</p>
        {subtitle && <p className="text-[9px] text-slate-300 font-medium uppercase tracking-tighter">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
