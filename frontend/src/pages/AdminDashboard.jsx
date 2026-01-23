import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
    LayoutDashboard, Users, Briefcase, FileText,
    Activity, LogOut, ChevronRight, TrendingUp,
    ShieldCheck, AlertTriangle, Database, Trash2, Edit3, Search, Calendar, Phone, Mail, Clock
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
    const { admin, adminToken, adminLogout } = useAdmin();
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState([]);
    const [usage3d, setUsage3d] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data lists
    const [dataList, setDataList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab !== 'overview') {
            fetchListData();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (res.data.success) {
                setStats(res.data.stats);
                setUsage(res.data.toolUsage);
                setUsage3d(res.data.usageLast3Days || []);
                setRecentLogs(res.data.recentActivity);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchListData = async () => {
        setListLoading(true);
        setDataList([]);
        try {
            const endpointMap = {
                'users': 'users',
                'professionals': 'professionals',
                'invoices': 'invoices',
                'logs': 'logs'
            };
            const endpoint = endpointMap[activeTab];
            const res = await axios.get(`http://localhost:5000/api/admin/${endpoint}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (res.data.success) {
                setDataList(res.data.data);
            }
        } catch (err) {
            console.error('List fetch error:', err);
        } finally {
            setListLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            fetchListData();
        } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
    };

    const filteredData = dataList.filter(item => {
        const search = searchTerm.toLowerCase();
        if (activeTab === 'users') return item.name?.toLowerCase().includes(search) || item.phone?.includes(search) || item.email?.toLowerCase().includes(search);
        if (activeTab === 'professionals') return item.name?.toLowerCase().includes(search) || item.category?.toLowerCase().includes(search) || item.service?.toLowerCase().includes(search);
        if (activeTab === 'invoices') return item.invoiceNumber?.toLowerCase().includes(search) || item.clientName?.toLowerCase().includes(search);
        if (activeTab === 'logs') return item.tool?.toLowerCase().includes(search) || item.month?.toLowerCase().includes(search);
        return true;
    });

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Activity className="animate-spin text-blue-600" size={48} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Admin Sidebar */}
            <div className="w-72 bg-slate-900 shrink-0 flex flex-col">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <span className="text-white font-black text-xl tracking-tight uppercase">Admin <span className="text-blue-500">Panel</span></span>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'professionals', label: 'Help Line', icon: Briefcase },
                            { id: 'invoices', label: 'Invoices', icon: FileText },
                            { id: 'logs', label: 'Usage Metrics', icon: Database },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setSearchTerm(''); }}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 font-black">
                            {admin?.name?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">{admin?.name}</p>
                            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{admin?.role}</p>
                        </div>
                    </div>
                    <button onClick={adminLogout} className="w-full flex items-center gap-4 px-6 py-4 text-red-400 font-bold hover:bg-red-500/10 rounded-2xl transition-all"><LogOut size={20} /> Sign Out</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-screen overflow-y-auto custom-scrollbar p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {activeTab === 'overview' ? 'Command' : activeTab} <span className="text-blue-600">{activeTab === 'overview' ? 'Center' : 'Records'}</span>
                        </h2>
                        <p className="text-slate-500 font-bold text-sm mt-1">Real-time system oversight and analytics</p>
                    </div>
                    {activeTab !== 'overview' && (
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search data..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-64"
                                />
                            </div>
                        </div>
                    )}
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-10">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { id: 'users', label: 'Total Members', value: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { id: 'professionals', label: 'Active Pros', value: stats?.totalProfessionals, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { id: 'invoices', label: 'Invoices Issued', value: stats?.totalInvoices, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
                            ].map((stat, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(stat.id)}
                                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 hover:-translate-y-2 transition-all text-left group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-500 font-black text-xs uppercase tracking-widest">
                                            <TrendingUp size={16} /> Healthy
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-5xl font-black text-slate-900 tracking-tight">{stat.value || 0}</h4>
                                        <ChevronRight className="text-slate-300 group-hover:translate-x-2 group-hover:text-blue-600 transition-all" size={32} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Usage & Integrity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5">
                                <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Recent Activity <span className="text-blue-600">(Last 3 Days)</span></h3>
                                <div className="space-y-6">
                                    {usage3d.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between mb-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item._id.replace(/_/g, ' ')}</span><span className="text-xs font-black text-slate-900">{item.count}</span></div>
                                            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (item.count / 10) * 100)}%` }} /></div>
                                        </div>
                                    ))}
                                    {usage3d.length === 0 && <p className="text-slate-400 font-bold italic text-sm">No activity recorded in the last 72 hours.</p>}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5">
                                <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">System <span className="text-blue-600">Integrity</span></h3>
                                <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6"><div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center"><Activity size={24} /></div><div><p className="text-white font-bold text-sm">Main API Cluster</p><p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Active • Stable</p></div></div>
                                    <div className="space-y-4">
                                        {['DB Primary', 'AI Worker', 'Task Queue'].map(s => (
                                            <div key={s} className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s}</span><span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">Connected</span></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Live <span className="text-blue-600">Activity Stream</span></h3>
                            <div className="space-y-4">
                                {recentLogs.map((log, i) => (
                                    <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Activity size={20} /></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.event.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-slate-500 font-bold">{log.userId?.name || 'Guest User'} • {log.userId?.phone || 'IP Trace'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Views (Users, Professionals, Invoices, Logs) */}
                {activeTab !== 'overview' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
                        {listLoading ? (
                            <div className="py-32 flex flex-col items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-4" size={40} /><p className="font-black uppercase tracking-widest text-xs">Decrypting Records...</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {activeTab === 'users' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Details</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined On</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                            {activeTab === 'professionals' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Professional</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expertise</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Social Score</th></>)}
                                            {activeTab === 'invoices' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Ref</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Issued To</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th></>)}
                                            {activeTab === 'logs' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tool Name</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing/Usage Month</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Hits</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth</th></>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                                                {activeTab === 'users' && (<>
                                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">{item.name?.charAt(0)}</div><div><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.email}</p></div></div></td>
                                                    <td className="p-6 text-sm font-bold text-slate-600">{item.phone}</td>
                                                    <td className="p-6 text-xs font-bold text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-6"><button onClick={() => handleDeleteUser(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>
                                                </>)}
                                                {activeTab === 'professionals' && (<>
                                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black">{item.name?.charAt(0)}</div><div><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.number}</p></div></div></td>
                                                    <td className="p-6"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest mr-2">{item.category}</span><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{item.service}</span></td>
                                                    <td className="p-6 text-sm font-bold text-slate-600 capitalize">{item.location}</td>
                                                    <td className="p-6"><div className="flex items-center gap-1 text-amber-500 font-black"><Star size={14} className="fill-current" /> {item.rating}</div><p className="text-[9px] text-slate-400 font-black uppercase mt-1">{item.experience} Exp</p></td>
                                                </>)}
                                                {activeTab === 'invoices' && (<>
                                                    <td className="p-6"><p className="font-black text-slate-900 uppercase tracking-tight">{item.invoiceNumber}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</p></td>
                                                    <td className="p-6"><p className="font-bold text-slate-900">{item.clientName}</p><p className="text-xs text-slate-500">{item.clientPhone}</p></td>
                                                    <td className="p-6 font-black text-slate-900 text-sm">₹{item.totalAmount}</td>
                                                    <td className="p-6"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Generated</span></td>
                                                </>)}
                                                {activeTab === 'logs' && (<>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">API</div>
                                                            <span className="font-black text-slate-900 uppercase tracking-tight text-xs">{item.tool}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="text-sm font-black text-slate-900">{item.month.split(' ')[0]}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.month.split(' ')[1]}</p>
                                                    </td>
                                                    <td className="p-6 text-sm font-black text-blue-600">{item.usage}</td>
                                                    <td className="p-6"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest tracking-widest">Verified</span></td>
                                                </>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Star = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const Loader2 = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;

export default AdminDashboard;
