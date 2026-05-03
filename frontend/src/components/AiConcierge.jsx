import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AiConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your MediSync Clinical Concierge. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/ai/chat', { message: input });
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
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                    🤖
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '350px', height: '500px', backgroundColor: 'white', borderRadius: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid #eee'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '15px', backgroundColor: '#0066FF', color: 'white',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>🤖</span>
                            <span style={{ fontWeight: '600' }}>MediSync AI Concierge</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9f9f9' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%', padding: '10px 14px', borderRadius: '12px',
                                backgroundColor: m.role === 'user' ? '#0066FF' : 'white',
                                color: m.role === 'user' ? 'white' : '#333',
                                boxShadow: m.role === 'ai' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap'
                            }}>
                                {m.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', padding: '10px', color: '#888', fontSize: '12px' }}>AI is thinking...</div>
                        )}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask anything..."
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' }}
                        />
                        <button 
                            onClick={handleSend}
                            style={{ padding: '10px 15px', backgroundColor: '#0066FF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiConcierge;
