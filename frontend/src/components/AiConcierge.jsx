import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AiConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your MediSync Clinical Concierge.\n\nI can help you:\n1. Find specialists for your symptoms\n2. Check nearby hospital facilities\n3. Manage your medication queries\n\nHow can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/ai/chat', { message: currentInput });
            const aiMsg = { role: 'ai', text: res.data.response };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the clinical network. Please try again later.' }]);
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
                        width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#0066FF',
                        border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,102,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }}
                >
                    🤖
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '350px', height: '500px', backgroundColor: 'white', borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <style>{`
                        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                        @keyframes pulseEmergency { 0% { background-color: #fee2e2; } 50% { background-color: #fca5a5; } 100% { background-color: #fee2e2; } }
                    `}</style>
                    
                    {/* Header */}
                    <div style={{
                        padding: '20px', backgroundColor: '#0066FF', color: 'white',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#4ade80', borderRadius: '50%', border: '2px solid white' }}></div>
                            <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Clinical Concierge</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#fcfdfe' }}>
                        {messages.map((m, i) => {
                            const isEmergency = m.text.includes('🚨');
                            return (
                                <div key={i} style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    backgroundColor: isEmergency ? '#fee2e2' : (m.role === 'user' ? '#0066FF' : 'white'),
                                    color: m.role === 'user' ? 'white' : '#1e293b',
                                    boxShadow: m.role === 'ai' ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                                    fontSize: '13px', lineHeight: '1.6', 
                                    border: isEmergency ? '2px solid #ef4444' : (m.role === 'ai' ? '1px solid #f1f5f9' : 'none'),
                                    animation: isEmergency ? 'pulseEmergency 2s infinite' : 'none'
                                }}>
                                    {m.text.split('\n').map((line, li) => {
                                        const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
                                        if (linkMatch) {
                                            return (
                                                <div key={li} style={{ marginTop: '8px' }}>
                                                    <button 
                                                        onClick={() => window.location.href = linkMatch[2]}
                                                        style={{
                                                            width: '100%', padding: '10px', backgroundColor: '#f0f7ff', color: '#0066FF',
                                                            border: '1px solid #bfdbfe', borderRadius: '10px', fontSize: '12px',
                                                            fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
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
                            <div style={{ alignSelf: 'flex-start', padding: '10px', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>AI is analyzing clinical context...</div>
                        )}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Describe your symptoms..."
                            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} style={{ width: '45px', height: '45px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>➔</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiConcierge;
