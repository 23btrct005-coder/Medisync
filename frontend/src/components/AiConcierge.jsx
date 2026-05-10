import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2, RotateCcw,
    Volume2, VolumeX, ArrowDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AiConcierge = () => {
    const { user } = useAuth();
    const { isAiOpen: isOpen, setAiOpen: setIsOpen } = useNotifications();
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('ai_chat_history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing chat history", e);
            }
        }
        return [{ role: 'ai', text: 'Hi! I am your MediSync Clinical Assistant. How can I help you today?' }];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [location, setLocation] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const recognitionRef = useRef(null);

    const loadingMessages = [
        "Analyzing clinical signals...",
        "Identifying diagnostic red flags...",
        "Evaluating institutional risk factors...",
        "Generating evidence-based recommendations...",
        "Finalizing clinical triage report..."
    ];

    useEffect(() => {
        let interval;
        if (isLoading) {
            interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % loadingMessages.length);
            }, 2500);
        } else {
            setLoadingStep(0);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    }, [messages, isOpen, isFullscreen]);

    if (!user) return null;

    const languages = [
        { code: 'en-IN', name: 'English', flag: '🇺🇸' },
        { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
        { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' }
    ];

    const speak = (text) => {
        if (!isVoiceEnabled) return;
        window.speechSynthesis.cancel();
        let cleanText = text.replace(/\[.*?\]\(.*?\)/g, '').replace(/[*_#]/g, '').trim();
        if (!cleanText) return;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = selectedLang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (manualInput) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim() && !imagePreview) return;

        const currentImg = imagePreview;
        setMessages(prev => [...prev, { role: 'user', text: textToSend, image: currentImg }]);
        setInput('');
        setImagePreview(null);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { 
                message: textToSend,
                location: location ? `${location.lat},${location.lng}` : null,
                history: messages.slice(-10),
                imageData: currentImg
            });
            const aiMsg = { role: 'ai', text: res.data.response };
            setMessages(prev => [...prev, aiMsg]);
            speak(res.data.response);
        } catch (error) {
            console.error("AI Error", error);
            setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to Clinical Brain. Please ensure you are authorized.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => toast.error("Location access denied")
        );
    };

    const resetChat = () => {
        if (window.confirm("Reset clinical context?")) {
            setMessages([{ role: 'ai', text: 'MediSync Node Reset. How can I assist today?' }]);
            localStorage.removeItem('ai_chat_history');
        }
    };

    const parseAiResponse = (text) => {
        try {
            // Backend now sends structured JSON
            const data = JSON.parse(text);
            
            // Extract mapUrl from clinicalAssessment or explanation if present
            const mapMatch = (data.clinicalAssessment + " " + data.explanation).match(/https:\/\/(www\.google\.com\/maps|maps\.app\.goo\.gl)[^ \n)\]]*/);
            const mapUrl = mapMatch ? mapMatch[0].replace(/\.$/, '') : null;

            // Map keys to frontend expectation
            return {
                assessment: data.clinicalAssessment || '',
                possibleConditions: (data.possibleConditions || []).join(', '),
                riskIndicators: (data.riskIndicators || []).join(', '),
                severity: data.triageLevel || 'LOW',
                specialist: data.recommendedSpecialist || '',
                action: (data.suggestedNextSteps || []).join('. '),
                questions: data.followUpQuestions || [],
                warning: data.emergencyWarning || '',
                service: data.requiresAmbulance ? 'Ambulance Services' : '',
                mapUrl,
                confidence: data.confidenceScore || 0,
                explanation: data.explanation || '',
                abnormalFindings: data.abnormalFindings || []
            };
        } catch (e) {
            console.error("Clinical JSON parsing failure, falling back to legacy structure", e);
            return {
                assessment: text,
                severity: 'LOW',
                questions: [],
                mapUrl: null
            };
        }
    };

    const getSeverityStyles = (severity) => {
        const s = severity.toUpperCase();
        if (s.includes('CRITICAL') || s.includes('EMERGENCY')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle className="text-red-500" size={14} />, label: 'CRITICAL' };
        if (s.includes('HIGH')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: <AlertCircle className="text-orange-500" size={14} />, label: 'HIGH' };
        if (s.includes('MODERATE')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="text-amber-500" size={14} />, label: 'MODERATE' };
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="text-emerald-500" size={14} />, label: 'LOW' };
    };

    if (!user) return null;

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[3000]">
            <style>{`
                .ai-orb {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
                    box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.5),
                                inset 0 0 20px rgba(255, 255, 255, 0.3);
                    position: relative;
                }
                .ai-orb::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    border-radius: inherit;
                    background: inherit;
                    filter: blur(10px);
                    opacity: 0.4;
                    z-index: -1;
                    animation: orb-pulse 3s infinite;
                }
                @keyframes orb-pulse {
                    0% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.2); opacity: 0.2; }
                    100% { transform: scale(1); opacity: 0.4; }
                }
                .mobile-full-chat {
                    height: 100dvh !important;
                    width: 100vw !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    border-radius: 0 !important;
                }
                @media (max-width: 768px) {
                    .ai-concierge-window {
                        height: 100dvh !important;
                        width: 100vw !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-8 right-8 bg-[#F8FAFC] rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden pointer-events-auto border border-white/50 z-[3000] ai-concierge-window"
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, y: 0, scale: 1,
                            width: isFullscreen ? 'min(1200px, calc(100vw - 32px))' : (window.innerWidth < 768 ? '100vw' : '420px'),
                            height: isFullscreen ? 'calc(100vh - 32px)' : (window.innerWidth < 768 ? '100dvh' : '720px'),
                            bottom: (window.innerWidth < 768) ? 0 : 32,
                            right: (window.innerWidth < 768) ? 0 : 32,
                            borderRadius: (window.innerWidth < 768) ? 0 : 32
                        }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    >
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900 text-sm tracking-tight">Clinical Assistant</h2>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Node • v5.0</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
                                    className={`p-2 rounded-xl transition-all ${isVoiceEnabled ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50'}`}
                                    title={isVoiceEnabled ? "Turn off AI Voice" : "Turn on AI Voice"}
                                >
                                    {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>
                                <button onClick={resetChat} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><RotateCcw size={16} /></button>
                                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div 
                            ref={scrollRef} 
                            className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar relative"
                            onScroll={(e) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                                const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
                                setShowScrollBottom(!isAtBottom);
                            }}
                        >
                            {messages.map((m, i) => {
                                if (m.role === 'user') {
                                    return (
                                        <div key={i} className="flex flex-col gap-2 items-end">
                                            {m.image && <img src={m.image} className="w-48 rounded-2xl border-2 border-white shadow-lg mb-1" />}
                                            <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-none text-sm font-medium shadow-lg shadow-indigo-100 max-w-[85%]">
                                                {m.text}
                                            </div>
                                        </div>
                                    );
                                }

                                const s = parseAiResponse(m.text);
                                const ui = getSeverityStyles(s.severity);

                                return (
                                    <div key={i} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Stethoscope size={16} className="text-indigo-600" />
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Assessment</span>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                {s.assessment || s.other}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className={`p-4 rounded-2xl border ${ui.bg} ${ui.border} flex flex-col gap-1`}>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">TRIAGE LEVEL</span>
                                                    <span className={`text-xs font-black ${ui.color}`}>{ui.label}</span>
                                                </div>
                                                {s.specialist && (
                                                    <div className="p-4 rounded-2xl border border-slate-50 bg-slate-50/50 flex flex-col gap-1">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">RECOMMENDED SPECIALIST</span>
                                                        <span className="text-xs font-black text-slate-700 truncate">{s.specialist}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {s.action && (
                                                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">SUGGESTED NEXT STEPS</span>
                                                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">{s.action}</p>
                                                </div>
                                            )}

                                            {s.possibleConditions && (
                                                <div className="p-4 bg-indigo-50/50 rounded-2xl space-y-2 border border-indigo-100/50">
                                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">POSSIBLE CONDITIONS</span>
                                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{s.possibleConditions}</p>
                                                </div>
                                            )}

                                            {s.riskIndicators && (
                                                <div className="p-4 bg-amber-50/50 rounded-2xl space-y-2 border border-amber-100/50">
                                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">RISK INDICATORS</span>
                                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{s.riskIndicators}</p>
                            {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-8 group`}>
                                        <div className={`max-w-[85%] rounded-[24px] ${
                                            msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white p-4 shadow-lg shadow-indigo-100 rounded-tr-none' 
                                            : 'bg-white border border-slate-100 shadow-sm p-6 rounded-tl-none'
                                        }`}>
                                            {msg.role === 'user' ? (
                                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                            ) : (
                                                <div className="space-y-6">
                                                    {(() => {
                                                        const s = parseAiResponse(msg.content);
                                                        const severity = getSeverityStyles(s.severity);
                                                        return (
                                                            <>
                                                                {/* Enterprise Header */}
                                                                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-50">
                                                                    <div className={`px-3 py-1.5 rounded-full ${severity.bg} ${severity.text} ${severity.border} border text-[10px] font-black uppercase tracking-wider flex items-center gap-2`}>
                                                                        {severity.icon} {severity.label} TRIAGE
                                                                    </div>
                                                                    {s.confidence > 0 && (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${s.confidence * 100}%` }} />
                                                                            </div>
                                                                            <span className="text-[9px] font-bold text-slate-400">{(s.confidence * 100).toFixed(0)}% Certainty</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Clinical Assessment */}
                                                                <div className="space-y-2">
                                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <Activity size={12} className="text-indigo-500" /> Clinical Assessment
                                                                    </h4>
                                                                    <p className="text-sm font-semibold text-slate-700 leading-relaxed italic border-l-2 border-indigo-100 pl-4">
                                                                        {s.assessment}
                                                                    </p>
                                                                </div>

                                                                {/* Reasoning Card */}
                                                                {s.explanation && (
                                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Reasoning</h4>
                                                                        <p className="text-xs text-slate-600 leading-relaxed">{s.explanation}</p>
                                                                    </div>
                                                                )}

                                                                {/* Risk & Conditions */}
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    {s.possibleConditions && (
                                                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                                                            <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Possible Conditions</h4>
                                                                            <p className="text-xs font-bold text-indigo-700">{s.possibleConditions}</p>
                                                                        </div>
                                                                    )}
                                                                    {s.riskIndicators && (
                                                                        <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                                                                            <h4 className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">Risk Indicators</h4>
                                                                            <p className="text-xs font-bold text-rose-700">{s.riskIndicators}</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Abnormal Findings */}
                                                                {s.abnormalFindings && s.abnormalFindings.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Abnormal Findings Detected</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {s.abnormalFindings.map((f, i) => (
                                                                                <span key={i} className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-100">{f}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Follow-up Questions */}
                                                                {s.questions.length > 0 && (
                                                                    <div className="space-y-3 pt-2">
                                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Refinement Questions</h4>
                                                                        <div className="space-y-2">
                                                                            {s.questions.map((q, idx) => (
                                                                                <button 
                                                                                    key={idx}
                                                                                    onClick={() => {
                                                                                        setInput(q);
                                                                                        handleSend(q);
                                                                                    }}
                                                                                    className="w-full text-left p-3 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between group/q"
                                                                                >
                                                                                    {q} <ChevronRight size={14} className="opacity-0 group-hover/q:opacity-100 transition-all text-indigo-500" />
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Emergency Alert */}
                                                                {s.warning && (
                                                                    <div className="p-4 bg-red-600 text-white rounded-2xl flex items-start gap-3 animate-pulse shadow-xl shadow-red-200">
                                                                        <AlertCircle size={20} className="shrink-0" />
                                                                        <p className="text-[11px] font-black leading-tight uppercase tracking-wide">{s.warning}</p>
                                                                    </div>
                                                                )}

                                                                {/* Mapping & Booking Nodes */}
                                                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                                                    {s.mapUrl && (
                                                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                                                                    <MapPin size={16} className="text-indigo-600" />
                                                                                </div>
                                                                                <div className="overflow-hidden">
                                                                                    <div className="text-[10px] font-black text-slate-400 uppercase truncate">Clinical Navigation Node</div>
                                                                                    <div className="text-[8px] text-slate-500 truncate">{s.mapUrl}</div>
                                                                                </div>
                                                                            </div>
                                                                            <a href={s.mapUrl} target="_blank" className="px-3 py-2 bg-white text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all shrink-0">Launch</a>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex gap-2">
                                                                        {(s.severity === 'CRITICAL' || s.severity === 'HIGH' || s.service === 'Ambulance Services') && (
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setIsOpen(false);
                                                                                    navigate('/dashboard/booking?mode=service&service=Ambulance Services');
                                                                                }}
                                                                                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                            >
                                                                                <Activity size={16} /> Urgent Ambulance
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => {
                                                                                setIsOpen(false);
                                                                                let url = '/dashboard/booking';
                                                                                if (s.service) {
                                                                                    url = `/dashboard/booking?mode=service&service=${encodeURIComponent(s.service)}`;
                                                                                } else if (s.specialist) {
                                                                                    url = `/dashboard/booking?mode=service&service=${encodeURIComponent(s.specialist)}`;
                                                                                }
                                                                                navigate(url);
                                                                                toast.success(`Navigating to ${s.service || s.specialist || 'Clinical'} Node`);
                                                                            }}
                                                                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                        >
                                                                            Secure Clinical Booking <ChevronRight size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-[280px] animate-pulse">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: `${d * 0.2}s` }}></div>)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{loadingMessages[loadingStep]}</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Scroll to Bottom Sync Button */}
                        <AnimatePresence>
                            {showScrollBottom && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                                    className="absolute bottom-32 right-8 p-3 bg-white/90 backdrop-blur-md border border-slate-200 text-indigo-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-[3005]"
                                >
                                    <ArrowDown size={20} />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="relative flex items-center gap-2">
                                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 focus-within:border-indigo-300 focus-within:bg-white transition-all">
                                    <label className="p-2 text-slate-400 hover:text-indigo-600 cursor-pointer">
                                        <Paperclip size={20} />
                                        <input type="file" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask a medical question..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-700 px-2 py-3"
                                    />
                                    <button onClick={() => isListening ? stopListening() : startListening()} className={`p-2 rounded-xl transition-all ${isListening ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-indigo-600'}`}>
                                        <Mic size={20} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleSend()}
                                    disabled={isLoading || (!input.trim() && !imagePreview)}
                                    className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <SendHorizontal size={22} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default AiConcierge;
