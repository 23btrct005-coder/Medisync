import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';

const AiConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your MediSync Clinical Concierge. I can help with Symptom Analysis, Hospital Comparisons, and Emergency Triage. How are you feeling today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const scrollRef = useRef(null);

    const languages = [
        { code: 'en-IN', name: 'English', flag: '🇺🇸' },
        { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
        { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
        { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
        { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
        { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' }
    ];

    const [location, setLocation] = useState(null);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isOpen]);

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
            const res = await api.post('/ai/chat', { 
                message: textToSend,
                location: location ? `${location.lat},${location.lng}` : null
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
            // Removed auto-send as per user request
        };
        recognition.start();
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes wave {
                    0% { height: 4px; }
                    50% { height: 16px; }
                    100% { height: 4px; }
                }
            `}</style>

            {!isOpen && (
                <button onClick={() => setIsOpen(true)} style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#0066FF', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,66,255,0.4)', transition: '0.3s' }}>
                    🤖
                </button>
            )}

            {isOpen && (
                <div style={{ width: '400px', height: '650px', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 30px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', animation: 'slideUp 0.4s' }}>
                    
                    {/* Header */}
                    <div style={{ padding: '24px', backgroundColor: '#0066FF', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80', animation: 'pulse 2s infinite' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '900', fontSize: '13px', letterSpacing: '1px' }}>CLINICAL AI 2.0</span>
                                <span style={{ fontSize: '9px', opacity: 0.7, fontWeight: '800' }}>LIVE SAT-LINK • REAL-TIME</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                                onClick={() => {
                                    setIsVoiceEnabled(!isVoiceEnabled);
                                    if (!isVoiceEnabled) speak("Voice enabled. I am listening.");
                                    else window.speechSynthesis.cancel();
                                }} 
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', opacity: isVoiceEnabled ? 1 : 0.4 }}
                                title={isVoiceEnabled ? "Mute AI" : "Unmute AI"}
                            >
                                {isVoiceEnabled ? '🔊' : '🔈'}
                            </button>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </div>
                    </div>

                    {/* Lang Toggle */}
                    <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                        {languages.map(l => (
                            <button key={l.code} onClick={() => setSelectedLang(l.code)} style={{ padding: '6px 12px', borderRadius: '10px', border: selectedLang === l.code ? '1px solid #0066FF' : 'none', fontSize: '11px', backgroundColor: 'white', cursor: 'pointer' }}>
                                {l.flag} {l.name}
                            </button>
                        ))}
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#fcfdfe' }}>
                        {messages.map((m, i) => {
                            const isHighRisk = m.text.includes('HIGH') || m.text.includes('CRITICAL');
                            const isGreeting = i === 0 && m.role === 'ai';
                            const displayText = streamingText[i] || m.text;
                            
                            return (
                                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {/* Sticker Integration (Randomized for variety) */}
                                    {m.role === 'ai' && !isHighRisk && !isGreeting && i % 3 === 0 && (
                                        <div style={{ fontSize: '40px', marginBottom: '-10px', marginLeft: '10px', animation: 'bounce 2s infinite' }}>
                                            {m.text.includes('medicine') ? '💊' : (m.text.includes('heart') ? '❤️' : '✨')}
                                        </div>
                                    )}

                                    <div style={{ padding: '20px 24px', borderRadius: m.role === 'user' ? '28px 28px 4px 28px' : '28px 28px 28px 4px', backgroundColor: isHighRisk ? '#fff1f2' : (m.role === 'user' ? '#0066FF' : 'white'), color: m.role === 'user' ? 'white' : '#334155', boxShadow: m.role === 'user' ? '0 12px 30px rgba(0,102,255,0.2)' : '0 10px 40px rgba(0,0,0,0.05)', fontSize: '14.5px', lineHeight: '1.8', border: isHighRisk ? '2px solid #fda4af' : 'none', position: 'relative', overflow: 'hidden' }}>
                                        {/* Background accent for AI messages */}
                                        {m.role === 'ai' && !isHighRisk && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#0066FF', opacity: 0.8 }} />}
                                        
                                        {displayText.split('\n').map((l, li) => {
                                            const line = l.trim();
                                            if (!line) return <div key={li} style={{ height: '12px' }} />;

                                            // Styled Topic Headers
                                            if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
                                                const title = line.replace(/#/g, '').trim();
                                                const colors = ['#0066FF', '#7c3aed', '#059669', '#ea580c'];
                                                const themeColor = colors[li % colors.length];
                                                
                                                return (
                                                    <div key={li} style={{ backgroundColor: m.role === 'user' ? 'rgba(255,255,255,0.15)' : `${themeColor}10`, padding: '10px 14px', borderRadius: '12px', margin: '14px 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: m.role === 'user' ? 'white' : themeColor }}></div>
                                                        <span style={{ fontWeight: '900', fontSize: '13px', color: m.role === 'user' ? 'white' : themeColor, letterSpacing: '1px', textTransform: 'uppercase' }}>{title}</span>
                                                    </div>
                                                );
                                            }

                                            // Styled Lists or Proactive Point Conversion for long lines
                                            const coordMatch = line.match(/-?\d+\.\d+,\s*-?\d+\.\d+/);
                                            const hasCoords = !!coordMatch;
                                            const isLocation = line.toLowerCase().includes('location') || line.toLowerCase().includes('address') || line.toLowerCase().includes('hospital');

                                            // Hide the raw coordinate line if it doesn't contain other significant text
                                            const isPureCoordLine = hasCoords && line.trim().length < 40;

                                            if (line.startsWith('-') || line.startsWith('•') || line.length > 60 || hasCoords || isLocation) {
                                                const query = line.replace(/#|-|•/g, '').trim();
                                                const encodedQuery = encodeURIComponent(hasCoords ? coordMatch[0] : query);
                                                
                                                // Map Configuration
                                                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                                                const mapUrl = (apiKey && apiKey !== "REPLACE_WITH_YOUR_GOOGLE_MAPS_API_KEY") 
                                                    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`
                                                    : `https://maps.google.com/maps?q=${encodedQuery}&output=embed&z=15`;

                                                return (
                                                    <div key={li} style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0' }}>
                                                        {!isPureCoordLine && (
                                                            <div style={{ display: 'flex', gap: '10px', paddingLeft: '8px', alignItems: 'flex-start' }}>
                                                                <div style={{ marginTop: '8px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: m.role === 'user' ? 'white' : '#94a3b8', flexShrink: 0 }}></div>
                                                                <span style={{ fontWeight: '500' }}>{line.startsWith('-') || line.startsWith('•') ? line.substring(1).trim() : line}</span>
                                                            </div>
                                                        )}
                                                        {(isLocation || hasCoords) && (
                                                            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginLeft: '15px' }}>
                                                                <iframe 
                                                                    width="100%" 
                                                                    height="200" 
                                                                    style={{ border: 0, filter: 'grayscale(0.1) contrast(1.1)' }} 
                                                                    loading="lazy" 
                                                                    allowFullScreen 
                                                                    src={mapUrl}
                                                                ></iframe>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            // Dashboard Links
                                            if (line.includes('(/dashboard')) {
                                                const url = line.match(/\((.*?)\)/)[1];
                                                return <button key={li} onClick={() => { setIsOpen(false); window.location.href = url; }} style={{ width: '100%', marginTop: '16px', padding: '16px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '18px', cursor: 'pointer', fontWeight: '900', fontSize: '12px', letterSpacing: '1px', boxShadow: '0 8px 20px rgba(0,102,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🚀 LAUNCH CLINICAL PORTAL</button>;
                                            }

                                            // Regular Text with Bold replacement
                                            const parts = line.split(/(\*\*.*?\*\*)/g);
                                            return (
                                                <div key={li} style={{ color: m.role === 'user' ? 'white' : (isHighRisk ? '#991b1b' : '#334155') }}>
                                                    {parts.map((p, pi) => p.startsWith('**') ? <strong key={pi} style={{ color: m.role === 'user' ? 'white' : '#0f172a', fontWeight: '800' }}>{p.replace(/\*\*/g, '')}</strong> : p)}
                                                </div>
                                            );
                                        })}

                                        {m.role === 'ai' && i === 0 && !location && (
                                            <button onClick={requestLocation} style={{ marginTop: '20px', width: '100%', padding: '16px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(0,102,255,0.2)' }}>
                                                🛰️ ENABLE LIVE GEOLOCATION TRIAGE
                                            </button>
                                        )}
                                        
                                        {m.role === 'ai' && i > 0 && (
                                            <div style={{ marginTop: '18px', pt: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    HELPFUL? <span style={{ cursor: 'pointer', marginLeft: '10px' }}>⭐</span> <span style={{ cursor: 'pointer', marginLeft: '5px' }}>💎</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => speak(m.text)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📢</button>
                                                    <button onClick={() => { navigator.clipboard.writeText(m.text); toast.success("Copied to clipboard!"); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.4, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', padding: '0 12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {m.role === 'ai' ? '🔹 CLINICAL BRAIN' : '🔸 YOU'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        
                        <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
                        
                        {isLoading && (
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[0, 1, 2].map(dot => <div key={dot} style={{ width: '8px', height: '8px', backgroundColor: '#0066FF', borderRadius: '50%', animation: `bounce 1s infinite ${dot * 0.2}s` }} />)}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Analyzing Clinical Nodes...</div>
                            </div>
                        )}
                        
                        {!isLoading && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                {[
                                    { label: '💊 Active Meds', query: 'What are my active prescriptions?', color: '#0066FF' },
                                    { label: '🚑 Live ER', query: 'Find the nearest emergency room', color: '#ef4444' },
                                    { label: '👨‍⚕️ Top Doctors', query: 'Show me available specialists for a checkup', color: '#059669' },
                                    { label: '🏥 Nav Guide', query: 'Tell me about the hospital layout and reception', color: '#7c3aed' }
                                ].map((chip, ci) => (
                                    <button 
                                        key={ci} 
                                        onClick={() => handleSend(chip.query)}
                                        style={{ padding: '12px 20px', borderRadius: '15px', backgroundColor: 'white', border: `2px solid ${chip.color}20`, fontSize: '12px', fontWeight: '800', color: chip.color, cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${chip.color}10`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', backgroundColor: 'white', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                            {isListening && (
                                <div style={{ position: 'absolute', inset: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', zIndex: 0 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} style={{ 
                                            width: '3px', 
                                            height: '10px', 
                                            backgroundColor: '#ef4444', 
                                            borderRadius: '10px',
                                            animation: `wave 0.6s infinite ${i * 0.1}s ease-in-out` 
                                        }} />
                                    ))}
                                </div>
                            )}
                            <button 
                                onClick={isListening ? () => {} : startListening} 
                                style={{ 
                                    position: 'relative',
                                    zIndex: 1,
                                    width: '100%', 
                                    height: '100%', 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    backgroundColor: isListening ? '#fee2e2' : '#f8fafc', 
                                    color: isListening ? '#ef4444' : '#64748b', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifySelf: 'center',
                                    justifyContent: 'center', 
                                    transition: '0.3s',
                                    boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                                }}
                            >
                                {isListening ? '🛑' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
                            </button>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                                placeholder="Describe symptoms or ask about doctors..." 
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', fontWeight: '500', backgroundColor: '#f8fafc' }} 
                            />
                        </div>
                        <button onClick={() => handleSend()} style={{ width: '48px', height: '48px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,102,255,0.2)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 14 0"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiConcierge;
