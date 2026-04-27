import React, { useState } from 'react';
import { Wallet, QrCode, Shield, Download, Smartphone, Info, User, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const HealthWallet = () => {
    const { user } = useAuth();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        const walletCard = document.getElementById('clinical-identity-node');
        if (!walletCard) {
            toast.error("Identity node not found for export");
            return;
        }

        setIsDownloading(true);
        const loadToast = toast.loading("Generating Secure PDF...");
        
        try {
            const canvas = await html2canvas(walletCard, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f172a', // Match card background
                borderRadius: 48
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`MediSync_Wallet_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            
            toast.success("Identity Card exported successfully", { id: loadToast });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Failed to generate secure PDF", { id: loadToast });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        Health <span className="not-italic text-primary">Wallet</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Immutable Identity & Emergency Persistence</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WALLET CARD */}
                <div id="clinical-identity-node" className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32 transition-all group-hover:scale-125" />
                    
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-12">
                            <div className="w-16 h-10 bg-white/10 rounded-lg backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Activity size={24} className="text-primary" />
                            </div>
                            <Shield className="text-primary/50" size={32} />
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Clinical Identity Node</p>
                            <h2 className="text-3xl font-black tracking-tight mb-8 truncate uppercase">{user?.name || 'Patient'}</h2>
                            
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Emergency ID</p>
                                    <p className="font-mono text-sm tracking-widest">{user?.patientId || 'MS-XXXX'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Blood Group</p>
                                    <p className="text-lg font-black text-primary">{user?.bloodGroup || 'O+'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR NODE */}
                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-50/50 -z-10" />
                    <div className="p-6 bg-white rounded-[2rem] shadow-xl border border-slate-100">
                        <QRCode 
                            value={`${window.location.origin}/emergency/${user?.patientId}`}
                            size={180}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1 italic">Emergency Pulse QR</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Scan for instant clinical brief</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={handleDownload}
                  className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-primary transition-all group"
                >
                    <Download className={`text-slate-400 group-hover:text-primary transition-colors ${isDownloading ? 'animate-bounce' : ''}`} size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Download Offline PDF</span>
                </button>
                
                <div className="md:col-span-2 bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg">
                        <Smartphone size={32} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Native PWA Persistence</h4>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                            Install Medisync on your home screen to access your Health Wallet even during complete network failure.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-amber-50 border border-amber-100 rounded-[2.5rem] p-10 flex items-start gap-6">
                <AlertCircle className="text-amber-600 shrink-0" size={32} />
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Emergency Protocols</h3>
                    <ul className="text-[11px] font-bold text-slate-600 space-y-2 uppercase tracking-tight">
                        <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-amber-600 rounded-full" />
                            This QR code grants one-time emergency access to doctors without MFA.
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-amber-600 rounded-full" />
                            Every scan is logged in your immutable Security Ledger immediately.
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-amber-600 rounded-full" />
                            Valid for hospital admissions and first responder verification.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HealthWallet;
