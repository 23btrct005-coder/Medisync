import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SendHorizontal, X, Mic, StopCircle, Maximize2, Minimize2, 
    MessageCircle, Sparkles, Activity, ShieldCheck, HeartPulse, BrainCircuit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AiConcierge = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hi! How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [location, setLocation] = useState(null);
    const [voices, setVoices] = useState([]);
    
    const scrollRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isOpen, isFullscreen]);

    const [streamingText, setStreamingText] = useState({});

    useEffect(() => {
        const latestMsg = messages[messages.length - 1];
        if (latestMsg && latestMsg.role === 'ai') {
            const msgId = messages.length - 1;
            let i = 0;
            const fullText = latestMsg.text;
            
            // Fast streaming feel
            const interval = setInterval(() => {
                setStreamingText(prev => ({
                    ...prev,
                    [msgId]: fullText.slice(0, i + 30)
                }));
                i += 30;
                if (i >= fullText.length) {
                    clearInterval(interval);
                    setStreamingText(prev => ({ ...prev, [msgId]: fullText }));
                }
            }, 30);
            return () => clearInterval(interval);
        }
    }, [messages]);

    // Auth Guard: Only show AI Concierge after a secure session is established
    if (!user) return null;

    const languages = [
        { code: 'en-IN', name: 'English', flag: '🇺🇸' },
        { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
        { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
        { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
        { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
        { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' }
    ];

    const speak = (text) => {
        if (!isVoiceEnabled) return;
        window.speechSynthesis.cancel();
        
        // Advanced Filtering: Strip emojis, markdown symbols, and technical coordinates
        let cleanText = text
            .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
            .replace(/[*_#]/g, '')           // Remove markdown formatting
            .replace(/-?\d+\.\d+,\s*-?\d+\.\d+/g, '') // Suppress coordinates in speech
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // Suppress emojis
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Premium Voice Selection Logic - Prioritize Natural/Premium voices
        const allVoices = window.speechSynthesis.getVoices();
        const langCode = selectedLang.split('-')[0];
        
        const preferredVoices = allVoices.filter(v => 
            v.lang.includes(langCode) && 
            (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Google'))
        );
        
        if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
        }
        
        utterance.lang = selectedLang;
        utterance.rate = 0.95; // Slightly slower for better clarity
        utterance.pitch = 1.0; 
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setMessages(prev => [...prev, { role: 'ai', text: '📡 Geolocation logic is restricted by your browser in this non-secure context. To unlock high-precision clinical mapping and nearby hospital detection, please switch to the **Secure Tunnel (HTTPS)**.' }]);
            return;
        }
        
        setMessages(prev => [...prev, { role: 'ai', text: '📡 Initializing Geolocation Protocol... Please authorize access to find nearby clinical facilities.' }]);
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const locData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(locData);
                setMessages(prev => [...prev, { role: 'ai', text: `📍 Location Synchronized: [${locData.lat.toFixed(4)}, ${locData.lng.toFixed(4)}]. I can now provide hyper-localized clinical insights.` }]);
                speak("Location synchronized. I am now providing localized triage.");
            },
            (err) => {
                console.warn("GEOLOCATION_RESTRICTED:", err);
                setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Geolocation Restricted. This usually occurs on insecure links (HTTP). I will continue using your profile\'s medical node for clinical context, or you can switch to the **Secure Tunnel** for full precision.' }]);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    };

    const handleSend = async (manualInput) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
        setInput('');
        setIsLoading(true);

        try {
            const context = {
                path: window.location.pathname,
                title: document.title
            };
            
            const res = await api.post('/ai/chat', { 
                message: textToSend,
                location: location ? `${location.lat},${location.lng}` : null,
                context: context, // Provide current page context to AI
                history: messages.slice(-5) // Send last 5 messages for context
            });
            const aiMsg = { role: 'ai', text: res.data.response };
            setMessages(prev => [...prev, aiMsg]);
            speak(res.data.response);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to Clinical Brain. Please login.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert('Speech recognition not supported in this browser. Please use Chrome.');
        
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLang;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.start();
    };

    return (
        <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes wave {
                    0% { height: 4px; }
                    50% { height: 16px; }
                    100% { height: 4px; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                @media (max-width: 768px) {
                    .ai-chat-container {
                        width: 100% !important;
                        height: 100% !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        border-radius: 0 !important;
                    }
                    .ai-trigger-btn {
                        width: 50px !important;
                        height: 50px !important;
                        font-size: 20px !important;
                        bottom: 90px !important;
                        right: 20px !important;
                    }
                }
            `}</style>

            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="ai-trigger-btn"
                        drag
                        dragConstraints={containerRef}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
                        onClick={() => !isDragging && setIsOpen(true)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ 
                            position: 'fixed',
                            bottom: '30px', 
                            right: '30px', 
                            width: '65px', 
                            height: '65px', 
                            borderRadius: '24px', 
                            backgroundColor: '#A78BFA', 
                            border: 'none', 
                            color: 'white', 
                            cursor: 'pointer', 
                            boxShadow: '0 12px 40px rgba(167, 139, 250, 0.4)', 
                            zIndex: 1001,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <MessageCircle size={28} fill="currentColor" fillOpacity={0.2} />
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div 
                        className="ai-chat-container"
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ 
                            y: 0, 
                            opacity: 1, 
                            scale: 1,
                            width: isFullscreen ? 'min(1200px, calc(100vw - 60px))' : '400px',
                            height: isFullscreen ? 'calc(100vh - 60px)' : 'min(700px, calc(100vh - 60px))'
                        }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{ 
                            position: 'fixed',
                            bottom: '30px',
                            right: '30px',
                            backgroundColor: 'white', 
                            borderRadius: '32px', 
                            boxShadow: '0 30px 100px rgba(0,0,0,0.3)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            overflow: 'hidden', 
                            border: '1px solid rgba(0,0,0,0.05)',
                            zIndex: 1002,
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px 24px', backgroundColor: 'white', borderBottom: '1px solid #f1f5f9', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '8px', height: '8px', backgroundColor: '#A78BFA', borderRadius: '50%', boxShadow: '0 0 10px #A78BFA', animation: 'pulse 2s infinite' }}></div>
                                <h2 style={{ fontWeight: '800', fontSize: '18px', tracking: '-0.025em' }}>Smart Assistant</h2>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button 
                                    onClick={() => setIsFullscreen(!isFullscreen)} 
                                    style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                >
                                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Voice & Lang - Simplified */}
                        <div style={{ padding: '8px 24px', backgroundColor: '#fcfdfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                            <div className="custom-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0' }}>
                                {languages.map(l => (
                                    <button key={l.code} onClick={() => setSelectedLang(l.code)} style={{ padding: '4px 10px', borderRadius: '8px', border: selectedLang === l.code ? '1px solid #A78BFA' : '1px solid transparent', fontSize: '10px', fontWeight: '700', backgroundColor: selectedLang === l.code ? '#F5F3FF' : 'white', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s', color: selectedLang === l.code ? '#7C3AED' : '#94a3b8' }}>
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} style={{ padding: '6px', borderRadius: '8px', backgroundColor: isVoiceEnabled ? '#F5F3FF' : 'transparent', border: 'none', color: isVoiceEnabled ? '#7C3AED' : '#cbd5e1', cursor: 'pointer' }}>
                                {isVoiceEnabled ? <HeartPulse size={16} className="animate-pulse" /> : <Mic size={16} />}
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="custom-scrollbar" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#fcfdfe' }}>
                            {messages.map((m, i) => {
                                const isHighRisk = m.text.includes('HIGH') || m.text.includes('CRITICAL');
                                const isGreeting = i === 0 && m.role === 'ai';
                                const displayText = streamingText[i] || m.text;
                                
                                return (
                                    <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {m.role === 'ai' && !isHighRisk && !isGreeting && i % 3 === 0 && (
                                            <div style={{ fontSize: '40px', marginBottom: '-10px', marginLeft: '10px', animation: 'bounce 2s infinite' }}>
                                                {m.text.includes('medicine') ? '💊' : (m.text.includes('heart') ? '❤️' : '✨')}
                                            </div>
                                        )}

                                        <div style={{ padding: '16px 20px', borderRadius: m.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px', backgroundColor: isHighRisk ? '#fff1f2' : (m.role === 'user' ? '#0066FF' : 'white'), color: m.role === 'user' ? 'white' : '#334155', boxShadow: m.role === 'user' ? '0 8px 25px rgba(0,102,255,0.2)' : '0 10px 40px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.6', border: isHighRisk ? '2px solid #fda4af' : 'none', position: 'relative' }}>
                                            {m.role === 'ai' && !isHighRisk && <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: '#0066FF', opacity: 0.8, borderRadius: '24px 0 0 24px' }} />}
                                            
                                            {displayText.split('\n').map((l, li) => {
                                                const line = l.trim();
                                                if (!line) return <div key={li} style={{ height: '8px' }} />;

                                                if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
                                                    const title = line.replace(/#/g, '').trim();
                                                    return (
                                                        <div key={li} style={{ backgroundColor: m.role === 'user' ? 'rgba(255,255,255,0.1)' : `#0066FF08`, padding: '8px 12px', borderRadius: '10px', margin: '12px 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: m.role === 'user' ? 'white' : '#0066FF' }}></div>
                                                            <span style={{ fontWeight: '900', fontSize: '11px', color: m.role === 'user' ? 'white' : '#0066FF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</span>
                                                        </div>
                                                    );
                                                }

                                                const coordMatch = line.match(/-?\d+\.\d+,\s*-?\d+\.\d+/);
                                                const hasCoords = !!coordMatch;
                                                const isLocation = line.toLowerCase().includes('location') || line.toLowerCase().includes('address') || line.toLowerCase().includes('hospital');
                                                const isPureCoordLine = hasCoords && line.trim().length < 40;

                                                if (line.startsWith('-') || line.startsWith('•') || line.length > 60 || hasCoords || isLocation) {
                                                    const query = line.replace(/#|-|•/g, '').trim();
                                                    const encodedQuery = encodeURIComponent(hasCoords ? coordMatch[0] : query);
                                                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                                                    const mapUrl = (apiKey && apiKey !== "REPLACE_WITH_YOUR_GOOGLE_MAPS_API_KEY") 
                                                        ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`
                                                        : `https://maps.google.com/maps?q=${encodedQuery}&output=embed&z=15`;

                                                    return (
                                                        <div key={li} style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
                                                            {!isPureCoordLine && (
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                                                    <div style={{ marginTop: '7px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: m.role === 'user' ? 'white' : '#94a3b8', flexShrink: 0 }}></div>
                                                                    <span style={{ fontWeight: '500' }}>{line.startsWith('-') || line.startsWith('•') ? line.substring(1).trim() : line}</span>
                                                                </div>
                                                            )}
                                                            {(isLocation || hasCoords) && (
                                                                <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                                                                    <iframe width="100%" height="150" style={{ border: 0 }} loading="lazy" src={mapUrl}></iframe>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                if (line.includes('(/dashboard')) {
                                                    const match = line.match(/\[(.*?)\]\((.*?)\)/);
                                                    const label = match ? match[1] : "LAUNCH CLINICAL PORTAL";
                                                    const url = match ? match[2] : line.match(/\((.*?)\)/)[1];
                                                    return <button key={li} onClick={() => { setIsOpen(false); window.location.href = url; }} style={{ width: '100%', marginTop: '12px', padding: '14px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '11px', letterSpacing: '1px', boxShadow: '0 8px 20px rgba(0,102,255,0.2)', textTransform: 'uppercase' }}>{label}</button>;
                                                }

                                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                                return (
                                                    <div key={li} style={{ color: m.role === 'user' ? 'white' : (isHighRisk ? '#991b1b' : '#334155') }}>
                                                        {parts.map((p, pi) => p.startsWith('**') ? <strong key={pi} style={{ color: m.role === 'user' ? 'white' : '#0f172a', fontWeight: '800' }}>{p.replace(/\*\*/g, '')}</strong> : p)}
                                                    </div>
                                                );
                                            })}

                                            {m.role === 'ai' && i === 0 && !location && (
                                                <button onClick={requestLocation} style={{ marginTop: '16px', width: '100%', padding: '14px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '10px', fontWeight: '900', boxShadow: '0 8px 20px rgba(0,102,255,0.15)' }}>🛰️ ENABLE LIVE GEOLOCATION</button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '9px', opacity: 0.4, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', padding: '0 8px', fontWeight: '800' }}>
                                            {m.role === 'ai' ? 'CLINICAL BRAIN' : 'YOU'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {isLoading && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px' }}>
                                    {[0, 1, 2].map(dot => <div key={dot} style={{ width: '6px', height: '6px', backgroundColor: '#0066FF', borderRadius: '50%', animation: `bounce 1s infinite ${dot * 0.2}s` }} />)}
                                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', letterSpacing: '1px' }}>ANALYZING...</div>
                                </div>
                            )}
                            
                             {!isLoading && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                    {[
                                        { label: "Explain today's forecast", query: "Can you explain my health forecast for today?" },
                                        { label: "Why did my integrity score drop?", query: "Why did my clinical integrity score drop?" },
                                        { label: "Medication status summary", query: "Give me a summary of my active medications" },
                                        { label: "Clinical trend analysis", query: "Analyze my clinical health trends" }
                                    ].map((chip, ci) => (
                                        <button 
                                            key={ci} 
                                            onClick={() => handleSend(chip.query)} 
                                            style={{ 
                                                width: 'fit-content',
                                                padding: '10px 20px', 
                                                borderRadius: '20px', 
                                                backgroundColor: 'white', 
                                                border: '1px solid #A78BFA40', 
                                                fontSize: '13px', 
                                                fontWeight: '500', 
                                                color: '#7C3AED', 
                                                cursor: 'pointer', 
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => { e.target.style.backgroundColor = '#F5F3FF'; e.target.style.borderColor = '#A78BFA'; }}
                                            onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#A78BFA40'; }}
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', backgroundColor: 'white', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input 
                                    value={input} 
                                    onChange={(e) => setInput(e.target.value)} 
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                                    placeholder="Ask me anything..." 
                                    style={{ 
                                        width: '100%', 
                                        padding: '14px 20px', 
                                        borderRadius: '24px', 
                                        border: '1px solid #e2e8f0', 
                                        outline: 'none', 
                                        fontSize: '14px', 
                                        fontWeight: '500', 
                                        backgroundColor: '#fcfdfe',
                                        transition: 'all 0.2s'
                                    }} 
                                    onFocus={(e) => e.target.style.borderColor = '#A78BFA'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                                <button 
                                    onClick={isListening ? () => {} : startListening} 
                                    style={{ 
                                        position: 'absolute', 
                                        right: '12px', 
                                        backgroundColor: 'transparent', 
                                        border: 'none', 
                                        color: isListening ? '#ef4444' : '#94a3b8', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center' 
                                    }}
                                >
                                    {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                                </button>
                            </div>
                            <button 
                                id="ai-send-btn"
                                onClick={() => handleSend()} 
                                style={{ 
                                    width: '52px', 
                                    height: '52px', 
                                    backgroundColor: '#A78BFA', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '18px', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 25px rgba(167, 139, 250, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7C3AED'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#A78BFA'}
                            >
                                <SendHorizontal size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiConcierge;
