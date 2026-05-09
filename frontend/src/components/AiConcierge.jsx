import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2, RotateCcw, 
    History, Plus, Trash2, Copy, Menu, User, Settings, Info, LogOut, Languages, Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AiConcierge = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeChatId, setActiveChatId] = useState('default');
    const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
    const [language, setLanguage] = useState('English');

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile && window.innerWidth > 1024) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('medisync_chat_sessions');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return {
            'default': {
                id: 'default',
                title: 'Initial Consultation',
                messages: [{ role: 'ai', text: 'MediSync Intelligence Node Active. How can I assist with your clinical journey today?', timestamp: Date.now() }],
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

    const loadingMessages = [
        "Synchronizing Medical Records...",
        "Applying Neural Triage...",
        "Identifying Institutional Nodes...",
        "Finalizing Clinical Reasoning..."
    ];

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % loadingMessages.length);
            }, 1200);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        localStorage.setItem('medisync_chat_sessions', JSON.stringify(sessions));
    }, [sessions, isOpen, isFullscreen, activeChatId]);

    const activeSession = sessions[activeChatId] || sessions['default'];
    const messages = activeSession.messages;

    const handleSend = async (manualInput) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim() && !imagePreview) return;

        const currentImg = imagePreview;
        const userMsg = { role: 'user', text: textToSend, image: currentImg, timestamp: Date.now() };
        
        setSessions(prev => {
            const session = { ...prev[activeChatId] };
            session.messages = [...session.messages, userMsg];
            if (session.messages.length === 2) {
                session.title = textToSend.length > 24 ? textToSend.substring(0, 24) + '...' : textToSend;
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
            const errorMsg = { role: 'ai', text: 'Clinical synchronization failure. Node offline.', timestamp: Date.now() };
            setSessions(prev => {
                const session = { ...prev[activeChatId] };
                session.messages = [...session.messages, errorMsg];
                return { ...prev, [activeChatId]: session };
            });
        } finally {
            setIsLoading(false);
        }
    };

    const parseAiResponse = (text) => {
        const sections = {
            assessment: '',
            riskIndicators: '',
            severity: 'LOW',
            questions: [],
            recommendations: [],
            department: '',
            action: '',
            warning: '',
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
                sections.assessment += l.replace(/clinical assessment:?/i, '').trim() + ' ';
            } else if (lowerL.includes('risk indicators detected')) {
                currentSection = 'riskIndicators';
                sections.riskIndicators += l.replace(/risk indicators detected:?/i, '').trim() + ' ';
            } else if (lowerL.includes('triage level')) {
                currentSection = 'severity';
                const content = l.replace(/triage level:?/i, '').replace(/[\[\]:]/g, '').trim();
                if (content) sections.severity = content;
            } else if (lowerL.includes('follow-up questions')) {
                currentSection = 'questions';
            } else if (lowerL.includes('recommended action')) {
                currentSection = 'action';
                sections.action += l.replace(/recommended action:?/i, '').trim() + ' ';
            } else if (lowerL.includes('suggested department')) {
                currentSection = 'department';
                const content = l.replace(/suggested department:?/i, '').replace(/[:]/, '').trim();
                if (content) sections.department = content;
            } else if (lowerL.includes('emergency warning')) {
                currentSection = 'warning';
                sections.warning += l.replace(/emergency warning:?/i, '').trim() + ' ';
            } else {
                if (currentSection === 'questions' && (l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l))) {
                    sections.questions.push(l.replace(/^[-*\d.]\s*/, ''));
                } else if (currentSection === 'assessment') {
                    sections.assessment += l + ' ';
                } else if (currentSection === 'riskIndicators') {
                    sections.riskIndicators += l + ' ';
                } else if (currentSection === 'action') {
                    sections.action += l + ' ';
                } else if (currentSection === 'warning') {
                    sections.warning += l + ' ';
                } else {
                    sections.other += l + ' ';
                }
            }
        });

        if (!sections.assessment.trim() && sections.other.trim()) sections.assessment = sections.other;
        
        const mapMatch = text.match(/https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=([^)\n\s]+)/);
        const mapUrl = mapMatch ? mapMatch[0] : null;
        
        return { ...sections, mapUrl };
    };

    const getSeverityUI = (severity) => {
        const s = severity.toLowerCase();
        if (s.includes('critical') || s.includes('emergency')) return { label: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', glow: 'emergency-glow emergency-pulse' };
        if (s.includes('moderate') || s.includes('urgent')) return { label: 'MODERATE', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', glow: '' };
        return { label: 'STABLE', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', glow: '' };
    };

    if (!user) return null;

    return (
        <div className={`fixed inset-0 pointer-events-none z-[10000] ${isAccessibilityMode ? 'text-lg' : 'text-base'}`}>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl pointer-events-auto z-[2000] overflow-hidden"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="ai-pulse-ring"></div>
                        <BrainCircuit size={28} className="relative z-10" />
                        <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        className={`fixed z-[9999] bg-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-500 pointer-events-auto portal-window
                            ${isMobile ? 'inset-0 w-full h-[100dvh] rounded-none' : 
                              isFullscreen ? 'inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] rounded-3xl' : 
                              'bottom-8 right-8 w-[950px] max-w-[90vw] h-[800px] max-h-[85vh] rounded-[32px] border border-slate-100'}
                        `}
                    >
                        <div className="flex h-full w-full relative">
                            {/* Sidebar - Context & History */}
                            <motion.div 
                                animate={{ width: isSidebarOpen ? (isMobile ? '0px' : '260px') : '0px', opacity: isSidebarOpen ? 1 : 0 }}
                                className="glass-sidebar h-full flex flex-col overflow-hidden border-r border-slate-50"
                            >
                                <div className="p-6 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <History size={18} />
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm tracking-tight">Intelligence Ledger</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 chat-scrollbar">
                                    {Object.values(sessions).sort((a,b) => b.timestamp - a.timestamp).map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => setActiveChatId(s.id)}
                                            className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group
                                                ${activeChatId === s.id ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 text-slate-500'}
                                            `}
                                        >
                                            <MessageCircle size={16} className={activeChatId === s.id ? 'text-primary' : 'text-slate-300'} />
                                            <span className="text-xs font-bold flex-1 truncate">{s.title}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 bg-slate-50/30">
                                    <button onClick={() => setSessions(prev => ({...prev, [Date.now()]: { id: Date.now().toString(), title: 'New Consultation', messages: [{role:'ai', text:'Node Ready. State your query.', timestamp:Date.now()}], timestamp: Date.now() }}))} className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                                        <Plus size={14} /> New Consultation
                                    </button>
                                </div>
                            </motion.div>

                            {/* Main Interaction Panel */}
                            <div className="flex-1 flex flex-col bg-[#fcfdfe]">
                                {/* Futuristic Header */}
                                <div className="px-6 py-5 md:px-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-[100] pt-[env(safe-area-inset-top,20px)]">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                                            <Menu size={20} />
                                        </button>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">MediSync AI Portal</h2>
                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest">Live Node</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HIPAA COMPLIANT • SECURE SESSION</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setLanguage(prev => prev === 'English' ? 'Hindi' : 'English')} className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2">
                                            <Languages size={18} />
                                            <span className="text-[10px] font-black uppercase hidden md:inline">{language}</span>
                                        </button>
                                        <button onClick={() => setIsAccessibilityMode(!isAccessibilityMode)} className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                                            <Volume2 size={18} />
                                        </button>
                                        <div className="w-px h-6 bg-slate-100 mx-1"></div>
                                        <button onClick={() => setIsOpen(false)} className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Chat Window */}
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8 chat-scrollbar no-scrollbar pb-32">
                                    {messages.map((m, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={i} 
                                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-3`}
                                        >
                                            {m.role === 'ai' && (
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <BrainCircuit size={12} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MediSync Agent</span>
                                                    <span className="text-[8px] text-slate-300 ml-2 font-medium">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            )}

                                            <div className={`
                                                relative p-5 md:p-6 rounded-3xl shadow-sm border max-w-[85%] leading-relaxed
                                                ${m.role === 'user' ? 
                                                  'bg-primary text-white border-primary shadow-primary/20 rounded-tr-none' : 
                                                  'bg-white text-slate-700 border-slate-50 rounded-tl-none'}
                                            `}>
                                                {m.image && <img src={m.image} className="w-full max-w-sm rounded-2xl mb-4 border-2 border-white shadow-xl" />}
                                                
                                                {m.role === 'ai' ? (
                                                    <div className="flex flex-col gap-6">
                                                        {/* Response Processing */}
                                                        {(() => {
                                                            const s = parseAiResponse(m.text);
                                                            const ui = getSeverityUI(s.severity);
                                                            const isCritical = ui.label === 'CRITICAL';

                                                            return (
                                                                <>
                                                                    {/* Critical Emergency Banner / Warning */}
                                                                    {(isCritical || s.warning) && (
                                                                        <div className={`p-5 rounded-2xl ${ui.glow || 'bg-red-50 border border-red-200'} flex flex-col gap-4`}>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2 text-red-600 font-black text-xs">
                                                                                    <AlertCircle size={16} /> EMERGENCY ALERT
                                                                                </div>
                                                                                <span className="px-2 py-1 rounded-md bg-red-600 text-white text-[8px] font-black uppercase">Immediate Action</span>
                                                                            </div>
                                                                            {s.warning && <p className="text-xs font-bold text-red-700 leading-relaxed italic">{s.warning}</p>}
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                <button onClick={() => navigate('/dashboard/booking?service=Ambulance')} className="py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                                                                                    <HeartPulse size={14} /> Dispatch Ambulance
                                                                                </button>
                                                                                <button className="py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                                                                                    <MapPin size={14} /> Nearest Hospital
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-col gap-4">
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Activity size={14} className="text-primary" />
                                                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Clinical Assessment</span>
                                                                            </div>
                                                                            <p className="text-[13px] md:text-sm font-medium text-slate-700 leading-relaxed">
                                                                                {s.assessment || s.other}
                                                                            </p>
                                                                        </div>

                                                                        {s.riskIndicators && (
                                                                            <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <AlertCircle size={14} className="text-amber-500" />
                                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Indicators detected</span>
                                                                                </div>
                                                                                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                                                                    {s.riskIndicators}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Clinical Grid */}
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className={`p-4 rounded-2xl border ${ui.bg} ${ui.border} flex flex-col gap-1`}>
                                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">TRIAGE STATUS</span>
                                                                            <span className={`text-xs font-black ${ui.color}`}>{ui.label}</span>
                                                                        </div>
                                                                        {s.department && (
                                                                            <div className="p-4 rounded-2xl border border-slate-50 bg-slate-50/50 flex flex-col gap-1">
                                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">SUGGESTED DEPT</span>
                                                                                <span className="text-xs font-black text-slate-700 truncate">{s.department}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Map Preview */}
                                                                    {s.mapUrl && (
                                                                        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                                            <div className="h-24 bg-slate-100 flex items-center justify-center relative overflow-hidden bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2361!3i1589!2m3!1e0!2sm!3i420120488!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')] bg-cover">
                                                                                <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-xl">
                                                                                    <MapPin size={16} />
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-3 bg-white flex items-center justify-between">
                                                                                <span className="text-[10px] font-bold text-slate-800">Nearby Institutional Node</span>
                                                                                <a href={s.mapUrl} target="_blank" className="text-[9px] font-black uppercase text-primary hover:underline">Launch Navigation</a>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {s.action && (
                                                                        <button 
                                                                            onClick={() => navigate('/dashboard/booking')}
                                                                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary/20 group hover:bg-blue-600 transition-all"
                                                                        >
                                                                            Secure Clinical Booking <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <p className="text-[13px] md:text-sm font-semibold">{m.text}</p>
                                                )}
                                            </div>

                                            {m.role === 'ai' && (
                                                <div className="flex gap-2 mt-2 px-1">
                                                    <button onClick={() => copyToClipboard(m.text)} className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-all"><Copy size={14}/></button>
                                                    <button className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-all"><RotateCcw size={14}/></button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex flex-col gap-4">
                                            <div className="p-8 rounded-3xl bg-white border border-slate-50 shadow-sm max-w-[320px] flex items-center gap-4">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{loadingMessages[loadingStep]}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Smart Input Node */}
                                <div className="p-6 md:p-8 bg-white border-t border-slate-50 sticky bottom-0 z-[101]">
                                    {/* Action Chips */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
                                        {["Book Ambulance", "Find Hospital", "Talk to Doctor", "Check Symptoms", "Emergency Contact"].map(chip => (
                                            <button key={chip} onClick={() => handleSend(chip)} className="shrink-0 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm">
                                                {chip}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="max-w-[800px] mx-auto relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[24px] p-2 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-primary/5 transition-all">
                                        <label className="p-3 text-slate-400 hover:text-primary cursor-pointer">
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
                                        
                                        <div className="flex-1 px-2 relative">
                                            {imagePreview && (
                                                <div className="absolute -top-16 left-0 bg-white p-1.5 rounded-xl shadow-2xl border border-slate-100">
                                                    <img src={imagePreview} className="h-10 w-10 object-cover rounded-lg" />
                                                    <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X size={10} /></button>
                                                </div>
                                            )}
                                            <input 
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder="State your symptoms or medical query..."
                                                className="w-full bg-transparent border-none outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400 py-3"
                                            />
                                        </div>

                                        <button className="p-3 text-slate-400 hover:text-primary transition-colors"><Mic size={20} /></button>
                                        
                                        <button 
                                            onClick={() => handleSend()}
                                            disabled={isLoading || (!input.trim() && !imagePreview)}
                                            className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <SendHorizontal size={22} />
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
