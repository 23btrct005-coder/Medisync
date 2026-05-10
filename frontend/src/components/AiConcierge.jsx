import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2, RotateCcw,
    Volume2, VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AiConcierge = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
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
    const [isListening, setIsListening] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [location, setLocation] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);
    const [orbPosition, setOrbPosition] = useState(() => {
        const saved = localStorage.getItem('ai_orb_position_v3');
        if (saved) {
            try { 
                const pos = JSON.parse(saved);
                // Sanitize: ensure not off-screen
                if (pos.x < -window.innerWidth) pos.x = 0;
                if (pos.y < -window.innerHeight) pos.y = 0;
                return pos;
            } catch (e) { return { x: 0, y: 0 }; }
        }
        return { x: 0, y: 0 };
    });

    useEffect(() => {
        dragX.set(orbPosition.x);
        dragY.set(orbPosition.y);
    }, [orbPosition.x, orbPosition.y]); // Ensure sync on load

    useEffect(() => {
        localStorage.setItem('ai_orb_position_v3', JSON.stringify(orbPosition));
    }, [orbPosition]);
    
    const scrollRef = useRef(null);
    const containerRef = useRef(null);
    const recognitionRef = useRef(null);

    const loadingMessages = [
        "Analyzing symptoms...",
        "Reviewing clinical history...",
        "Identifying risk factors...",
        "Correlating vital telemetry...",
        "Synthesizing recommendations..."
    ];

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % loadingMessages.length);
            }, 1500);
            return () => clearInterval(interval);
        }
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
        const sections = {
            assessment: '',
            possibleConditions: '',
            riskIndicators: '',
            severity: 'LOW',
            specialist: '',
            action: '',
            questions: [],
            warning: '',
            service: '',
            other: ''
        };

        const lines = text.split('\n');
        let currentSection = 'other';

        lines.forEach(l => {
            const lowerL = l.toLowerCase();
            if (lowerL.includes('clinical assessment')) {
                currentSection = 'assessment';
            } else if (lowerL.includes('possible causes') || lowerL.includes('possible conditions')) {
                currentSection = 'possibleConditions';
            } else if (lowerL.includes('risk indicators')) {
                currentSection = 'riskIndicators';
            } else if (lowerL.includes('triage level')) {
                currentSection = 'severity';
                const content = l.replace(/triage level:?/i, '').replace(/[\[\]:]/g, '').trim();
                if (content) sections.severity = content;
            } else if (lowerL.includes('recommended specialist')) {
                currentSection = 'specialist';
                sections.specialist += l.replace(/recommended specialist:?/i, '').trim() + ' ';
            } else if (lowerL.includes('suggested next steps') || lowerL.includes('recommended action')) {
                currentSection = 'action';
                sections.action += l.replace(/(suggested next steps|recommended action):?/i, '').trim() + ' ';
            } else if (lowerL.includes('follow-up questions')) {
                currentSection = 'questions';
            } else if (lowerL.includes('emergency warning')) {
                currentSection = 'warning';
                sections.warning += l.replace(/emergency warning:?/i, '').trim() + ' ';
            } else {
                if (currentSection === 'questions' && l.match(/^[-*\d.]\s*/)) {
                    sections.questions.push(l.replace(/^[-*\d.]\s*/, ''));
                } else if (currentSection === 'assessment') {
                    sections.assessment += l + ' ';
                } else if (currentSection === 'possibleConditions') {
                    sections.possibleConditions += l + ' ';
                } else if (currentSection === 'riskIndicators') {
                    sections.riskIndicators += l + ' ';
                } else if (currentSection === 'specialist') {
                    sections.specialist += l + ' ';
                } else if (currentSection === 'action') {
                    sections.action += l + ' ';
                } else if (currentSection === 'warning') {
                    sections.warning += l + ' ';
                } else if (currentSection === 'severity') {
                    sections.severity = l.toUpperCase().trim();
                } else {
                    sections.other += l + ' ';
                }
            }
        });

        // Final cleanups and smart mapping
        const stripMap = (t) => t.replace(/https:\/\/(www\.google\.com\/maps|maps\.app\.goo\.gl)\/[^ \n)\]]*/g, '').trim();
        
        sections.assessment = stripMap(sections.assessment);
        sections.possibleConditions = stripMap(sections.possibleConditions);
        sections.riskIndicators = stripMap(sections.riskIndicators);
        sections.specialist = stripMap(sections.specialist.trim());
        sections.action = stripMap(sections.action.trim());
        sections.warning = stripMap(sections.warning.trim());
        sections.other = stripMap(sections.other);
        sections.questions = sections.questions.map(q => stripMap(q));

        const fullTextLower = text.toLowerCase();
        if (fullTextLower.includes('ambulance')) sections.service = 'Ambulance';
        else if (fullTextLower.includes('oxygen')) sections.service = 'Oxygen';
        else if (fullTextLower.includes('casualty')) sections.service = 'Casualty';
        else if (fullTextLower.includes('emergency care')) sections.service = 'Emergency';

        // Frontend safety override for emergency triage
        if (fullTextLower.includes('ambulance') || fullTextLower.includes('emergency') || fullTextLower.includes('chest pain')) {
            sections.severity = 'CRITICAL';
        }

        if (!sections.assessment.trim() && sections.other.trim()) sections.assessment = sections.other;
        
        const mapMatch = text.match(/https:\/\/(www\.google\.com\/maps|maps\.app\.goo\.gl)\/[^ \n)\]]*/);
        const mapUrl = mapMatch ? mapMatch[0] : null;

        return { ...sections, mapUrl };
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
                {!isOpen && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragConstraints={{ 
                            left: -window.innerWidth + 100, 
                            right: 0, 
                            top: -window.innerHeight + 100, 
                            bottom: 0 
                        }}
                        onDragEnd={() => {
                            setOrbPosition({ x: dragX.get(), y: dragY.get() });
                        }}
                        whileDrag={{ scale: 1.1 }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{ touchAction: 'none', x: dragX, y: dragY }}
                        className="absolute bottom-8 right-8 pointer-events-auto z-[4000]"
                    >
                        <motion.button
                            className="w-16 h-16 rounded-full ai-orb text-white flex items-center justify-center shadow-2xl"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsOpen(true)}
                        >
                            <Sparkles size={28} className="animate-pulse" />
                            <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </motion.button>
                    </motion.div>
                )}

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
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
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
                                                </div>
                                            )}

                                            {s.warning && (
                                                <div className="p-4 bg-red-50 rounded-2xl space-y-2 border border-red-100">
                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter flex items-center gap-1"><AlertCircle size={10} /> EMERGENCY WARNING</span>
                                                    <p className="text-xs font-bold text-red-700 leading-relaxed">{s.warning}</p>
                                                </div>
                                            )}

                                            {s.questions && s.questions.length > 0 && (
                                                <div className="p-4 bg-white rounded-2xl space-y-2 border border-slate-200 shadow-sm">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">FOLLOW-UP QUESTIONS</span>
                                                    <ul className="space-y-2">
                                                        {s.questions.map((q, idx) => (
                                                            <li key={idx} className="text-xs font-medium text-slate-700 flex items-start gap-2">
                                                                <span className="text-indigo-400 mt-0.5">•</span>
                                                                <span>{q}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {s.mapUrl && (
                                                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                    <div className="h-24 bg-slate-100 flex items-center justify-center relative overflow-hidden bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2361!3i1589!2m3!1e0!2sm!3i420120488!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')] bg-cover">
                                                        <div className="relative z-10 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xl">
                                                            <MapPin size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-800">Institutional Node</span>
                                                        <a href={s.mapUrl} target="_blank" className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Launch Navigation</a>
                                                    </div>
                                                </div>
                                            )}

                                            {(s.severity === 'CRITICAL' || s.severity === 'HIGH' || s.severity === 'EMERGENCY') && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            navigate('/dashboard/booking?mode=service&service=Ambulance');
                                                        }}
                                                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                                                    >
                                                        <HeartPulse size={14} /> Ambulance
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            if (s.mapUrl) {
                                                                window.open(s.mapUrl, '_blank');
                                                            } else {
                                                                navigate('/dashboard/booking?mode=service&service=Emergency & Trauma Care');
                                                            }
                                                        }}
                                                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                                    >
                                                        <MapPin size={14} /> Nearest Hospital
                                                    </button>
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    let url = '/dashboard/booking';
                                                    if (s.service) {
                                                        url = `/dashboard/booking?mode=service&service=${s.service}`;
                                                    } else if (s.specialist && s.specialist.length > 3 && !s.specialist.toLowerCase().includes('determined') && !s.specialist.toLowerCase().includes('n/a') && !s.specialist.toLowerCase().includes('none')) {
                                                        url = `/dashboard/booking?doctor=${encodeURIComponent(s.specialist)}`;
                                                    }
                                                    navigate(url);
                                                    toast.success(`Navigating to ${s.service || 'Clinical'} Booking Node`);
                                                }}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                            >
                                                Secure Clinical Booking <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {isLoading && (
                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-[280px]">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: `${d * 0.2}s` }}></div>)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{loadingMessages[loadingStep]}</span>
                                </div>
                            )}
                        </div>

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
