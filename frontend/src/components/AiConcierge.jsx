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
        { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' }
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
        const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]\(.*?\)/g, '').replace(/[*_]/g, ''));
        
        // Premium Voice Selection Logic
        const preferredVoices = voices.filter(v => 
            v.lang.includes(selectedLang.split('-')[0]) && 
            (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Samantha'))
        );
        
        if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
        }
        
        utterance.lang = selectedLang;
        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for clarity
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
            const res = await api.post('/ai/chat', { message: textToSend });
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
        if (!SpeechRecognition) return alert('Not supported');
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLang;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript);
        };
        recognition.start();
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#0066FF', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,66,255,0.4)', transition: '0.3s' }}>
                    🤖
                </button>
            )}

            {isOpen && (
                <div style={{ width: '400px', height: '650px', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 30px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', animation: 'slideUp 0.4s' }}>
                    <style>{`@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
                    
                    {/* Header */}
                    <div style={{ padding: '24px', backgroundColor: '#0066FF', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#4ade80', borderRadius: '50%' }}></div>
                            <span style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '1px' }}>CLINICAL AI 2.0</span>
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
                    <div ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fcfdfe' }}>
                        {messages.map((m, i) => {
                            const isHighRisk = m.text.includes('HIGH') || m.text.includes('CRITICAL');
                            return (
                                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '16px', borderRadius: '18px', backgroundColor: isHighRisk ? '#fee2e2' : (m.role === 'user' ? '#0066FF' : 'white'), color: m.role === 'user' ? 'white' : '#1e293b', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', fontSize: '13.5px', lineHeight: '1.6', border: isHighRisk ? '1px solid #ef4444' : 'none' }}>
                                    {m.text.split('\n').map((l, li) => {
                                        if (l.includes('(/dashboard')) {
                                            const url = l.match(/\((.*?)\)/)[1];
                                            return <button key={li} onClick={() => window.location.href = url} style={{ width: '100%', marginTop: '10px', padding: '12px', backgroundColor: '#f0f7ff', color: '#0066FF', border: '1px solid #bfdbfe', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>⚡ BOOK NOW</button>;
                                        }
                                        return <div key={li}>{l}</div>;
                                    })}
                                    {m.role === 'ai' && i === 0 && !location && (
                                        <button onClick={requestLocation} style={{ marginTop: '15px', width: '100%', padding: '12px', backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px dashed #bae6fd', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            📍 SHARE LOCATION FOR LOCAL TRIAGE
                                        </button>
                                    )}
                                    {m.role === 'ai' && i > 0 && (
                                        <div style={{ marginTop: '12px', pt: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ fontSize: '11px', opacity: 0.6 }}>
                                                Was this helpful? <span style={{ cursor: 'pointer' }}>👍</span> <span style={{ cursor: 'pointer' }}>👎</span>
                                            </div>
                                            <button 
                                                onClick={() => speak(m.text)}
                                                style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', padding: 0 }}
                                                title="Read aloud"
                                            >
                                                📢
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isLoading && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Clinical Brain Thinking...</div>}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                        <button onClick={startListening} style={{ width: '45px', height: '45px', borderRadius: '14px', border: 'none', backgroundColor: isListening ? '#ef4444' : '#f1f5f9', cursor: 'pointer' }}>
                            {isListening ? '🛑' : '🎤'}
                        </button>
                        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }} />
                        <button onClick={() => handleSend()} style={{ width: '45px', height: '45px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer' }}>➔</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiConcierge;
