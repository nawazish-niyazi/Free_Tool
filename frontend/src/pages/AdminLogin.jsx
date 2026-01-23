import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { ShieldAlert, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { adminLogin } = useAdmin();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await adminLogin(username, password);
        if (res.success) {
            navigate('/management/dashboard');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-500/20 flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform">
                        <Lock size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Admin <span className="text-blue-500">Access</span></h1>
                    <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">Restricted Management Portal</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-slate-700 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold animate-shake">
                                <ShieldAlert size={20} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-600"
                                    placeholder="Enter identifier"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secret Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 group mt-8"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <>Initialize Session <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    Authorized Personnel Only • Secure 256-bit Encrypted
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
