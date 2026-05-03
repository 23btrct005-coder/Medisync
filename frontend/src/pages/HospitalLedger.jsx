import React, { useState, useEffect } from 'react';
import { 
    CreditCard, TrendingUp, Users, Calendar, 
    ArrowUpRight, ArrowDownLeft, Search, Filter, 
    Activity, ShieldCheck, DollarSign, Wallet 
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalLedger = () => {
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAudit, setSelectedAudit] = useState(null);

    const fetchLedgerData = async () => {
        try {
            const [statsRes, appointmentsRes] = await Promise.all([
                api.get('/hospital/stats'),
                api.get('/hospital/appointments')
            ]);
            setStats(statsRes.data);
            setTransactions(appointmentsRes.data);
        } catch (err) {
            toast.error("Failed to synchronize institutional ledger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedgerData();
    }, []);

    const handleVerify = async (appointmentId) => {
        try {
            await api.post('/appointments/confirm-upi', { appointmentId });
            toast.success("Transaction verified & session authorized");
            fetchLedgerData();
        } catch (err) {
            toast.error("Verification protocol failed");
        }
    };

    const filteredTransactions = transactions.filter(t => 
        t.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="animate-spin text-primary" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Institutional Ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        Institutional <span className="not-italic text-primary">Ledger</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2 ml-1">
                        Unified Financial Clearing & Revenue Governance
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                        <ShieldCheck className="text-emerald-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Settlements Verified</span>
                    </div>
                </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`, icon: <DollarSign />, color: 'bg-blue-500', trend: '+12.5%' },
                    { label: 'Active Staff', value: stats?.totalDoctors || '0', icon: <Users />, color: 'bg-indigo-500', trend: 'Stable' },
                    { label: 'Pending Payouts', value: `₹${(stats?.totalRevenue * 0.15).toLocaleString() || '0'}`, icon: <Wallet />, color: 'bg-emerald-500', trend: 'Next: 01 May' },
                    { label: 'Clinical Flow', value: stats?.totalPatientsInstitutional || '0', icon: <TrendingUp />, color: 'bg-amber-500', trend: '+5.2%' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-110 transition-transform`} />
                        <div className="relative z-10 text-left">
                            <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                                {stat.icon}
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">{stat.value}</h3>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <span className="text-[9px] font-black text-emerald-500 uppercase">{stat.trend}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Ledger Table */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden mb-12">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                    <div className="text-left">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Transaction <span className="not-italic text-primary">Log</span></h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time clinical settlement audit</p>
                    </div>
                    <div className="flex bg-white border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 ring-primary/20 transition-all">
                        <Search size={16} className="text-slate-400 mt-1 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Filter transactions..."
                            className="border-none text-xs p-0 focus:ring-0 placeholder:text-slate-300 w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto text-left">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Transaction Ref</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Patient Node</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Physician Affiliate</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Clinical Fee</th>
                                <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway</th>
                                <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <ArrowUpRight size={16} />
                                            </div>
                                            <span className="font-mono text-[10px] font-black text-slate-600">#{10000 + tx.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-black text-slate-800 tracking-tight italic">{tx.patient?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {tx.patient?.patientId}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-bold text-slate-700">{tx.doctor?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{tx.doctor?.specialization}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-black text-slate-900">₹{tx.amount || tx.doctor?.consultationFee || '500'}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{tx.transactionId ? 'Direct UPI' : 'Institutional RP'}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">{tx.transactionId ? 'Manual Audit' : (stats?.razorpayKeyId ? 'Encrypted Key' : 'System Default')}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                tx.status === 'BOOKED' || tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                                                tx.status === 'AWAITING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-blue-50 text-blue-600'
                                            }`}>
                                                {(tx.status === 'BOOKED' || tx.status === 'COMPLETED') ? 'SETTLED' : (tx.status || 'SCHEDULED')}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-left">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No clinical transactions recorded in this cycle.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Settlement Configuration Brief */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 -mr-32 -mt-32 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <h3 className="text-white text-xl font-black uppercase tracking-tight italic mb-6">Gateway <span className="text-primary not-italic">Integrity</span></h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Razorpay Sync</span>
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-lg">ACTIVE</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UPI ID Verified</span>
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-lg">{stats?.upiId ? 'SYNCED' : 'PENDING'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-primary p-10 rounded-[3.5rem] shadow-xl shadow-primary/20 flex flex-col justify-between group">
                    <div>
                        <h3 className="text-white text-xl font-black uppercase tracking-tight italic mb-2">Automated <span className="not-italic text-slate-900">Payouts</span></h3>
                        <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest">System-managed staff revenue distribution engine enabled.</p>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                        <span className="text-2xl font-black text-white italic">MS-FIN-2026</span>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Modal */}
            {selectedAudit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAudit(null)} />
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Clinical <span className="text-primary">Audit</span></h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Settlement Verification</p>
                            </div>
                            <button onClick={() => setSelectedAudit(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                                <Search size={20} className="rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient VPA</p>
                                    <p className="text-[11px] font-bold text-slate-800 break-all">{selectedAudit.patientUpiId || 'NOT_FOUND'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Txn Reference</p>
                                    <p className="text-[11px] font-black text-primary uppercase break-all">{selectedAudit.transactionId || 'NOT_FOUND'}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldCheck size={16} className="text-amber-600" />
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Verification Protocol</p>
                                </div>
                                <p className="text-[9px] font-medium text-amber-700/80 leading-relaxed uppercase tracking-tight">
                                    By authorizing this transaction, you confirm that the clinical fee has been successfully credited to the institutional UPI account.
                                </p>
                            </div>

                            {selectedAudit.status === 'AWAITING_VERIFICATION' ? (
                                <button 
                                    onClick={() => {
                                        handleVerify(selectedAudit.id);
                                        setSelectedAudit(null);
                                    }}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                                >
                                    Authorize Settlement
                                </button>
                            ) : (
                                <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center border border-emerald-100">
                                    Protocol Verified
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalLedger;
