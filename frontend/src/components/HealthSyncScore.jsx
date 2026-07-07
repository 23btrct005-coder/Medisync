import React, { useMemo } from 'react';
import { ShieldCheck, Trophy, Target, Zap, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HealthSyncScore = ({ user }) => {
  const scoreData = useMemo(() => {
    if (!user) return { score: 0, level: 'Bronze', nextMilestone: 'Complete Profile' };
    
    let points = 0;
    const weights = {
      bloodGroup: 10,
      emergencyContactPhone: 15,
      allergies: 10,
      insuranceProvider: 10,
      phone: 5,
      dateOfBirth: 5,
      gender: 5,
      existingDiseases: 10,
      currentMedications: 10,
      pastSurgeries: 10,
      smokingStatus: 5,
      alcoholStatus: 5
    };

    Object.keys(weights).forEach(key => {
      if (user[key] && user[key] !== 'None reported' && user[key] !== 'Not provided') {
        points += weights[key];
      }
    });

    const score = Math.min(points, 100);
    let level = 'Bronze';
    let color = 'text-orange-500';
    let bgColor = 'bg-orange-50';
    let borderColor = 'border-orange-100';

    if (score >= 90) {
      level = 'Diamond';
      color = 'text-indigo-600';
      bgColor = 'bg-indigo-50';
      borderColor = 'border-indigo-100';
    } else if (score >= 70) {
      level = 'Gold';
      color = 'text-amber-500';
      bgColor = 'bg-amber-50';
      borderColor = 'border-amber-100';
    } else if (score >= 40) {
      level = 'Silver';
      color = 'text-slate-500';
      bgColor = 'bg-slate-50';
      borderColor = 'border-slate-100';
    }

    return { score, level, color, bgColor, borderColor };
  }, [user]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scoreData.score / 100) * circumference;
  const navigate = useNavigate();

  const getNextTier = (level) => {
    switch(level) {
      case 'Bronze': return 'Silver Tier';
      case 'Silver': return 'Gold Tier';
      case 'Gold': return 'Diamond Tier';
      default: return 'Mastery';
    }
  };

  return (
    <div className={`bg-white rounded-[2rem] shadow-xl p-6 border-2 ${scoreData.borderColor} relative overflow-hidden group transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Sync Integrity</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${scoreData.bgColor} ${scoreData.color}`}>
              {scoreData.level} Tier
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rank</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${scoreData.bgColor} ${scoreData.color}`}>
          <Trophy size={24} />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              className={`transition-all duration-1000 ease-out ${scoreData.color.replace('text', 'stroke')}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${scoreData.color}`}>{scoreData.score}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Health Sync</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">Security Masking</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Active RLS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">Engagement Velocity</p>
              <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-1">High Speed</p>
            </div>
          </div>
        </div>
      </div>

      {scoreData.score < 100 && (
        <button 
          onClick={() => navigate('/dashboard/profile/edit')}
          className="w-full mt-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 group"
        >
          Complete Profile for {getNextTier(scoreData.level)}
          <Zap size={12} className="group-hover:fill-current" />
        </button>
      )}

      {/* Decorative pulse background */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <HeartPulse size={120} />
      </div>
    </div>
  );
};

export default HealthSyncScore;
