import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AiConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your MediSync Clinical Concierge.\n\nI can help you:\n1. Find specialists for your symptoms\n2. Check nearby hospital facilities\n3. Manage your medication queries\n\nHow can I help you today?' }
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
        { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' }
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Text to Speech (TTS)
    const speak = (text) => {
        if (!isVoiceEnabled) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]\(.*?\)/g, '')); // Clean markdown links
        utterance.lang = selectedLang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    // Speech to Text (STT)
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = selectedLang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript);
        };

        recognition.start();
    };

    const handleSend = async (manualInput) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim()) return;

        const userMsg = { role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/ai/chat', { message: textToSend });
            const aiMsg = { role: 'ai', text: res.data.response };
            setMessages(prev => [...prev, aiMsg]);
            speak(res.data.response);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the clinical network.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#0066FF',
                        border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(0,102,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.1) rotate(5deg)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1) rotate(0deg)'}
                >
                    🤖
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '380px', height: '600px', backgroundColor: 'white', borderRadius: '24px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)',
                    animation: 'slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                }}>
                    <style>{`
                        @keyframes slideUp { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                        @keyframes pulseEmergency { 0% { background-color: #fee2e2; } 50% { background-color: #fca5a5; } 100% { background-color: #fee2e2; } }
                        @keyframes pulseMic { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                    `}</style>
                    
                    {/* Header */}
                    <div style={{
                        padding: '24px', backgroundColor: '#0066FF', color: 'white',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'linear-gradient(135deg, #0066FF 0%, #004dc2 100%)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#4ade80', borderRadius: '50%', border: '2px solid white' }}></div>
                            <div>
                                <div style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MediSync AI</div>
                                <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: '600' }}>Clinical Intelligent Layer</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>
                                {isVoiceEnabled ? '🔊' : '🔇'}
                            </button>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div style={{ padding: '10px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', overflowX: 'auto', noScrollbar: 'true' }}>
                        {languages.map(lang => (
                            <button 
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                style={{
                                    padding: '6px 12px', borderRadius: '12px', border: selectedLang === lang.code ? '1px solid #0066FF' : '1px solid transparent',
                                    backgroundColor: selectedLang === lang.code ? 'white' : 'transparent',
                                    color: selectedLang === lang.code ? '#0066FF' : '#64748b',
                                    fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {lang.flag} {lang.name}
                            </button>
                        ))}
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', backgroundColor: '#fcfdfe' }}>
                        {messages.map((m, i) => {
                            const isEmergency = m.text.includes('🚨');
                            return (
                                <div key={i} style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%', padding: '14px 18px', borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    backgroundColor: isEmergency ? '#fee2e2' : (m.role === 'user' ? '#0066FF' : 'white'),
                                    color: m.role === 'user' ? 'white' : '#1e293b',
                                    boxShadow: m.role === 'ai' ? '0 4px 15px rgba(0,0,0,0.04)' : 'none',
                                    fontSize: '13px', lineHeight: '1.6', 
                                    border: isEmergency ? '2px solid #ef4444' : (m.role === 'ai' ? '1px solid #f1f5f9' : 'none'),
                                    animation: isEmergency ? 'pulseEmergency 2s infinite' : 'none'
                                }}>
                                    {m.text.split('\n').map((line, li) => {
                                        const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
                                        if (linkMatch) {
                                            return (
                                                <div key={li} style={{ marginTop: '10px' }}>
                                                    <button 
                                                        onClick={() => window.location.href = linkMatch[2]}
                                                        style={{
                                                            width: '100%', padding: '12px', backgroundColor: '#f0f7ff', color: '#0066FF',
                                                            border: '1px solid #bfdbfe', borderRadius: '12px', fontSize: '12px',
                                                            fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                        }}
                                                    >
                                                        ⚡ {linkMatch[1].toUpperCase()}
                                                    </button>
                                                </div>
                                            );
                                        }
                                        return <div key={li} style={{ marginBottom: '6px', fontWeight: line.includes('🚨') ? '900' : 'normal' }}>{line}</div>;
                                    })}
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', padding: '10px', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="dot-pulse"></div>
                                AI Clinical Brain Analyzing...
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '24px', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button 
                            onClick={startListening}
                            style={{
                                width: '45px', height: '45px', borderRadius: '14px', border: 'none',
                                backgroundColor: isListening ? '#ef4444' : '#f1f5f9',
                                color: isListening ? 'white' : '#64748b',
                                fontSize: '20px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                animation: isListening ? 'pulseMic 1.5s infinite' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isListening ? '🛑' : '🎤'}
                        </button>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? 'Listening...' : 'Symptoms or queries...'}
                            style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', fontWeight: '500' }}
                        />
                        <button 
                            onClick={() => handleSend()} 
                            disabled={isLoading || !input.trim()} 
                            style={{ 
                                width: '45px', height: '45px', backgroundColor: '#0066FF', 
                                color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                            }}
                        >
                            ➔
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiConcierge;
