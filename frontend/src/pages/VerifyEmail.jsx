import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import { Mail, ShieldCheck, Activity, ArrowRight, Lock, Key, Eye, EyeOff } from 'lucide-react';

const VerifyEmail = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('VERIFY_OTP'); // 'VERIFY_OTP' or 'SET_PASSWORD'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendCount, setResendCount] = useState(() => {
        return parseInt(localStorage.getItem(`resend_count_${user?.id}`) || '0');
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if ((user.user?.emailVerified || user.emailVerified) && step === 'VERIFY_OTP') {
            const role = localStorage.getItem('role');
            if (role === 'ROLE_DOCTOR') navigate('/doctor-dashboard');
            else if (role === 'ROLE_HOSPITAL_ADMIN') navigate('/hospital-dashboard');
            else navigate('/dashboard');
        }
    }, [user, navigate, step]);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSendOTP = async () => {
        if (resendTimer > 0) return;
        
        setSending(true);
        try {
            await api.post('/auth/request-otp', { email: user.email || user.user?.email });
            toast.success("Verification code sent to your professional email.");
            
            let nextWait = 30;
            if (resendCount === 1) nextWait = 60;
            else if (resendCount >= 2) nextWait = 120;
            
            setResendTimer(nextWait);
            const nextCount = resendCount + 1;
            setResendCount(nextCount);
            localStorage.setItem(`resend_count_${user?.id}`, nextCount);
            
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
            setStep('SET_PASSWORD');
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/update-password', { newPassword });
            toast.success("Password updated successfully!");
            await refreshUser();
            const role = localStorage.getItem('role');
            if (role === 'ROLE_DOCTOR') navigate('/doctor-dashboard');
            else if (role === 'ROLE_HOSPITAL_ADMIN') navigate('/hospital-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update password.");
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
                        <h2 className="text-2xl font-black uppercase tracking-tight italic">
                            {step === 'VERIFY_OTP' ? 'Verify ' : 'Set '} 
                            <span className="not-italic text-primary">{step === 'VERIFY_OTP' ? 'Identity' : 'Password'}</span>
                        </h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 leading-none">Institutional Security Protocol</p>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {step === 'VERIFY_OTP' && (
                        <>
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
                                        disabled={sending || resendTimer > 0}
                                        className="w-full py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {sending ? <Activity className="animate-spin" size={14} /> : <Mail size={14} />}
                                        {sending ? "Sending Code..." : resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Verification Code"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                    
                    {step === 'SET_PASSWORD' && (
                        <>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-bold text-slate-700">Set New Password</p>
                                <p className="text-xs text-slate-400 font-medium px-4">
                                    Please set a secure password for your account to replace the default institutional password.
                                </p>
                            </div>

                            <form onSubmit={handleSetPassword} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="New Password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-14 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm New Password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-14 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loading || !newPassword || !confirmPassword}
                                    className="w-full py-5 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Activity className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                                    {loading ? "Updating..." : "Update Password & Proceed"}
                                </button>
                            </form>
                        </>
                    )}

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

