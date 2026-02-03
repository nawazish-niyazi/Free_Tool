import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Landmark, Phone, MapPin, Search, Filter, Plus, Loader2, Landmark as BankIcon, Wallet, Building, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const FinancialAidPage = () => {
    const navigate = useNavigate();
    const [aids, setAids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('');

    const types = [
        { id: 'LALA', label: 'LALA', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'Girvi rakhne wale', label: 'Girvi rakhne wale', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'NBFC', label: 'NBFC', icon: Building, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'Banking', label: 'Banking', icon: BankIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    ];

    useEffect(() => {
        const fetchAids = async () => {
            setLoading(true);
            try {
                const params = selectedType ? { type: selectedType } : {};
                const res = await api.get('/financial-aid', { params });
                if (res.data.success) {
                    setAids(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching aids:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAids();
    }, [selectedType]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">Financial <span className="text-blue-600">Aids</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Find local financial assistance and banking services</p>
                    </div>
                    <Link
                        to="/financial-aid/register"
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Register as Provider
                    </Link>
                </div>

                {/* Type Selection Tabs */}
                <div className="flex flex-wrap gap-4 mb-12">
                    <button
                        onClick={() => setSelectedType('')}
                        className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${!selectedType ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        All Aids
                    </button>
                    {types.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all ${selectedType === type.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
                        >
                            <type.icon size={18} />
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Searching for providers...</p>
                    </div>
                ) : aids.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {aids.map((aid, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={aid._id}
                                className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-100 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${types.find(t => t.id === aid.type)?.bg || 'bg-slate-50'} ${types.find(t => t.id === aid.type)?.color || 'text-slate-600'}`}>
                                        {React.createElement(types.find(t => t.id === aid.type)?.icon || Building, { size: 28 })}
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${types.find(t => t.id === aid.type)?.bg || 'bg-slate-50'} ${types.find(t => t.id === aid.type)?.color || 'text-slate-600'}`}>
                                        {aid.type}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{aid.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400 mb-4">
                                    <MapPin size={14} />
                                    <p className="text-sm font-bold uppercase tracking-tighter">{aid.location}</p>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                                    {aid.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
                                        <Phone size={16} />
                                        {aid.phone}
                                    </div>
                                    <a
                                        href={`tel:${aid.phone}`}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        <Phone size={14} fill="currentColor" />
                                        Call Now
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No providers found</h3>
                        <p className="text-slate-500 font-medium mb-8">Try selecting a different type or check back later.</p>
                        <button
                            onClick={() => setSelectedType('')}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all"
                        >
                            View All Providers
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialAidPage;
