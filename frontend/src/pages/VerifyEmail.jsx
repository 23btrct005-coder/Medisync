import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import { Mail, ShieldCheck, Activity, ArrowRight, Lock, Key } from 'lucide-react';

const VerifyEmail = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.user?.emailVerified || user.emailVerified) {
            const role = localStorage.getItem('role');
            if (role === 'ROLE_DOCTOR') navigate('/doctor-dashboard');
            else if (role === 'ROLE_HOSPITAL_ADMIN') navigate('/hospital-dashboard');
            else navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSendOTP = async () => {
        setSending(true);
        try {
            await api.post('/auth/request-otp', { email: user.email || user.user?.email });
            toast.success("Verification code sent to your professional email.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send code.");
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/verify-email', { 
                email: user.email || user.user?.email, 
                otp: otp 
            });
            toast.success("Identity verified successfully!");
            await refreshUser();
            const role = localStorage.getItem('role');
            if (role === 'ROLE_DOCTOR') navigate('/doctor-dashboard');
            else if (role === 'ROLE_HOSPITAL_ADMIN') navigate('/hospital-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-10 bg-slate-900 text-white text-center relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-12 -mb-12 blur-2xl" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                            <ShieldCheck size={40} className="text-primary animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight italic">Verify <span className="not-italic text-primary">Identity</span></h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 leading-none">Institutional Security Protocol</p>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="text-center space-y-2">
                        <p className="text-sm font-bold text-slate-700">Verification Required</p>
                        <p className="text-xs text-slate-400 font-medium px-4">
                            To activate your professional clinical node, please verify the email associated with your institutional profile.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                            <Mail size={14} className="text-primary" />
                            <span className="text-xs font-black text-slate-600 truncate max-w-[200px]">
                                {user?.email || user?.user?.email}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                <Key size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Enter 6-digit Code"
                                maxLength="6"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl text-lg font-black tracking-[0.5em] focus:border-primary focus:bg-white transition-all outline-none text-center"
                            />
                        </div>

                        <div className="space-y-4">
                            <button 
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full py-5 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-3"
                            >
                                {loading ? <Activity className="animate-spin" size={18} /> : <Lock size={18} />}
                                {loading ? "Verifying Credentials..." : "Finalize Verification"}
                            </button>

                            <button 
                                type="button"
                                onClick={handleSendOTP}
                                disabled={sending}
                                className="w-full py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2"
                            >
                                {sending ? <Activity className="animate-spin" size={14} /> : <Mail size={14} />}
                                {sending ? "Sending Code..." : "Resend Verification Code"}
                            </button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
                        <p className="text-[10px] text-slate-400 font-medium italic text-center leading-relaxed">
                            Need help? Contact institutional IT support if you cannot access this email address.
                        </p>
                        <button 
                            onClick={logout}
                            className="text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                        >
                            Log out & Change Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
