import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { MessageSquare, User, Activity, Search, ArrowRight, Building2, Users } from 'lucide-react';
import ClinicalChatBox from '../components/ClinicalChatBox';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const ClinicalMessages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [activeTab, setActiveTab] = useState('patients');
    const { lastMessage } = useNotifications();
    const [unreadCounts, setUnreadCounts] = useState({});

    const isAdmin = user?.role === 'ROLE_HOSPITAL_ADMIN';
    const isDoctor = user?.role === 'ROLE_DOCTOR';

    useEffect(() => {
        if (lastMessage) {
            if (!activeChat || activeChat.userId !== lastMessage.senderId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [lastMessage.senderId]: (prev[lastMessage.senderId] || 0) + 1
                }));
            }
        }
    }, [lastMessage, activeChat]);

    useEffect(() => {
        fetchContacts();
        fetchUnreadCounts();
    }, [activeTab]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'patients') {
                // Fetch patients associated with the doctor or hospital
                res = await api.get(isAdmin ? 'hospital/patients' : 'doctor/patients');
            } else {
                // Fetch institutional staff (colleagues/admin)
                res = await api.get(isAdmin ? 'hospital/staff-contacts' : 'doctor/institutional-contacts');
            }
            setConversations(res.data);
        } catch (err) {
            console.error("Error fetching conversations", err);
            setConversations([]);
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

    const filtered = (Array.isArray(conversations) ? conversations : []).filter(c => 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                        Message <span className="not-italic text-primary">Center</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Encrypted Institutional Communication
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 ring-primary/20 w-full sm:w-64 text-sm font-bold"
                    />
                </div>
            </div>

            {/* Tab Segregation */}
            <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] w-fit border border-slate-200/50">
                <button
                    onClick={() => setActiveTab('patients')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === 'patients' 
                        ? 'bg-white text-primary shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <User size={14} /> Patients
                </button>
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === 'staff' 
                        ? 'bg-white text-primary shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Building2 size={14} /> Institutional Staff
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-spin text-primary" size={48} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        {activeTab === 'patients' ? <Users size={40} /> : <Building2 size={40} />}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No {activeTab} found</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                        {activeTab === 'patients' 
                            ? "Link with patients using their Clinical Codes to start secure messaging."
                            : "Your institutional directory is empty. Onboard staff to begin messaging."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.map(contact => (
                        <div 
                            key={contact.userId}
                            onClick={() => {
                                setActiveChat({ id: contact.id, name: contact.name, userId: contact.userId });
                                setUnreadCounts(prev => ({ ...prev, [contact.userId]: 0 }));
                            }}
                            className="bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-primary/30 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 relative group-hover:scale-105 transition-transform">
                                    <div className={`w-full h-full rounded-2xl flex items-center justify-center font-black text-xl border overflow-hidden ${
                                        activeTab === 'staff' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                        {contact.profilePictureUrl ? (
                                            <img src={contact.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        ) : contact.name.charAt(0)}
                                    </div>
                                    
                                    {unreadCounts[contact.userId] > 0 && (
                                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#25D366] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce z-10">
                                            {unreadCounts[contact.userId]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg group-hover:text-primary transition-colors leading-none">{contact.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                            activeTab === 'staff' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            {activeTab === 'staff' ? (contact.role === 'HOSPITAL_ADMIN' ? 'Admin' : 'Physician') : `Patient ID: #${contact.id}`}
                                        </span>
                                        {activeTab === 'staff' && contact.specialization && (
                                            <>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{contact.specialization}</span>
                                            </>
                                        )}
                                        {activeTab === 'patients' && (
                                            <>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Clinical Link</span>
                                            </>
                                        )}
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
