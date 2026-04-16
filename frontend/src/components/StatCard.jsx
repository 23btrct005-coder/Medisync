import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorMap = {
    primary: 'text-primary-600 bg-primary-50 border-primary-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl border ${selectedColor}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
        <p className="text-sm font-bold text-slate-500">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
