import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, Maximize2, Minimize2, 
    ShieldCheck, Stethoscope, MapPin, CheckCircle2, RotateCcw,
    Volume2, VolumeX, AlertCircle, Clock, HeartPulse, ChevronRight, Paperclip, ChevronDown
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
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [location, setLocation] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

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
        
        // STABILITY: Strip large image telemetry before persisting to localStorage
        const historyToSave = messages.slice(-20).map(m => ({
            role: m.role,
            text: m.text,
            image: null // Do not persist base64 images to prevent QuotaExceededError
        }));
        localStorage.setItem('ai_chat_history', JSON.stringify(historyToSave));
    }, [messages, isOpen, isFullscreen]);

    if (!user) return null;

    const speak = (text) => {
        if (!isVoiceEnabled) return;
        window.speechSynthesis.cancel();
        let cleanText = text.replace(/\[.*?\]\(.*?\)/g, '').replace(/[*_#]/g, '').trim();
        if (!cleanText) return;
        const utterance = new SpeechSynthesisUtterance(cleanText);
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
            const lowerL = l.toLowerCase().trim();
            if (lowerL.match(/^[\d.\s]*(initial|clinical|copilot|condition)\s+(assessment|summary)/)) {
                currentSection = 'assessment';
                const content = l.replace(/^[\d.\s]*(initial|clinical|copilot|condition)\s+(assessment|summary):?/i, '').trim();
                if (content) sections.assessment += content + ' ';
            } else if (lowerL.match(/^[\d.\s]*(possible\s+(causes|conditions|features|diagnosis)|differential\s+diagnosis)/)) {
                currentSection = 'possibleConditions';
                const content = l.replace(/^[\d.\s]*(possible\s+(causes|conditions|features|diagnosis)|differential\s+diagnosis):?/i, '').trim();
                if (content) sections.possibleConditions += content + ' ';
            } else if (lowerL.match(/^[\d.\s]*risk\s+indicators/)) {
                currentSection = 'riskIndicators';
                const content = l.replace(/^[\d.\s]*risk\s+indicators:?/i, '').trim();
                if (content) sections.riskIndicators += content + ' ';
            } else if (lowerL.match(/^[\d.\s]*triage\s+level/)) {
                currentSection = 'severity';
                const content = l.replace(/^[\d.\s]*triage\s+level:?/i, '').replace(/[\[\]:]/g, '').trim();
                if (content) sections.severity = content;
            } else if (lowerL.match(/^[\d.\s]*recommended\s+specialist/)) {
                currentSection = 'specialist';
                const content = l.replace(/^[\d.\s]*recommended\s+specialist:?/i, '').trim();
                if (content) sections.specialist += content + ' ';
            } else if (lowerL.match(/^[\d.\s]*(suggested\s+next\s+steps|recommended\s+(action|tests)|treatment\s+options|medication\s+information|lifestyle\s+advice|follow-up)/)) {
                currentSection = 'action';
                const content = l.replace(/^[\d.\s]*(suggested\s+next\s+steps|recommended\s+(action|tests)|treatment\s+options|medication\s+information|lifestyle\s+advice|follow-up):?/i, '').trim();
                if (content) sections.action += "\n" + (content ? content : l.trim());
            } else if (lowerL.match(/^[\d.\s]*follow-up\s+questions/)) {
                currentSection = 'questions';
            } else if (lowerL.match(/^[\d.\s]*(emergency\s+warning(\s+signs)?)/)) {
                currentSection = 'warning';
                const content = l.replace(/^[\d.\s]*(emergency\s+warning(\s+signs)?):?/i, '').trim();
                if (content) sections.warning += content + ' ';
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

        const mapMatch = text.match(/https:\/\/(www\.google\.com\/maps|maps\.app\.goo\.gl)[^ \n)\]]*/);
        const mapUrl = mapMatch ? mapMatch[0].replace(/\.$/, '') : null;

        const fullTextLower = text.toLowerCase();
        const isCritical = sections.severity === 'CRITICAL' || sections.severity === 'HIGH';

        // High-Precision Clinical Mapping (Synchronized with Institutional Catalog)
        if (isCritical) {
            if (fullTextLower.includes('ambulance')) sections.service = 'Ambulance Booking';
            else if (fullTextLower.includes('icu') || fullTextLower.includes('intensive care')) sections.service = 'ICU Admission';
            else if (fullTextLower.includes('stroke')) sections.service = 'Stroke Care';
            else if (fullTextLower.includes('cardiac emergency') || (fullTextLower.includes('heart') && fullTextLower.includes('emergency'))) sections.service = 'Cardiac Emergency';
            else if (fullTextLower.includes('trauma') || fullTextLower.includes('casualty')) sections.service = 'Emergency & Trauma Care';
            else if (fullTextLower.includes('emergency')) sections.service = 'Emergency Room';
        }

        // Diagnostics & Scans
        if (!sections.service) {
            if (fullTextLower.includes('mri')) sections.service = 'MRI Scan';
            else if (fullTextLower.includes('ct scan') || fullTextLower.includes('ct ')) sections.service = 'CT Scan';
            else if (fullTextLower.includes('x-ray') || fullTextLower.includes('xray')) sections.service = 'X-Ray';
            else if (fullTextLower.includes('ultrasound')) sections.service = 'Ultrasound';
            else if (fullTextLower.includes('pet scan')) sections.service = 'PET Scan';
            else if (fullTextLower.includes('blood test') || fullTextLower.includes('cbc')) sections.service = 'Blood Test (CBC)';
            else if (fullTextLower.includes('thyroid')) sections.service = 'Thyroid Profile';
            else if (fullTextLower.includes('liver') && fullTextLower.includes('test')) sections.service = 'Liver Function Test';
            else if (fullTextLower.includes('ecg') || fullTextLower.includes('echo')) sections.service = 'ECG / Echo';
        }

        // Specialized & Preventive Care (Synchronized with Catalog)
        if (!sections.service) {
            // Child & Maternity
            if (fullTextLower.includes('pregnancy') || fullTextLower.includes('maternity')) sections.service = 'Pregnancy Checkup';
            else if (fullTextLower.includes('fertility')) sections.service = 'Fertility Consultation';
            else if (fullTextLower.includes('pediatric') || fullTextLower.includes('child')) sections.service = 'Pediatric Consultation';
            else if (fullTextLower.includes('neonatal') || fullTextLower.includes('nicu')) sections.service = 'Neonatal Care';
            
            // Preventive Screenings
            else if (fullTextLower.includes('diabetes')) sections.service = 'Diabetes Screening';
            else if (fullTextLower.includes('heart screening')) sections.service = 'Heart Screening';
            else if (fullTextLower.includes('cancer')) sections.service = 'Cancer Screening';
            else if (fullTextLower.includes('full body') || fullTextLower.includes('checkup')) sections.service = 'Full Body Checkup';
            
            // Home & Remote
            else if (fullTextLower.includes('home blood')) sections.service = 'Home Blood Collection';
            else if (fullTextLower.includes('home nursing')) sections.service = 'Home Nursing';
            else if (fullTextLower.includes('telemedicine') || fullTextLower.includes('video call')) sections.service = 'Telemedicine';
            else if (fullTextLower.includes('physiotherapy')) sections.service = 'Physiotherapy at Home';
            
            // Surgery
            else if (fullTextLower.includes('general surgery')) sections.service = 'General Surgery';
            else if (fullTextLower.includes('orthopedic surgery')) sections.service = 'Orthopedic Surgery';
            else if (fullTextLower.includes('neurosurgery')) sections.service = 'Neurosurgery';
        }

        if (!sections.service) {
            if (fullTextLower.includes('pharmacy') || fullTextLower.includes('medicine')) sections.service = '24/7 Pharmacy';
            else if (fullTextLower.includes('skin') || fullTextLower.includes('rash') || fullTextLower.includes('dermatolog')) sections.service = 'General Medicine';
        }

        const safetyKeywords = ['ambulance', 'immediate emergency', 'unconscious', 'breathing difficulty', 'heavy bleeding', 'stroke'];
        if (safetyKeywords.some(k => sections.assessment.toLowerCase().includes(k) || sections.warning.toLowerCase().includes(k))) {
            sections.severity = 'CRITICAL';
            if (!sections.service) sections.service = 'Emergency & Trauma Care';
        }

        const doctorMatch = text.match(/Dr\.\s+[A-Z][a-z]+/);
        if (doctorMatch) sections.physician = doctorMatch[0];
        if (!sections.assessment.trim() && sections.other.trim()) sections.assessment = sections.other;
        
        return { ...sections, mapUrl };
    };

    const getSeverityStyles = (severity) => {
        const s = severity.toUpperCase();
        if (s.includes('CRITICAL') || s.includes('EMERGENCY')) return { bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', icon: <AlertCircle className="text-red-500" size={14} />, label: 'CRITICAL' };
        if (s.includes('HIGH')) return { bg: 'bg-orange-50', color: 'text-orange-700', border: 'border-orange-200', icon: <AlertCircle className="text-orange-500" size={14} />, label: 'HIGH' };
        if (s.includes('MODERATE')) return { bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="text-amber-500" size={14} />, label: 'MODERATE' };
        return { bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="text-emerald-500" size={14} />, label: 'LOW' };
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[3000]">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .ai-orb-pulse { animation: orb-pulse 3s infinite; }
                @keyframes orb-pulse {
                    0% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.2); opacity: 0.2; }
                    100% { transform: scale(1); opacity: 0.4; }
                }
            `}</style>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`fixed bg-[#F8FAFC] shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden pointer-events-auto border border-white/50 z-[3000] ${
                            (window.innerWidth < 768) ? 'inset-0' : 'bottom-8 right-8'
                        }`}
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, y: 0, scale: 1,
                            width: isFullscreen ? 'min(1200px, calc(100vw - 32px))' : (window.innerWidth < 768 ? '100vw' : '420px'),
                            height: isFullscreen ? 'calc(100vh - 32px)' : (window.innerWidth < 768 ? '100dvh' : '720px'),
                            borderRadius: (window.innerWidth < 768) ? 0 : 32
                        }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    >
                        {/* Header */}
                        <div className="pt-[env(safe-area-inset-top,24px)] pb-6 px-6 bg-white border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900 text-sm tracking-tight">Clinical Assistant</h2>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Node • v5.0</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-2 rounded-xl ${isVoiceEnabled ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300'}`}>
                                    {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>
                                <button onClick={resetChat} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl"><RotateCcw size={16} /></button>
                                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                            {messages.map((m, i) => {
                                if (m.role === 'user') return (
                                    <div key={i} className="flex flex-col gap-2 items-end">
                                        {m.image && <img src={m.image} className="w-48 rounded-2xl border-2 border-white shadow-lg mb-1" />}
                                        <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-none text-sm font-medium shadow-lg max-w-[85%]">{m.text}</div>
                                    </div>
                                );
                                const s = parseAiResponse(m.text);
                                const ui = getSeverityStyles(s.severity);
                                return (
                                    <div key={i} className="flex flex-col gap-4">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Stethoscope size={16} className="text-indigo-600" />
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Assessment</span>
                                                </div>
                                                {s.service && (
                                                    <button onClick={() => { setIsOpen(false); navigate(`/dashboard/booking?mode=service&service=${encodeURIComponent(s.service)}`); }} className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg">Book {s.service}</button>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{s.assessment || s.other}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className={`p-4 rounded-2xl border ${ui.bg} ${ui.border} flex flex-col gap-1`}>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">TRIAGE LEVEL</span>
                                                    <span className={`text-xs font-black ${ui.color}`}>{ui.label}</span>
                                                </div>
                                                {s.specialist && (
                                                    <div className="p-4 rounded-2xl border border-slate-50 bg-slate-50/50 flex flex-col gap-1">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">RECOMMENDED SPECIALIST</span>
                                                        <span className="text-xs font-black text-slate-700 leading-tight">{s.specialist}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {s.action && (
                                                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">SUGGESTED NEXT STEPS</span>
                                                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">{s.action}</p>
                                                </div>
                                            )}
                                            {s.warning && (
                                                <div className="p-4 bg-red-50 rounded-2xl space-y-2 border border-red-100">
                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter flex items-center gap-1"><AlertCircle size={10} /> EMERGENCY WARNING</span>
                                                    <p className="text-xs font-bold text-red-700 leading-relaxed">{s.warning}</p>
                                                </div>
                                            )}
                                            {s.severity === 'CRITICAL' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setIsOpen(false); navigate(`/dashboard/booking?mode=service&service=Ambulance`); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"><HeartPulse size={14} /> Ambulance</button>
                                                    <button onClick={() => { setIsOpen(false); navigate(`/dashboard/booking?mode=service&service=Emergency`); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"><MapPin size={14} /> Nearest Hospital</button>
                                                </div>
                                            )}
                                            {(s.severity === 'HIGH' && s.specialist) && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setIsOpen(false); navigate(`/dashboard/booking?mode=specialist&specialist=${encodeURIComponent(s.specialist)}`); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"><MapPin size={14} /> Nearest {s.specialist}</button>
                                                </div>
                                            )}
                                            {(user?.role === 'ROLE_PATIENT' || !user?.role) && (s.specialist || s.service) && (
                                                <button 
                                                    onClick={() => { 
                                                        setIsOpen(false); 
                                                        const targetUrl = s.physician 
                                                            ? `/dashboard/booking?doctor=${encodeURIComponent(s.physician)}` 
                                                            : s.specialist
                                                                ? `/dashboard/booking?mode=specialist&specialist=${encodeURIComponent(s.specialist)}`
                                                                : s.service 
                                                                    ? `/dashboard/booking?mode=service&service=${encodeURIComponent(s.service)}` 
                                                                    : '/dashboard/booking';
                                                        navigate(targetUrl);
                                                    }}
                                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-xl"
                                                >
                                                    {s.specialist ? `Book ${s.specialist}` : 'Secure Clinical Booking'} <ChevronRight size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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

                        {showScrollBottom && (
                            <button onClick={scrollToBottom} className="absolute bottom-32 right-8 p-3 bg-white border border-indigo-100 text-indigo-600 rounded-full shadow-2xl z-[3010] flex items-center justify-center">
                                <ChevronDown size={24} />
                            </button>
                        )}

                        {/* Input */}
                        <div className="pt-6 pb-[env(safe-area-inset-bottom,24px)] px-6 bg-white border-t border-slate-100">
                            <div className="relative flex flex-col gap-2">
                                {imagePreview && (
                                    <div className="p-2 bg-indigo-50 rounded-xl flex items-center gap-2 mb-2">
                                        <div className="relative">
                                            <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover" />
                                            <button onClick={() => setImagePreview(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">Image Telemetry Ready</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1">
                                        <label className="p-2 text-slate-400 hover:text-indigo-600 cursor-pointer">
                                            <Paperclip size={20} />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                        <input 
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Ask a medical question..."
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-700 px-2 py-3"
                                        />
                                        <button onClick={() => setIsListening(!isListening)} className={`p-2 rounded-xl ${isListening ? 'text-red-500' : 'text-slate-400'}`}>
                                            <Mic size={20} />
                                        </button>
                                    </div>
                                    <button onClick={() => handleSend()} disabled={isLoading} className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg disabled:opacity-50">
                                        <SendHorizontal size={22} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiConcierge;
