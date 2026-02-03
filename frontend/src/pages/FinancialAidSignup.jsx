import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Landmark, Phone, MapPin, Building, Wallet, Landmark as BankIcon, Plus, CheckCircle, ArrowRight, ShieldCheck, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const FinancialAidSignup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'LALA',
        description: '',
        phone: '',
        location: ''
    });

    const types = [
        { id: 'LALA', label: 'LALA', icon: Wallet, desc: 'Individual money lenders' },
        { id: 'Girvi rakhne wale', label: 'Girvi rakhne wale', icon: Landmark, desc: 'Pawn shop / Collateral based lending' },
        { id: 'NBFC', label: 'NBFC', icon: Building, desc: 'Non-Banking Financial Companies' },
        { id: 'Banking', label: 'Banking', icon: BankIcon, desc: 'Formal Banking Institutions' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/financial-aid/register', formData);
            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/financial-aid'), 3000);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md w-full text-center"
                    >
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle size={48} strokeWidth={3} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4">Application Submitted!</h1>
                        <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                            Thank you for registering. Your profile has been sent to our admin team for verification. We will notify you once it's approved.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-sm">
                            Redirecting to Financial Aids page
                            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                                <ArrowRight size={16} />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Left: Info/Branding */}
                    <div className="lg:sticky lg:top-24 space-y-8">
                        <div>
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-200 mb-8">
                                <UserPlus size={32} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Register as <br /> <span className="text-blue-600">Financial Provider</span>
                            </h1>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-md">
                                Join our network to help local residents with their financial needs. From individual lending to formal banking.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: ShieldCheck, title: 'Verified Profiles', text: 'Admin verification ensures trust and security.' },
                                { icon: Landmark, title: 'Reach Locals', text: 'Connect with people searching for help in your area.' },
                                { icon: Info, title: 'Free Listing', text: 'Register your services at no cost on our platform.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm">{item.title}</h4>
                                        <p className="text-slate-500 text-sm font-medium">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Registration Form */}
                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name / Business Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your name or business name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Provider Type</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {types.map(type => (
                                        <label
                                            key={type.id}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.type === type.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={type.id}
                                                checked={formData.type === type.id}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="hidden"
                                            />
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.type === type.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                                                <type.icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-xs font-black uppercase ${formData.type === type.id ? 'text-blue-600' : 'text-slate-600'}`}>{type.label}</p>
                                                <p className="text-[10px] font-medium text-slate-400 leading-tight">{type.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Describe your services, interest rates (if applicable), requirements, etc."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Phone number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Location</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Area / Neighborhood"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {loading ? 'Submitting Application...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialAidSignup;
