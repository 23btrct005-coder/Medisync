import React from 'react';
import { 
  Building2, MapPin, Activity, ShieldCheck, 
  Users, Droplets, Phone, Globe, ExternalLink 
} from 'lucide-react';
import { motion } from 'framer-motion';

const InstitutionalNodeCard = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl animate-pulse">
        <div className="flex gap-4 mb-8">
           <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
           <div className="space-y-2 py-2">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-50 rounded" />
           </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="h-20 bg-slate-50 rounded-2xl" />
           <div className="h-20 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats || !stats.isInstitutional) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
    >
      {/* Decorative background */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#0A1A1A] text-emerald-400 rounded-[1.5rem] shadow-xl shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
              <Building2 size={28} />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {stats.hospitalName}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <MapPin size={12} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {stats.location}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Linked Institutional Node
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-100 transition-colors group/item">
            <Activity size={18} className="text-emerald-500 mb-3 group-hover/item:scale-110 transition-transform" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Facility Status</p>
            <p className="text-sm font-black text-slate-800">{stats.emergencyStatus}</p>
          </div>
          
          <div className="p-5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 transition-colors group/item">
            <ShieldCheck size={18} className="text-blue-500 mb-3 group-hover/item:scale-110 transition-transform" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Beds</p>
            <p className="text-sm font-black text-slate-800">{stats.totalBeds} Units</p>
          </div>

          <div className="p-5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-100 transition-colors group/item">
            <Users size={18} className="text-indigo-500 mb-3 group-hover/item:scale-110 transition-transform" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinical Staff</p>
            <p className="text-sm font-black text-slate-800">{stats.nurseCount + (stats.staffCount || 0)} Members</p>
          </div>

          <div className="p-5 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-100 transition-colors group/item">
            <Droplets size={18} className="text-amber-500 mb-3 group-hover/item:scale-110 transition-transform" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Care</p>
            <p className="text-sm font-black text-slate-800">{stats.icuBeds} ICU Nodes</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
           <div className="flex gap-4">
              <button className="p-3 bg-slate-100 hover:bg-[#0A1A1A] hover:text-white rounded-xl transition-all text-slate-500">
                <Phone size={16} />
              </button>
              <button className="p-3 bg-slate-100 hover:bg-[#0A1A1A] hover:text-white rounded-xl transition-all text-slate-500">
                <Globe size={16} />
              </button>
           </div>
           
           <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all group/btn">
              Institutional Registry <ExternalLink size={12} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InstitutionalNodeCard;
