import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Wallet, ArrowUpCircle, Calendar, 
  ArrowLeft, Download, Filter, RefreshCcw, Landmark, CreditCard,
  ChevronRight, Activity, TrendingDown, Target, Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ClinicalFinancials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = async () => {
    try {
      const res = await api.get('doctor/analytics/revenue');
      setRevenueData(res.data);
    } catch (err) {
      console.error("Failed to fetch revenue analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCcw className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  const chartData = Object.entries(revenueData?.history || {}).map(([month, value]) => ({
    month,
    value
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0A1A1A] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="flex items-center gap-6 relative z-10">
              <button 
                onClick={() => navigate(-1)}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all"
              >
                  <ArrowLeft size={20} />
              </button>
              <div className="text-left">
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">
                    Financial <span className="not-italic text-emerald-400">Intelligence</span>
                  </h1>
                  <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-[0.3em] mt-2">Practice Revenue & Growth Analytics</p>
              </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
              <button className="flex items-center gap-2 px-5 py-3 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
                  <Download size={14} /> Export Report
              </button>
              <button 
                onClick={fetchRevenue}
                className="p-3 bg-emerald-500 text-[#0A1A1A] rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                  <RefreshCcw size={18} />
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Primary Metrics Vertical Stack */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><DollarSign size={20} /></div>
                      <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">LIVE</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">₹{revenueData?.total?.toLocaleString() || '0'}</h4>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lifetime Earnings</span>
                  </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Target size={20} /></div>
                      <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Monthly Target</p>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">₹{revenueData?.month?.toLocaleString() || '0'}</h4>
                  <div className="mt-4">
                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">65% of monthly target met</p>
                  </div>
              </div>

              <div className="bg-[#0A1A1A] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                  <Wallet className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-500" size={100} />
                  <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest mb-1">Settlement Status</p>
                  <h4 className="text-2xl font-black text-white">Pending Payout</h4>
                  <p className="text-emerald-400 text-3xl font-black mt-2 tracking-tighter">₹{(revenueData?.total * 0.15).toLocaleString()}</p>
                  <button className="mt-6 w-full py-4 bg-emerald-500 text-[#0A1A1A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                    Initiate Withdrawal
                  </button>
              </div>
          </div>

          {/* Main Visualizations Column */}
          <div className="lg:col-span-3 space-y-8">
              {/* Revenue Over Time */}
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">Clinical Revenue <span className="not-italic text-emerald-500">Dynamics</span></h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly earnings trajectory</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            <ArrowUpCircle size={12} /> +24% growth
                        </div>
                      </div>
                  </div>
                  <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                  dataKey="month" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}}
                                  tickFormatter={(str) => {
                                      const [y, m] = str.split('-');
                                      const date = new Date(y, m-1);
                                      return date.toLocaleString('default', { month: 'short' });
                                  }}
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}}
                                  tickFormatter={(value) => `₹${value >= 1000 ? value/1000 + 'k' : value}`}
                              />
                              <Tooltip 
                                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 800 }}
                                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Earnings']}
                              />
                              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Performance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Earnings Breakdown</h3>
                      <div className="space-y-6">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><Zap size={18} /></div>
                                  <div>
                                      <p className="text-xs font-black text-slate-800 uppercase italic">Today's Intake</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Real-time update</p>
                                  </div>
                              </div>
                              <p className="text-xl font-black text-slate-900">₹{revenueData?.today?.toLocaleString() || '0'}</p>
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><Calendar size={18} /></div>
                                  <div>
                                      <p className="text-xs font-black text-slate-800 uppercase italic">Weekly Volume</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Last 7 calendar days</p>
                                  </div>
                              </div>
                              <p className="text-xl font-black text-slate-900">₹{revenueData?.week?.toLocaleString() || '0'}</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-4">
                        <Landmark className="text-emerald-500" size={24} />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Clinical Ledger Status</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        All clinical payments are processed through our secure gateway. Settlements are initiated every Monday at 00:00 UTC.
                      </p>
                      <button className="mt-6 flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                        View Detailed Ledger <ChevronRight size={14} />
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ClinicalFinancials;
