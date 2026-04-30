import React, { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Thermometer, Droplets, Zap, Clock, Info, ShieldCheck, Plus, X, Loader2 } from 'lucide-react';
import api from '../api/axiosConfig';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const ClinicalVitals = () => {
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const stompClientRef = useRef(null);

    useEffect(() => {
        const fetchVitals = async () => {
            try {
                const res = await api.get('/patient/vitals');
                setTelemetry(res.data || []);
            } catch (err) {
                console.error("Failed to fetch telemetry");
                setTelemetry([]);
            } finally {
                setLoading(false);
            }
        };
        fetchVitals();

        // Establish Real-Time WebSocket Connection
        const token = localStorage.getItem('token');
        const socket = new SockJS(`${api.defaults.baseURL.replace('/api', '')}/ws`);
        const client = Stomp.over(socket);
        client.debug = null; // Quiet mode

        client.connect({ Authorization: `Bearer ${token}` }, () => {
            client.subscribe('/user/queue/vitals', (message) => {
                const newPulse = JSON.parse(message.body);
                setTelemetry(prev => {
                    const updated = [...prev, newPulse].slice(-10); // Keep last 10 for chart
                    return updated;
                });
            });
        });

        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
        };
    }, []);

    const handleLogVitals = async (data) => {
        try {
            await api.post('/patient/vitals/log', data);
            const res = await api.get('/patient/vitals');
            setTelemetry(res.data || []);
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to log vitals", err);
        }
    };

    const currentData = telemetry.length > 0 ? telemetry : [
        { hr: 0, temp: 0, spo2: 0, date: 'N/A' }
    ];

    const VitalCard = ({ title, value, unit, icon: Icon, color, trend }) => (
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl -mr-10 -mt-10 ${color}`} />
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${color.replace('bg-', 'bg-').replace('-500', '-50')} ${color.replace('bg-', 'text-')}`}>
                    <Icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current</span>
                    <div className="flex items-center gap-1 text-emerald-500">
                        <Zap size={12} />
                        <span className="text-[10px] font-bold uppercase">{trend}</span>
                    </div>
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
                    {value} <span className="text-sm text-slate-400 font-bold uppercase">{unit}</span>
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Monitoring</span>
                   </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        CLINICAL <span className="text-primary not-italic">TELEMTRY</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Real-time vital sign intelligence dashboard</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_20px_-5px_rgba(59,130,246,0.5)] hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> Log Vitals
                    </button>
                    <button className="px-6 py-3 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-50 shadow-sm transition-all">Export Logs</button>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Log Manual Vitals</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Enter your current physiological readings</p>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            handleLogVitals({
                                hr: parseFloat(fd.get('hr')),
                                temp: parseFloat(fd.get('temp')),
                                spo2: parseFloat(fd.get('spo2')),
                                respiratoryRate: parseFloat(fd.get('respiratoryRate') || 16)
                            });
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Heart Rate (bpm)</label>
                                    <input name="hr" type="number" step="0.1" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="e.g. 72" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Body Temp (°C)</label>
                                    <input name="temp" type="number" step="0.1" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="e.g. 36.6" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Blood Oxygen (%)</label>
                                    <input name="spo2" type="number" step="0.1" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="e.g. 98" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Respiratory (br/m)</label>
                                    <input name="respiratoryRate" type="number" step="1" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="e.g. 16" />
                                </div>
                            </div>
                            
                            <button type="submit" className="w-full py-5 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                                Synchronize Data
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <VitalCard title="Heart Rate" value={currentData[currentData.length-1].hr || 72} unit="bpm" icon={Heart} color="bg-rose-500" trend="Stable" />
                <VitalCard title="Body Temp" value={currentData[currentData.length-1].temp || 36.6} unit="°C" icon={Thermometer} color="bg-orange-500" trend="Normal" />
                <VitalCard title="Blood Oxygen" value={currentData[currentData.length-1].spo2 || 98} unit="%" icon={Droplets} color="bg-blue-500" trend="Optimal" />
                <VitalCard title="Respiratory" value={16} unit="br/m" icon={Activity} color="bg-indigo-500" trend="Ideal" />
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[3rem] p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Vital Sign Trends</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 24 hours of telemetry data</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Heart Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SpO2</span>
                        </div>
                    </div>
                </div>

                {/* PREMIUM SVG CHART */}
                <div className="h-64 w-full relative">
                    {telemetry.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <Activity size={48} className="mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No telemetry data recorded yet</p>
                            <button onClick={() => setIsModalOpen(true)} className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Log your first vitals</button>
                        </div>
                    ) : (
                        <>
                        <svg viewBox="0 0 1000 200" className="w-full h-full preserve-3d overflow-visible">
                            {/* Grid Lines */}
                            {[0, 50, 100, 150, 200].map(y => (
                                <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                            ))}

                            {/* Heart Rate Path (Rose) */}
                            <path
                                d={`M 0 ${200 - currentData[0].hr} ${currentData.map((d, i) => `L ${(i * 1000) / (currentData.length - 1)} ${200 - d.hr}`).join(' ')}`}
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-[0_4px_10px_rgba(244,63,94,0.3)]"
                            />
                            
                            {/* SpO2 Path (Blue) */}
                            <path
                                d={`M 0 ${200 - (currentData[0].spo2 || 0) * 2} ${currentData.map((d, i) => `L ${(i * 1000) / (currentData.length - 1)} ${200 - (d.spo2 || 0) * 2}`).join(' ')}`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)]"
                            />

                            {/* Data Points */}
                            {currentData.map((d, i) => (
                                <g key={i}>
                                    <circle 
                                        cx={(i * 1000) / (currentData.length - 1)} 
                                        cy={200 - d.hr} 
                                        r="6" 
                                        fill="#fff" 
                                        stroke="#f43f5e" 
                                        strokeWidth="3" 
                                        className="cursor-pointer hover:r-8 transition-all"
                                    />
                                </g>
                            ))}
                        </svg>

                        <div className="flex justify-between mt-8">
                            {currentData.map((d, i) => (
                                <span key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-primary" size={28} />
                            <h3 className="text-xl font-black uppercase tracking-tight italic">Biometric <span className="not-italic text-primary">Verification</span></h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md font-medium">All telemetry data is secured via end-to-end clinical encryption. Your physician receives instant alerts for abnormal physiological thresholds.</p>
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                                        <Activity size={16} className="text-slate-500" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Linked with 3 diagnostic nodes</p>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-500 rounded-[3rem] p-10 text-white relative flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Info size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tight leading-none">Diagnostic<br/>Brief</h3>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Normal range sustained</p>
                    </div>
                    <button className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Analysis History</button>
                </div>
            </div>
        </div>
    );
};

export default ClinicalVitals;
