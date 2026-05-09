import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2, RotateCcw, 
    History, Plus, Trash2, Copy, Menu, User, Settings, Info, LogOut, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AiConcierge = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeChatId, setActiveChatId] = useState('default');

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile && !isSidebarOpen) setIsSidebarOpen(true);
            if (mobile && isSidebarOpen) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Chat sessions state
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('medisync_chat_sessions');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing chat history", e);
            }
        }
        return {
            'default': {
                id: 'default',
                title: 'New Consultation',
                messages: [{ role: 'ai', text: 'Hi! I am your MediSync Medical Assistant. How can I help you with your symptoms or reports today?' }],
                timestamp: Date.now()
            }
        };
    });

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);

    const loadingMessages = [
        "Analyzing symptoms...",
        "Reviewing clinical history...",
        "Consulting medical database...",
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
        localStorage.setItem('medisync_chat_sessions', JSON.stringify(sessions));
    }, [sessions, isOpen, isFullscreen, activeChatId]);

    const activeSession = sessions[activeChatId] || sessions['default'];
    const messages = activeSession.messages;

    const createNewChat = () => {
        const id = Date.now().toString();
        const newSession = {
            id,
            title: 'New Consultation',
            messages: [{ role: 'ai', text: 'Hi! How can I help you today?' }],
            timestamp: Date.now()
        };
        setSessions(prev => ({ ...prev, [id]: newSession }));
        setActiveChatId(id);
        if (window.innerWidth < 640) setIsSidebarOpen(false);
    };

    const deleteChat = (id, e) => {
        e.stopPropagation();
        if (Object.keys(sessions).length === 1) {
            resetChat();
            return;
        }
        setSessions(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (activeChatId === id) {
            setActiveChatId(Object.keys(sessions)[0]);
        }
    };

    const handleSend = async (manualInput) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim() && !imagePreview) return;

        const currentImg = imagePreview;
        const userMsg = { role: 'user', text: textToSend, image: currentImg, timestamp: Date.now() };
        
        // Update session with user message
        setSessions(prev => {
            const session = { ...prev[activeChatId] };
            session.messages = [...session.messages, userMsg];
            // Auto-update title based on first message
            if (session.messages.length === 2) {
                session.title = textToSend.length > 20 ? textToSend.substring(0, 20) + '...' : textToSend;
            }
            return { ...prev, [activeChatId]: session };
        });

        setInput('');
        setImagePreview(null);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { 
                message: textToSend,
                history: messages.slice(-10),
                imageData: currentImg
            });
            
            const aiMsg = { role: 'ai', text: res.data.response, timestamp: Date.now() };
            
            setSessions(prev => {
                const session = { ...prev[activeChatId] };
                session.messages = [...session.messages, aiMsg];
                return { ...prev, [activeChatId]: session };
            });
        } catch (error) {
            const errorMsg = { role: 'ai', text: 'Clinical context interrupted. Please try again.', timestamp: Date.now() };
            setSessions(prev => {
                const session = { ...prev[activeChatId] };
                session.messages = [...session.messages, errorMsg];
                return { ...prev, [activeChatId]: session };
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetChat = () => {
        setSessions(prev => ({
            ...prev,
            [activeChatId]: {
                ...prev[activeChatId],
                messages: [{ role: 'ai', text: "Welcome to MediSync Portal. How can I assist you today?" }],
                timestamp: Date.now()
            }
        }));
        toast.success("Consultation reset.");
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Message copied!");
    };

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
            const lowerL = l.toLowerCase();
            
            if (lowerL.includes('clinical assessment')) {
                currentSection = 'assessment';
                const content = l.replace(/clinical assessment:?/i, '').trim();
                if (content) sections.assessment += content + ' ';
            } else if (lowerL.includes('severity estimate')) {
                currentSection = 'severity';
                const content = l.replace(/severity estimate:?/i, '').replace(/[:]/, '').trim();
                if (content) sections.severity = content;
            } else if (lowerL.includes('follow-up questions')) {
                currentSection = 'questions';
                const content = l.replace(/follow-up questions:?/i, '').trim();
                if (content && (content.startsWith('-') || content.startsWith('*'))) sections.questions.push(content.replace(/^[-*]\s*/, ''));
            } else if (lowerL.includes('immediate recommendations')) {
                currentSection = 'recommendations';
            } else if (lowerL.includes('suggested department')) {
                currentSection = 'department';
                const content = l.replace(/suggested department:?/i, '').replace(/[:]/, '').trim();
                if (content) sections.department = content;
            } else if (lowerL.includes('recommended action')) {
                currentSection = 'action';
                const content = l.replace(/recommended action:?/i, '').trim();
                if (content) sections.action += content + ' ';
            } else {
                if (currentSection === 'questions' && (l.startsWith('-') || l.startsWith('*'))) {
                    sections.questions.push(l.replace(/^[-*]\s*/, ''));
                } else if (currentSection === 'recommendations' && (l.startsWith('-') || l.startsWith('*'))) {
                    sections.recommendations.push(l.replace(/^[-*]\s*/, ''));
                } else if (currentSection === 'severity' && !sections.severity) {
                    sections.severity = l.replace(/^[-*]\s*/, '').replace(/[:]/, '').trim();
                } else if (currentSection === 'assessment') {
                    sections.assessment += (l.replace(/^[-*]\s*/, '') + ' ');
                } else if (currentSection === 'department' && !sections.department) {
                    sections.department = l.replace(/^[-*]\s*/, '').replace(/[:]/, '').trim();
                } else if (currentSection === 'action') {
                    sections.action += (l.replace(/^[-*]\s*/, '') + ' ');
                } else {
                    sections.other += (l + ' ');
                }
            }
        });

        if (!sections.assessment.trim() && sections.other.trim()) sections.assessment = sections.other;
        if (sections.department && !sections.action.trim()) sections.action = `Please proceed to book your session for ${sections.department}.`;

        const doctorMatch = sections.action.match(/Dr\.\s+([A-Za-z\s.]+)/i) || text.match(/Dr\.\s+([A-Za-z\s.]+)/i);
        const suggestedDoctor = doctorMatch ? doctorMatch[1].trim() : null;

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

        const matchedService = (() => {
            const lowerDept = (sections.department || '').toLowerCase();
            const lowerAction = (sections.action || '').toLowerCase();
            const lowerAssessment = (sections.assessment || '').toLowerCase();

            // Pass 1: Exact or Strong Department Match
            const exactMatch = SERVICES_LIST.find(s => {
                const lowerS = s.toLowerCase();
                return lowerDept === lowerS || (lowerDept.length > 3 && lowerS.includes(lowerDept)) || (lowerS.length > 3 && lowerDept.includes(lowerS));
            });
            if (exactMatch) return exactMatch;

            // Pass 2: Specific Ambulance/Emergency Priority
            if (lowerDept.includes('ambulance') || text.toLowerCase().includes('ambulance')) {
                return SERVICES_LIST.find(s => s.toLowerCase().includes('ambulance'));
            }
            if (lowerDept.includes('emergency') || lowerDept.includes('trauma')) {
                return SERVICES_LIST.find(s => s.toLowerCase().includes('emergency & trauma'));
            }

            // Pass 3: Keyword Search in Action/Assessment (Fallback)
            return SERVICES_LIST.find(s => {
                const keywords = s.toLowerCase().split(' ');
                // Avoid matching common words like 'care', 'services', 'unit'
                const significantKeywords = keywords.filter(k => k.length > 4 && !['services', 'department', 'clinical', 'intensive'].includes(k));
                return significantKeywords.some(k => lowerAction.includes(k) || lowerAssessment.includes(k));
            });
        })();

        const mapMatch = text.match(/https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=([^)\n\s]+)/);
        const mapUrl = mapMatch ? mapMatch[0] : null;
        const hospitalMatch = text.match(/([A-Z][A-Za-z\s]+(Hospital|Clinic|Medical Center))/i);
        const suggestedHospital = hospitalMatch ? hospitalMatch[0].trim() : null;

        return { ...sections, suggestedDoctor, matchedService, mapUrl, suggestedHospital };
    };

    const getSeverityStyles = (severity) => {
        const s = severity.toLowerCase();
        if (s.includes('emergency') || s.includes('critical')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle className="text-red-500" size={14} /> };
        if (s.includes('high') || s.includes('urgent')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: <AlertCircle className="text-orange-500" size={14} /> };
        if (s.includes('moderate')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="text-amber-500" size={14} /> };
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="text-emerald-500" size={14} /> };
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[10000]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                .chat-scrollbar::-webkit-scrollbar { width: 5px; }
                .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .chat-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes typing { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
                .typing-dot { animation: typing 1.2s infinite; }
                .glass-sidebar { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); }
                .message-bubble-ai { background: #ffffff; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
                .message-bubble-user { background: #0066FF; color: white; }
                @media (max-width: 640px) {
                    .portal-window { width: 100vw !important; height: 100vh !important; bottom: 0 !important; right: 0 !important; border-radius: 0 !important; }
                }
            `}</style>

            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="fixed bottom-6 right-6 w-16 h-16 rounded-[22px] bg-[#0066FF] text-white flex items-center justify-center shadow-2xl pointer-events-auto z-[2000] group overflow-hidden"
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                    >
                        <BrainCircuit size={30} className="relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className={`fixed bottom-6 right-6 z-[9999] bg-white shadow-2xl overflow-hidden transition-all duration-500 pointer-events-auto portal-window
                            ${isFullscreen ? 'inset-0 !w-full !h-full rounded-0' : 'w-[950px] max-w-[95vw] h-[750px] max-h-[90vh] rounded-[32px] border border-slate-200'}
                        `}
                    >
                        <div className="flex h-full w-full relative">
                            {/* Mobile Overlay Backdrop */}
                            {isMobile && isSidebarOpen && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100]"
                                />
                            )}

                            {/* Sidebar - Chat History (Drawer on Mobile) */}
                            <motion.div 
                                initial={false}
                                animate={{ 
                                    width: isMobile ? (isSidebarOpen ? '85%' : '0%') : (isSidebarOpen ? '280px' : '0px'),
                                    opacity: isSidebarOpen ? 1 : 0,
                                    x: isMobile && !isSidebarOpen ? -100 : 0
                                }}
                                className={`glass-sidebar h-full border-r border-slate-100 flex flex-col overflow-hidden z-[101] 
                                    ${isMobile ? 'absolute left-0 top-0 bottom-0 shadow-2xl' : 'relative'}
                                `}
                            >
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">M</div>
                                        <span className="font-bold text-slate-800 text-sm tracking-tight">Portal History</span>
                                    </div>
                                    <button onClick={createNewChat} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 chat-scrollbar">
                                    {Object.values(sessions).sort((a, b) => b.timestamp - a.timestamp).map(session => (
                                        <button 
                                            key={session.id}
                                            onClick={() => {
                                                setActiveChatId(session.id);
                                                if (isMobile) setIsSidebarOpen(false);
                                            }}
                                            className={`w-full p-3 rounded-xl flex items-center gap-3 group transition-all text-left ${activeChatId === session.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-500'}`}
                                        >
                                            <MessageCircle size={16} className={activeChatId === session.id ? 'text-blue-500' : 'text-slate-300'} />
                                            <span className="text-xs font-bold flex-1 truncate">{session.title}</span>
                                            <Trash2 
                                                size={14} 
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all" 
                                                onClick={(e) => deleteChat(session.id, e)}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3 p-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <User size={16} className="text-slate-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-800 truncate">{user.username}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">Standard Account</p>
                                        </div>
                                        <Settings size={14} className="text-slate-300 hover:text-slate-600 cursor-pointer" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Main Chat Area */}
                            <div className="flex-1 flex flex-col relative bg-[#fcfdfe]">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                                        </button>
                                        <div>
                                            <h2 className="font-bold text-slate-900 text-base tracking-tight leading-tight flex items-center gap-2">
                                                MediSync Portal <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] uppercase font-black tracking-widest">v2.0</span>
                                            </h2>
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                Clinical Assistant Online
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                        </button>
                                        <button onClick={() => setIsOpen(false)} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Disclaimer Bar */}
                                <div className="bg-amber-50 px-6 py-2 border-b border-amber-100 flex items-center justify-center gap-2 text-[10px] font-bold text-amber-700">
                                    <AlertCircle size={12} />
                                    This is not medical advice. Consult a doctor for diagnosis.
                                </div>

                                {/* Messages Area */}
                                <div 
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8 chat-scrollbar"
                                >
                                    {messages.map((m, i) => {
                                        if (m.role === 'user') {
                                            return (
                                                <div key={i} className="flex flex-col gap-2 items-end">
                                                    {m.image && <img src={m.image} className="w-48 rounded-2xl border-2 border-white shadow-lg mb-1" />}
                                                    <div className="message-bubble-user px-5 py-3.5 max-w-[85%] text-sm font-medium leading-relaxed rounded-[24px] rounded-br-none shadow-lg">
                                                        {m.text}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const segments = parseAiResponse(m.text);
                                        const sevStyles = getSeverityStyles(segments.severity);

                                        return (
                                            <div key={i} className="flex flex-col gap-5 items-start">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                                                        <BrainCircuit size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Assistant</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => copyToClipboard(m.text)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all">
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="message-bubble-ai p-6 md:p-8 w-full max-w-[90%] rounded-[28px] rounded-tl-none flex flex-col gap-6">
                                                    {/* Assessment */}
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <Stethoscope size={16} className="text-blue-500" />
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Clinical Assessment</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                            {segments.assessment || segments.other}
                                                        </p>
                                                    </div>

                                                    {/* Severity & Department Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${sevStyles.bg} ${sevStyles.border}`}>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Triage Status</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    {sevStyles.icon}
                                                                    <span className={`text-sm font-black ${sevStyles.text}`}>{segments.severity.toUpperCase()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {segments.department && (
                                                            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                                                                    <MapPin size={16} />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Assigned Unit</span>
                                                                    <span className="text-xs font-bold text-slate-700">{segments.department}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Follow-up / Recommendations */}
                                                    {segments.recommendations.length > 0 && (
                                                        <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Activity size={16} className="text-emerald-500" />
                                                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Action Plan</span>
                                                            </div>
                                                            <ul className="flex flex-col gap-3">
                                                                {segments.recommendations.map((rec, ri) => (
                                                                    <li key={ri} className="flex gap-3 text-sm text-slate-600 items-start">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                                                                        <span className="font-medium text-[13px]">{rec}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Map Card */}
                                                    {segments.mapUrl && (
                                                        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group/map relative">
                                                            <div className="h-28 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                                                <div className="absolute inset-0 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2361!3i1589!2m3!1e0!2sm!3i420120488!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')] bg-cover opacity-60"></div>
                                                                <div className="relative z-10 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white animate-bounce shadow-xl">
                                                                    <MapPin size={20} />
                                                                </div>
                                                            </div>
                                                            <div className="p-4 bg-white flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{segments.suggestedHospital || "Recommended Facility"}</h4>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Clinical Navigation Ready</p>
                                                                </div>
                                                                <a 
                                                                    href={segments.mapUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                >
                                                                    Navigate
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action CTA */}
                                                    {segments.action && (
                                                        <div className="mt-2 pt-5 border-t border-slate-100">
                                                            <p className="text-xs text-slate-500 font-medium mb-4 italic leading-relaxed">
                                                                {segments.action}
                                                            </p>
                                                            <button 
                                                                onClick={() => {
                                                                    setIsOpen(false);
                                                                    let url = '/dashboard/booking';
                                                                    if (segments.suggestedDoctor) url += `?doctor=${encodeURIComponent(segments.suggestedDoctor)}`;
                                                                    else if (segments.matchedService) url += `?mode=service&service=${encodeURIComponent(segments.matchedService)}`;
                                                                    navigate(url);
                                                                }}
                                                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group"
                                                            >
                                                                Secure Clinical Booking <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Questions Chips */}
                                                {segments.questions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2 px-1">
                                                        {segments.questions.map((q, qi) => (
                                                            <button 
                                                                key={qi}
                                                                onClick={() => handleSend(q)}
                                                                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
                                                            >
                                                                {q} <Sparkles size={12} className="text-blue-400" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {isLoading && (
                                        <div className="flex flex-col gap-4">
                                            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm max-w-[400px]">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-1.5">
                                                        {[0, 1, 2].map(d => (
                                                            <div key={d} className={`w-2 h-2 rounded-full bg-blue-500 typing-dot`} style={{ animationDelay: `${d * 0.2}s` }}></div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{loadingMessages[loadingStep]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-6 md:p-8 bg-white border-t border-slate-100">
                                    <div className="max-w-[800px] mx-auto relative flex items-center bg-slate-50 rounded-[28px] border border-slate-200 p-2 transition-all focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-xl shadow-inner">
                                        <div className="flex gap-1 pl-2">
                                            <label className="p-2.5 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100">
                                                <Paperclip size={20} />
                                                <input type="file" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setImagePreview(reader.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100">
                                                <Mic size={20} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 px-4 relative">
                                            {imagePreview && (
                                                <div className="absolute -top-16 left-0 bg-white p-1 rounded-lg shadow-xl border border-slate-200">
                                                    <img src={imagePreview} className="h-12 w-12 object-cover rounded" />
                                                    <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            )}
                                            <input 
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="Ask a medical question or describe symptoms..."
                                                className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 py-3"
                                            />
                                        </div>

                                        <button 
                                            onClick={() => handleSend()}
                                            disabled={isLoading || (!input.trim() && !imagePreview)}
                                            className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                                        >
                                            <SendHorizontal size={22} />
                                        </button>
                                    </div>
                                    <p className="text-center text-[9px] text-slate-400 mt-4 font-bold uppercase tracking-[2px]">
                                        MediSync Portal Secure AI Node • HIPAA Compliant Environment
                                    </p>
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
