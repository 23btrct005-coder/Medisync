import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2, RotateCcw
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
    const [isDragging, setIsDragging] = useState(false);
    const [location, setLocation] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
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

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    };

    if (!user) return null;

    const languages = [
        { code: 'en-IN', name: 'English', flag: '🇺🇸' },
        { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
        { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' }
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
            setMessages(prev => [...prev, { role: 'ai', text: 'Clinical context interrupted. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => toast.error("Location access denied")
        );
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = selectedLang;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e) => setInput(e.results[0][0].transcript);
        recognition.start();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const resetChat = () => {
        const resetMsg = [{ role: 'ai', text: "Welcome to MediSync ACIE. I am your advanced clinical assistant. Please describe your symptoms or clinical concerns for an immediate professional triage and spatial guidance." }];
        setMessages(resetMsg);
        localStorage.setItem('ai_chat_history', JSON.stringify(resetMsg));
        toast.success("Clinical context reset successfully.");
    };

    const stopListening = () => recognitionRef.current?.stop();

    // AI Response Parser for Segmented Card UI
    const parseAiResponse = (text) => {
        const sections = {
            assessment: '',
            severity: 'Mild',
            questions: [],
            recommendations: [],
            department: '',
            action: '',
            other: ''
        };

        const lines = text.replace(/[#*_]/g, '').split('\n');
        let currentSection = 'other';

        lines.forEach(line => {
            const l = line.trim();
            if (!l) return;

            if (l.toLowerCase().includes('clinical assessment')) currentSection = 'assessment';
            else if (l.toLowerCase().includes('severity estimate')) currentSection = 'severity';
            else if (l.toLowerCase().includes('follow-up questions')) currentSection = 'questions';
            else if (l.toLowerCase().includes('immediate recommendations')) currentSection = 'recommendations';
            else if (l.toLowerCase().includes('suggested department')) currentSection = 'department';
            else if (l.toLowerCase().includes('recommended action')) currentSection = 'action';
            else {
                if (currentSection === 'questions' && (l.startsWith('-') || l.startsWith('*'))) {
                    sections.questions.push(l.replace(/^[-*]\s*/, ''));
                } else if (currentSection === 'recommendations' && (l.startsWith('-') || l.startsWith('*'))) {
                    sections.recommendations.push(l.replace(/^[-*]\s*/, ''));
                } else if (currentSection === 'severity') {
                    sections.severity = l.replace(/^[-*]\s*/, '').replace(/[:]/, '').trim();
                } else if (currentSection === 'assessment') {
                    sections.assessment += (l.replace(/^[-*]\s*/, '') + ' ');
                } else if (currentSection === 'department') {
                    sections.department = l.replace(/^[-*]\s*/, '').replace(/[:]/, '').trim();
                } else if (currentSection === 'action') {
                    sections.action += (l.replace(/^[-*]\s*/, '') + ' ');
                } else {
                    sections.other += (l + ' ');
                }
            }
        });

        // Detect Doctor Recommendation
        const doctorMatch = sections.action.match(/Dr\.\s+([A-Za-z\s.]+)/i) || text.match(/Dr\.\s+([A-Za-z\s.]+)/i);
        const suggestedDoctor = doctorMatch ? doctorMatch[1].trim() : null;

        // Map suggested department to predefined services
        const SERVICES_LIST = [
            "Emergency & Trauma Care", "Ambulance Services", "ICU (Intensive Care Unit)", 
            "NICU (Neonatal ICU)", "Operation Theatre (Emergency)", "Casualty Department", 
            "24/7 Pharmacy", "Blood Bank", "Emergency CT Scan", "Emergency Lab Tests",
            "Oxygen & Ventilator Support", "Emergency Dialysis",
            "OPD (Outpatient)", "X-Ray", "MRI Scan", "Ultrasound / सोनोग्राफी", 
            "ECG & TMT", "Physiotherapy", "Dental Services", "General Surgery (Planned)",
            "Orthopedic Consultation", "Pediatric Consultation", "Gynecology & Obstetrics",
            "ENT (Ear, Nose, Throat)", "Ophthalmology (Eye)", "Dermatology (Skin)",
            "Advanced Laboratory Tests", "Health Checkup Packages"
        ];

        const matchedService = SERVICES_LIST.find(s => {
            const lowerS = s.toLowerCase();
            const lowerDept = (sections.department || '').toLowerCase();
            const lowerAction = (sections.action || '').toLowerCase();
            const lowerAssessment = (sections.assessment || '').toLowerCase();
            
            // Priority 1: Ambulance Detection (Critical)
            if (lowerS.includes('ambulance') && (text.toLowerCase().includes('ambulance') || lowerDept.includes('ambulance'))) return true;
            
            // Priority 2: Direct Matches
            if (lowerDept.includes(lowerS.split(' ')[0]) && lowerS.length > 3) return true;
            if (lowerS.includes('emergency') && (lowerDept.includes('emergency') || lowerDept.includes('trauma'))) return true;
            
            // Priority 3: Keyword Search in Action/Assessment
            return lowerAction.includes(lowerS.split(' ')[0]) || lowerAssessment.includes(lowerS.split(' ')[0]);
        });

        return { ...sections, mapLink: uniqueMapLink, suggestedDoctor, matchedService };
    };

    const getSeverityStyles = (severity) => {
        const s = severity.toLowerCase();
        if (s.includes('emergency') || s.includes('critical')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle className="text-red-500" size={14} /> };
        if (s.includes('high') || s.includes('urgent')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: <AlertCircle className="text-orange-500" size={14} /> };
        if (s.includes('moderate')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="text-amber-500" size={14} /> };
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="text-emerald-500" size={14} /> };
    };

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[1000]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                :root {
                    --primary-theme: #0066FF;
                    --primary-theme-soft: rgba(0, 102, 255, 0.05);
                    --primary-theme-border: rgba(0, 102, 255, 0.1);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--primary-theme-border);
                }
                .message-user {
                    background: var(--primary-theme);
                    color: white;
                    border-radius: 20px 20px 4px 20px;
                    box-shadow: 0 4px 15px rgba(0, 102, 255, 0.2);
                }
                .ai-card { 
                    background: white; 
                    border: 1px solid #f1f5f9; 
                    border-radius: 20px; 
                    padding: 1rem; 
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                }
                @media (max-width: 640px) {
                    .ai-card { padding: 0.75rem; border-radius: 16px; }
                    .text-sm { font-size: 0.8125rem; }
                    .p-6 { padding: 1rem; }
                    .gap-8 { gap: 1rem; }
                    .w-\[440px\] { width: 100vw; }
                    .h-\[700px\] { height: 100vh; max-height: 100vh; }
                    .bottom-8 { bottom: 0; right: 0; }
                    .rounded-\[32px\] { border-radius: 0; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes typing { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
                .typing-dot { animation: typing 1.4s infinite; }
            `}</style>

            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        drag
                        dragConstraints={containerRef}
                        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                        className="fixed bottom-8 right-8 w-16 h-16 rounded-[24px] bg-[#0066FF] text-white flex items-center justify-center shadow-2xl pointer-events-auto z-[2000]"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 20 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                    >
                        <BrainCircuit size={32} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div
                        layoutId="ai-concierge"
                        initial={isFullscreen ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-in-out border border-slate-200/50 pointer-events-auto
                            ${isFullscreen 
                                ? 'fixed inset-0 z-[10000] rounded-0' 
                                : 'fixed bottom-6 right-6 z-[9999] w-[400px] max-w-[95vw] h-[650px] max-h-[85vh] rounded-[32px]'
                            }`}
                    >
                        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#0066FF]/5 flex items-center justify-center text-[#0066FF] shadow-inner">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">AI Concierge</h2>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Node • v4.2</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={resetChat}
                                    className="p-2 text-slate-400 hover:text-[#0066FF] hover:bg-slate-50 rounded-xl transition-all"
                                    title="Reset Session"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button 
                                    onClick={() => setIsFullscreen(!isFullscreen)} 
                                    className="p-2 text-slate-400 hover:text-[#0066FF] hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-2.5 bg-white/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex gap-2">
                                {languages.map(l => (
                                    <button 
                                        key={l.code} 
                                        onClick={() => setSelectedLang(l.code)}
                                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${selectedLang === l.code ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {l.name.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-2 rounded-lg transition-colors ${isVoiceEnabled ? 'text-[#0066FF] bg-blue-50' : 'text-slate-300'}`}>
                                <HeartPulse size={18} />
                            </button>
                        </div>

                        <div 
                            ref={scrollRef} 
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar relative"
                        >
                            {messages.map((m, i) => {
                                if (m.role === 'user') {
                                    return (
                                        <div key={i} className="flex flex-col gap-2 items-end">
                                            {m.image && <img src={m.image} className="w-48 rounded-2xl border-2 border-white shadow-lg mb-1" />}
                                            <div className="message-user px-5 py-3.5 max-w-[85%] text-sm font-medium leading-relaxed">
                                                {m.text}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase px-2">Patient</span>
                                        </div>
                                    );
                                }

                                const segments = parseAiResponse(m.text);
                                const sevStyles = getSeverityStyles(segments.severity);

                                return (
                                    <div key={i} className="flex flex-col gap-4">
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="ai-card border-l-4 border-l-[#0066FF]"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <Stethoscope size={16} className="text-[#0066FF]" />
                                                <span className="text-[11px] font-black uppercase tracking-widest text-[#0066FF]">Clinical Assessment</span>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                {segments.assessment || segments.other}
                                            </p>
                                        </motion.div>

                                        <div className="flex gap-3">
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className={`flex-1 ai-card flex items-center justify-between ${sevStyles.bg} ${sevStyles.border}`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Activity size={14} className="text-blue-500" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Severity Assessment</span>
                                                    </div>
                                                    <h4 className={`font-black text-[#10B981] leading-tight tracking-tight uppercase ${segments.severity.length > 20 ? 'text-xs' : 'text-lg'}`}>
                                                        {segments.severity}
                                                    </h4>
                                                </div>
                                                {sevStyles.icon}
                                            </motion.div>
                                            
                                            <motion.div 
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="flex-1 ai-card flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Department</span>
                                                        <span className="text-sm font-bold text-slate-700">{segments.department}</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Recommendations */}
                                        {segments.recommendations.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="ai-card"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Activity size={16} className="text-emerald-500" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Recommendations</span>
                                                </div>
                                                <ul className="flex flex-col gap-2.5">
                                                    {segments.recommendations.map((rec, ri) => (
                                                        <li key={ri} className="flex gap-3 text-sm text-slate-600 items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                                                            <span className="font-medium">{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}

                                        {/* Embedded Maps Integration */}
                                        {segments.mapLink && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="ai-card overflow-hidden p-0 border-none shadow-xl"
                                            >
                                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-[#0066FF]" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Hospital Location</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                    </div>
                                                </div>
                                                <iframe
                                                    width="100%"
                                                    height="240"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                                        (segments.mapLink.match(/query=([^&]+)/) || [null, 'Hospital'])[1]?.replace(/\+/g, ' ') || 'Hospital'
                                                    )}&output=embed`}
                                                ></iframe>
                                            </motion.div>
                                        )}

                                        {/* Actionable CTA */}
                                        {segments.action && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.4 }}
                                                className="rounded-[24px] bg-gradient-to-br from-[#0066FF] to-[#0052CC] text-white shadow-xl shadow-blue-200 overflow-hidden"
                                            >
                                                
                                                <div className="p-5">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Calendar size={20} className="opacity-80" />
                                                        <span className="text-[11px] font-black uppercase tracking-[2px]">Clinical Action</span>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            let url = '/dashboard/booking';
                                                            if (segments.suggestedDoctor) {
                                                                url += `?doctor=${encodeURIComponent(segments.suggestedDoctor)}`;
                                                            } else if (segments.matchedService) {
                                                                url += `?mode=service&service=${encodeURIComponent(segments.matchedService)}`;
                                                            }
                                                            navigate(url);
                                                        }}
                                                        className="w-full bg-white text-[#0066FF] py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg mt-2"
                                                    >
                                                        Book Consultation <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Follow-up Questions as Interactive Chips */}
                                        {segments.questions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {segments.questions.map((q, qi) => (
                                                    <button 
                                                        key={qi}
                                                        onClick={() => handleSend(q)}
                                                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-[#0066FF] hover:text-[#0066FF] transition-all shadow-sm flex items-center gap-2"
                                                    >
                                                        {q} <Sparkles size={12} className="text-[#0066FF]" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <span className="text-[10px] font-bold text-slate-300 uppercase px-2">Clinical Brain</span>
                                    </div>
                                );
                            })}

                                    {isLoading && (
                                        <div className="flex flex-col gap-4">
                                            <div className="ai-card bg-slate-50 border-none shadow-none">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-1.5">
                                                        {[0, 1, 2].map(d => (
                                                            <div key={d} className={`w-1.5 h-1.5 rounded-full bg-[#0066FF] typing-dot`} style={{ animationDelay: `${d * 0.2}s` }}></div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{loadingMessages[loadingStep]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {showScrollButton && (
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                onClick={scrollToBottom}
                                                className="absolute bottom-24 left-1/2 -translate-x-1/2 w-10 h-10 bg-white shadow-xl rounded-full border border-slate-100 flex items-center justify-center text-[#0066FF] hover:bg-slate-50 transition-all z-50"
                                            >
                                                <ChevronRight size={18} className="rotate-90" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>

                        {/* Advanced Input Bar */}
                        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-3 px-1 justify-center">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    <MapPin size={10} className="text-blue-500" />
                                    <span>Precision Triage Active</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300 mx-1"></div>
                                    <span>Spatial Sync On</span>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="flex items-center bg-slate-50 rounded-[24px] border border-slate-200/50 p-1.5 focus-within:border-blue-400/50 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/5 transition-all duration-300">
                                    <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors" onClick={() => document.getElementById('file-upload')?.click()}>
                                        <Paperclip size={18} />
                                        <input id="file-upload" type="file" className="hidden" onChange={handleImageUpload} />
                                    </button>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Describe your symptoms..."
                                        className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-slate-800 px-2 placeholder:text-slate-400"
                                    />
                                    <div className="flex items-center gap-1 pr-1">
                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            className={`p-2 rounded-xl transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                        >
                                            <Mic size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim()}
                                            className={`p-2.5 rounded-xl transition-all shadow-md ${input.trim() ? 'bg-[#0066FF] text-white shadow-blue-200 scale-100' : 'bg-slate-200 text-slate-400 scale-95 opacity-50 cursor-not-allowed'}`}
                                        >
                                            <SendHorizontal size={20} />
                                        </button>
                                    </div>
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
