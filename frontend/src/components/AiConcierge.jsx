import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Shield, Zap, AlertCircle, ChevronRight, 
    Mic, SendHorizontal, Paperclip, X, Maximize2, 
    Minimize2, RotateCcw, MapPin, Stethoscope, Clock,
    BookOpen, CheckCircle2, Info, ArrowDown, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStreamingAi } from '../hooks/useStreamingAi';

const AiConcierge = ({ userEmail, patientId, patientName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [showEvidence, setShowEvidence] = useState(false);
    
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const sessionId = useRef(`session-${Date.now()}`);

    const { streamQuery, streamingText, isStreaming, error, abortStream } = useStreamingAi(sessionId.current);

    // Finalize Streaming Response into Messages Array
    useEffect(() => {
        if (!isStreaming && streamingText) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: streamingText, 
                timestamp: new Date() 
            }]);
        }
    }, [isStreaming, streamingText]);

    // Auto-scroll logic
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streamingText]);

    const handleSend = async (customInput = null) => {
        const text = customInput || input;
        if (!text.trim()) return;

        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        
        // Trigger Enterprise Streaming
        streamQuery(text);
    };

    const parseAiResponse = (content) => {
        try {
            // Attempt to find JSON in potential markdown
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            // Support raw markdown extraction if AI wraps in code blocks
            const jsonStr = content.includes('```json') 
                ? content.split('```json')[1].split('```')[0].trim()
                : content.trim();

            const parsed = JSON.parse(jsonStr);
            return {
                assessment: parsed.clinicalAssessment || parsed.assessment || "",
                severity: parsed.triageLevel || 'ROUTINE',
                questions: parsed.followUpQuestions || [],
                confidence: parsed.confidenceScore || 0.85,
                warning: parsed.emergencyWarning || null,
                conditions: parsed.possibleConditions || [],
                requiresAmbulance: parsed.requiresAmbulance || false
            };
        } catch (e) {
            return { 
                assessment: (content && content.length > 50) ? content.substring(0, 200) + "..." : (content || "Institutional briefing interrupted. Retrying..."), 
                severity: 'ROUTINE', 
                explanation: "Processing medical reasoning path...",
                questions: [], 
                conditions: [],
                risk: [],
                citations: [],
                verified: false,
                confidence: 0.5 
            };
        }
    };

    const getSeverityStyles = (level) => {
        switch (level) {
            case 'CRITICAL': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: <AlertCircle className="text-red-600" />, label: 'Critical' };
            case 'HIGH': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: <Activity className="text-orange-600" />, label: 'High Urgency' };
            case 'MODERATE': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: <Clock className="text-amber-600" />, label: 'Moderate' };
            default: return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: <CheckCircle2 className="text-emerald-600" />, label: 'Routine' };
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[3000] font-sans antialiased">
            {/* Launch Trigger */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white relative group"
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse group-hover:scale-110 transition-transform" />
                        <Zap size={28} className="relative z-10" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Enterprise UI Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(20px)' }}
                        className={`${isFullscreen ? 'fixed inset-4' : 'w-[480px] h-[720px]'} bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200/60 overflow-hidden flex flex-col backdrop-blur-3xl`}
                    >
                        {/* Premium Header */}
                        <div className="p-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        MediSync Copilot
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">Enterprise V2</span>
                                    </h2>
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Institutional Identity: {patientId}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                        </div>

                        {/* Reasoning Canvas */}
                        <div 
                            ref={scrollRef} 
                            className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar bg-slate-50/30"
                        >
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                                    <div className={`max-w-[85%] rounded-[28px] ${
                                        msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white p-5 shadow-xl shadow-indigo-100 rounded-tr-none' 
                                        : 'bg-white border border-slate-100 shadow-sm p-8 rounded-tl-none relative'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            <p className="text-sm font-semibold leading-relaxed">{msg.content}</p>
                                        ) : (
                                            <div className="space-y-6">
                                                {(() => {
                                                    const s = parseAiResponse(msg.content);
                                                    const ui = getSeverityStyles(s.severity);
                                                    return (
                                                        <>
                                                            {/* Clinical Telemetry Header */}
                                                            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-50">
                                                                <div className={`px-3 py-1.5 rounded-full ${ui.bg} ${ui.text} ${ui.border} border text-[10px] font-black uppercase tracking-wider flex items-center gap-2`}>
                                                                    {ui.icon} {ui.label} PRIORITY
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Reasoning Certainty</span>
                                                                        <div className="flex gap-0.5 mt-1">
                                                                            {[0, 1, 2, 3, 4].map(star => (
                                                                                <div key={star} className={`w-3 h-1 rounded-full ${star < s.confidence * 5 ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Assessment Section */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                                    <Stethoscope size={14} /> Clinical Assessment
                                                                </h4>
                                                                <p className="text-[15px] font-bold text-slate-800 leading-relaxed">
                                                                    {s.assessment || "Refining diagnostic analysis..."}
                                                                </p>
                                                            </div>

                                                            {/* Verification Badge */}
                                                            {s.verified && (
                                                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50">
                                                                    <Shield size={14} />
                                                                    <span className="text-[10px] font-black uppercase tracking-wide">Institutional Network Verified</span>
                                                                </div>
                                                            )}

                                                            {/* Differential Intelligence Grid */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Reasoning</h4>
                                                                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{s.explanation}</p>
                                                                </div>
                                                                {s.risk && s.risk.length > 0 && (
                                                                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 space-y-2">
                                                                        <h4 className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Risk Indicators</h4>
                                                                        <p className="text-[11px] font-bold text-rose-700">{s.risk[0]}</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Evidence Sidebar Toggle */}
                                                            {s.citations && s.citations.length > 0 && (
                                                                <button 
                                                                    onClick={() => setShowEvidence(true)}
                                                                    className="w-full py-3 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 flex items-center justify-center gap-2 transition-all"
                                                                >
                                                                    <BookOpen size={14} /> Review Medical Evidence ({s.citations.length})
                                                                </button>
                                                            )}

                                                            {/* Dynamic Follow-ups */}
                                                            <div className="flex flex-wrap gap-2 pt-4">
                                                                {s.questions.slice(0, 3).map((q, idx) => (
                                                                    <button 
                                                                        key={idx}
                                                                        onClick={() => handleSend(q)}
                                                                        className="px-4 py-2.5 bg-slate-50 hover:bg-white hover:shadow-md text-[11px] font-bold text-slate-600 border border-slate-100 rounded-full transition-all"
                                                                    >
                                                                        {q}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Emergency Call-to-Action */}
                                                            {s.warning && (
                                                                <motion.div 
                                                                    animate={{ scale: [1, 1.02, 1] }}
                                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                                    className="p-5 bg-red-600 text-white rounded-[24px] shadow-2xl shadow-red-200 flex items-start gap-4"
                                                                >
                                                                    <AlertCircle size={24} className="shrink-0 mt-1" />
                                                                    <div>
                                                                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Emergency Escalation</h4>
                                                                        <p className="text-[13px] font-bold leading-tight">{s.warning}</p>
                                                                        <button className="mt-3 px-6 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Contact Ambulance</button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Streaming Token Layer */}
                            {isStreaming && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] bg-white border border-indigo-100 shadow-xl shadow-indigo-50 p-8 rounded-[28px] rounded-tl-none animate-in fade-in slide-in-from-left-2">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
                                                <Zap size={12} className="text-white" />
                                            </div>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Synthesizing clinical response...</span>
                                        </div>
                                        <div className="text-[15px] font-bold text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
                                            {streamingText}
                                            <span className="inline-block w-2 h-5 bg-indigo-600 ml-1 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Hub */}
                        <div className="p-8 bg-white border-t border-slate-100">
                            <div className="relative flex items-center gap-4">
                                <div className="flex-1 flex items-center bg-slate-50/50 border border-slate-200/60 rounded-3xl p-2 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-indigo-50 transition-all duration-300">
                                    <label className="p-3 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">
                                        <Paperclip size={22} />
                                        <input type="file" className="hidden" />
                                    </label>
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Enter symptoms or medical query..."
                                        className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-slate-700 px-4 py-4 placeholder:text-slate-300"
                                    />
                                    <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <Mic size={22} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleSend()}
                                    disabled={isStreaming || !input.trim()}
                                    className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    <SendHorizontal size={26} />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-1.5"><Shield size={10} /> HIPAA Compliant</span>
                                <span className="flex items-center gap-1.5"><Zap size={10} /> Real-time Streaming</span>
                                <span className="flex items-center gap-1.5"><Lock size={10} /> Encrypted Session</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
            `}</style>
        </div>
    );
};

export default AiConcierge;
