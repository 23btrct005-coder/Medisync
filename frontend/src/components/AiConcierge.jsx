import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2, RotateCcw, 
    History, Plus, Trash2, Copy, Menu, User, Settings, Info, LogOut, Languages, Volume2, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AiConcierge = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeChatId, setActiveChatId] = useState('default');
    
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
    const [imagePreview, setImagePreview] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        localStorage.setItem('medisync_chat_sessions', JSON.stringify(sessions));
    }, [sessions, isOpen, activeChatId]);

    const activeSession = sessions[activeChatId] || sessions['default'];
    const messages = activeSession.messages;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Clinical insights copied');
    };

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
            possibleConditions: '',
            riskIndicators: '',
            severity: 'LOW',
            specialist: '',
            action: '',
            questions: [],
            warning: '',
            other: ''
        };

        const lines = text.replace(/[#*_]/g, '').split('\n');
        let currentSection = 'other';

        lines.forEach(line => {
            const l = line.trim();
            if (!l) return;
            const lowerL = l.toLowerCase();
            
            if (lowerL.includes('clinical assessment') || lowerL.includes('initial assessment')) {
                currentSection = 'assessment';
                sections.assessment += l.replace(/(clinical|initial) assessment:?/i, '').trim() + ' ';
            } else if (lowerL.includes('possible conditions')) {
                currentSection = 'possibleConditions';
                sections.possibleConditions += l.replace(/possible conditions:?/i, '').trim() + ' ';
            } else if (lowerL.includes('risk indicators') || lowerL.includes('red flags')) {
                currentSection = 'riskIndicators';
                sections.riskIndicators += l.replace(/(risk indicators|red flags):?/i, '').trim() + ' ';
            } else if (lowerL.includes('triage level')) {
                currentSection = 'severity';
                const content = l.replace(/triage level:?/i, '').replace(/[\[\]:]/g, '').trim();
                if (content) sections.severity = content;
            } else if (lowerL.includes('recommended specialist')) {
                currentSection = 'specialist';
                sections.specialist += l.replace(/recommended specialist:?/i, '').trim() + ' ';
            } else if (lowerL.includes('suggested next steps')) {
                currentSection = 'action';
                sections.action += l.replace(/suggested next steps:?/i, '').trim() + ' ';
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

        if (!sections.assessment.trim() && sections.other.trim()) sections.assessment = sections.other;
        
        return sections;
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[10000]">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-2xl pointer-events-auto z-[2000] overflow-hidden"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                    >
                        <BrainCircuit size={28} />
                        <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        className={`fixed bottom-8 right-8 z-[9999] bg-white shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto flex flex-col
                            ${isFullscreen ? 'inset-4 w-auto h-auto rounded-3xl' : 'w-[400px] h-[600px] rounded-3xl border border-slate-100'}
                        `}
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-500 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <BrainCircuit size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold">MediSync Assistant</h2>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <span className="text-[10px] text-indigo-100 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50">
                            {messages.map((m, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i} 
                                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
                                >
                                    <div className={`
                                        max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm
                                        ${m.role === 'user' 
                                            ? 'bg-indigo-500 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}
                                    `}>
                                        {m.image && <img src={m.image} className="w-full rounded-lg mb-2" />}
                                        {m.role === 'ai' ? (
                                            <div className="flex flex-col gap-4">
                                                {(() => {
                                                    const s = parseAiResponse(m.text);
                                                    return (
                                                        <>
                                                            {s.assessment && <p>{s.assessment}</p>}
                                                            {s.severity && (
                                                                <div className="p-3 rounded-xl bg-slate-100/50 border border-slate-200">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Triage Level</span>
                                                                    <p className={`text-xs font-black mt-0.5 ${
                                                                        s.severity.includes('CRITICAL') ? 'text-red-500' :
                                                                        s.severity.includes('HIGH') ? 'text-amber-500' : 'text-emerald-500'
                                                                    }`}>{s.severity}</p>
                                                                </div>
                                                            )}
                                                            {s.specialist && (
                                                                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Recommendation</span>
                                                                    <p className="text-xs font-black text-indigo-600 mt-0.5">{s.specialist}</p>
                                                                </div>
                                                            )}
                                                            {!s.assessment && !s.severity && <p>{m.text}</p>}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ) : m.text}
                                    </div>
                                    <span className="text-[10px] text-slate-300 font-bold px-2">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-1 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                                {["Explain symptoms", "Talk to Doctor", "Emergency Help"].map(chip => (
                                    <button key={chip} onClick={() => handleSend(chip)} className="shrink-0 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-500 hover:bg-indigo-100 transition-all">
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 focus-within:border-indigo-300 focus-within:bg-white transition-all">
                                    <label className="p-2 text-slate-400 hover:text-indigo-500 cursor-pointer transition-all">
                                        <Paperclip size={18} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagePreview(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </label>
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask me anything..."
                                        className="flex-1 bg-transparent border-none outline-none text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 py-2 px-1"
                                    />
                                    {imagePreview && (
                                        <div className="relative w-8 h-8 mr-2">
                                            <img src={imagePreview} className="w-full h-full object-cover rounded-lg" />
                                            <button onClick={() => setImagePreview(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleSend()}
                                    disabled={isLoading || (!input.trim() && !imagePreview)}
                                    className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <SendHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiConcierge;
