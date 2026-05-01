import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { MessageSquare, User, Activity, Search, ArrowRight } from 'lucide-react';
import ClinicalChatBox from '../components/ClinicalChatBox';
import { useNotifications } from '../context/NotificationContext';

const ClinicalMessages = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const { lastMessage } = useNotifications();

    const [unreadCounts, setUnreadCounts] = useState({});

    useEffect(() => {
        if (lastMessage) {
            // Only increment if we are not actively chatting with the sender
            if (!activeChat || activeChat.userId !== lastMessage.senderId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [lastMessage.senderId]: (prev[lastMessage.senderId] || 0) + 1
                }));
            }
        }
    }, [lastMessage, activeChat]);

    useEffect(() => {
        fetchConversations();
        fetchUnreadCounts();
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            // Fetch linked patients as potential conversations
            const res = await api.get('doctor/patients');
            setConversations(res.data);
        } catch (err) {
            console.error("Error fetching conversations", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCounts = async () => {
        try {
            const res = await api.get('chat/unread-counts');
            setUnreadCounts(res.data);
        } catch (e) { console.error(e); }
    };

    const filtered = (Array.isArray(conversations) ? conversations : []).filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Messages</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Secure Provider-Patient Channel
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search contact..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 ring-primary/20 w-full sm:w-64 text-sm font-bold"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-spin text-primary" size={48} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <MessageSquare size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No active conversations</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                        Link with patients using their Clinical Codes to start secure messaging.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.map(patient => (
                        <div 
                            key={patient.id}
                            onClick={() => {
                                setActiveChat({ id: patient.id, name: patient.name, userId: patient.user?.id });
                                setUnreadCounts(prev => ({ ...prev, [patient.user?.id]: 0 }));
                            }}
                            className="bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-primary/30 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 relative group-hover:scale-105 transition-transform">
                                    <div className="w-full h-full rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-xl border border-primary-100 overflow-hidden">
                                        {patient.profilePictureUrl ? (
                                            <img src={patient.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        ) : patient.name.charAt(0)}
                                    </div>
                                    
                                    {unreadCounts[patient.user?.id] > 0 && (
                                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#25D366] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce z-10">
                                            {unreadCounts[patient.user?.id]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg group-hover:text-primary transition-colors leading-none">{patient.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">Patient ID: #{patient.id}</span>
                                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pr-4">
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-all group-hover:translate-x-1">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeChat && (
                <ClinicalChatBox 
                    receiverId={activeChat.userId} 
                    receiverName={activeChat.name} 
                    onClose={() => setActiveChat(null)} 
                />
            )}
        </div>
    );
};

export default ClinicalMessages;
