import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit, Calendar, Paperclip,
    ChevronRight, AlertCircle, Clock, Stethoscope, MapPin, CheckCircle2
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

        const lines = text.split('\n');
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
                    sections.action = l.replace(/^[-*]\s*/, '').replace(/[:]/, '').trim();
                } else {
                    sections.other += (l + ' ');
                }
            }
        });

        return sections;
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
                    border-radius: 20px;
                    padding: 16px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                    transition: all 0.3s ease;
                }
                .ai-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
                    border-color: var(--primary-theme-border);
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
                        className="fixed bottom-8 right-8 bg-[#F8FAFC] rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden pointer-events-auto border border-white/50"
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, y: 0, scale: 1,
                            width: isFullscreen ? 'min(1200px, calc(100vw - 64px))' : '420px',
                            height: isFullscreen ? 'calc(100vh - 64px)' : '720px'
                        }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    >
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0066FF]">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800 tracking-tight">MediSync AI Concierge</h2>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Node • v4.0</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Top Context Bar */}
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

                        {/* Chat Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
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
                                        {/* Clinical Assessment Card */}
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

                                        {/* Severity & Triage Info */}
                                        <div className="flex gap-3">
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className={`flex-1 ai-card flex items-center justify-between ${sevStyles.bg} ${sevStyles.border}`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Severity</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {sevStyles.icon}
                                                        <span className={`text-sm font-black ${sevStyles.text}`}>{segments.severity.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                            
                                            {segments.department && (
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
                                        {(m.text.includes('google.com/maps') || segments.action.includes('google.com/maps')) && (
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
                                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDKFDakzgMgcHol8PQijByDzFuyRty91VA&q=${encodeURIComponent(
                                                        (m.text.match(/query=([^&]+)/) || segments.action.match(/query=([^&]+)/) || [null, 'Hospital'])[1]?.replace(/\+/g, ' ') || 'Hospital'
                                                    )}`}
                                                ></iframe>
                                            </motion.div>
                                        )}

                                        {/* Actionable CTA */}
                                        {segments.action && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.4 }}
                                                className="p-5 rounded-[24px] bg-gradient-to-br from-[#0066FF] to-[#0052CC] text-white shadow-xl shadow-blue-200"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Calendar size={20} className="opacity-80" />
                                                    <span className="text-[11px] font-black uppercase tracking-[2px]">Recommended Action</span>
                                                </div>
                                                <p className="text-sm font-semibold mb-5 leading-relaxed">
                                                    {segments.action.split('http')[0].trim()}
                                                </p>
                                                <button 
                                                    onClick={() => navigate('/booking')}
                                                    className="w-full bg-white text-[#0066FF] py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg"
                                                >
                                                    Book Consultation <ChevronRight size={18} />
                                                </button>
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
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative flex items-center bg-slate-50 rounded-[24px] border border-slate-100 p-1.5 transition-all focus-within:border-[#0066FF]/30 focus-within:bg-white focus-within:shadow-inner">
                                    <label className="p-2 text-slate-400 hover:text-[#0066FF] cursor-pointer transition-colors">
                                        <Paperclip size={20} />
                                        <input type="file" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Describe your symptoms..."
                                        className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                    <button 
                                        onClick={isListening ? stopListening : startListening}
                                        className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:text-[#0066FF]'}`}
                                    >
                                        <Mic size={20} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleSend()}
                                    className="w-12 h-12 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-[#0052CC] transition-all transform active:scale-95"
                                >
                                    <SendHorizontal size={22} />
                                </button>
                            </div>
                            
                            {!location && (
                                <button onClick={requestLocation} className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0066FF] transition-colors">
                                    <MapPin size={12} /> Sync Patient Geolocation
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiConcierge;
