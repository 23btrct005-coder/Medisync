import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AiConcierge = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your MediSync Clinical Concierge. I can help with Symptom Analysis, Hospital Comparisons, and Emergency Triage. How are you feeling today?' }
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
            toast.error("Geolocation not supported by clinical node");
            return;
        }
        
        setMessages(prev => [...prev, { role: 'ai', text: '📡 Initializing Geolocation Protocol... Please authorize access to find nearby clinical facilities.' }]);
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const locData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(locData);
                setMessages(prev => [...prev, { role: 'ai', text: `📍 Location Synchronized: [${locData.lat.toFixed(4)}, ${locData.lng.toFixed(4)}]. I can now provide hyper-localized hospital triage.` }]);
                speak("Location synchronized. I am now providing localized triage.");
            },
            (err) => {
                setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Geolocation Refused. I will continue using global clinical logic.' }]);
            }
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
                            borderRadius: '50%', 
                            backgroundColor: '#0066FF', 
                            border: 'none', 
                            color: 'white', 
                            fontSize: '28px', 
                            cursor: 'pointer', 
                            boxShadow: '0 12px 40px rgba(0,102,255,0.4)', 
                            zIndex: 1001,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🤖</span>
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
                        <div style={{ padding: '20px 24px', backgroundColor: '#0066FF', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '10px', height: '10px', backgroundColor: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80', animation: 'pulse 2s infinite' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: '900', fontSize: '13px', letterSpacing: '1px' }}>CLINICAL AI 2.0</span>
                                        <span style={{ fontSize: '8px', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontWeight: '800' }}>BETA</span>
                                    </div>
                                    <span style={{ fontSize: '9px', opacity: 0.7, fontWeight: '800', letterSpacing: '0.5px' }}>CONTEXT: {window.location.pathname.toUpperCase() || 'HOME'}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
                                    title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                                    style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', opacity: isVoiceEnabled ? 1 : 0.4 }}
                                >
                                    {isVoiceEnabled ? '🔊' : '🔈'}
                                </button>
                                <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
                                <button 
                                    onClick={() => setIsFullscreen(!isFullscreen)} 
                                    title={isFullscreen ? 'Minimize View' : 'Maximize View'}
                                    style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                >
                                    {isFullscreen ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6m0 0v6m0-6-6 6M20 10h-6m0 0V4m0 6 6-6"/></svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6m0 0v6m0-6L14 10M9 21H3m0 0v-6m0 6 7-7"/></svg>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    title="Minimize to Tray"
                                    style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                                <button 
                                    onClick={() => { setIsOpen(false); setMessages([{ role: 'ai', text: 'Hello! Clinical Concierge reset. How can I assist you now?' }]); }} 
                                    title="Close & Clear Session"
                                    style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(225,29,72,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        {/* Lang Toggle */}
                        <div className="custom-scrollbar" style={{ padding: '12px 20px', backgroundColor: '#f8fafc', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #f1f5f9' }}>
                            {languages.map(l => (
                                <button key={l.code} onClick={() => setSelectedLang(l.code)} style={{ padding: '8px 14px', borderRadius: '12px', border: selectedLang === l.code ? '1.5px solid #0066FF' : '1.5px solid transparent', fontSize: '11px', fontWeight: '700', backgroundColor: 'white', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s', color: selectedLang === l.code ? '#0066FF' : '#64748b' }}>
                                    {l.flag} {l.name}
                                </button>
                            ))}
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
                                                    const url = line.match(/\((.*?)\)/)[1];
                                                    return <button key={li} onClick={() => { setIsOpen(false); window.location.href = url; }} style={{ width: '100%', marginTop: '12px', padding: '14px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '11px', letterSpacing: '1px', boxShadow: '0 8px 20px rgba(0,102,255,0.2)' }}>LAUNCH CLINICAL PORTAL</button>;
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
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {[
                                        { label: '💊 Active Meds', query: 'What are my active prescriptions?', color: '#0066FF' },
                                        { label: '🚑 Live ER', query: 'Find the nearest emergency room', color: '#ef4444' }
                                    ].map((chip, ci) => (
                                        <button key={ci} onClick={() => handleSend(chip.query)} style={{ padding: '8px 14px', borderRadius: '12px', backgroundColor: 'white', border: `1.5px solid ${chip.color}15`, fontSize: '11px', fontWeight: '800', color: chip.color, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>{chip.label}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', backgroundColor: 'white', alignItems: 'center' }}>
                            <button onClick={isListening ? () => {} : startListening} style={{ width: '44px', height: '44px', borderRadius: '14px', border: 'none', backgroundColor: isListening ? '#fee2e2' : '#f8fafc', color: isListening ? '#ef4444' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isListening ? '🛑' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
                            </button>
                            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask AI..." style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', fontWeight: '500', backgroundColor: '#f8fafc' }} />
                            <button onClick={() => handleSend()} style={{ width: '44px', height: '44px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 14 0"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiConcierge;
