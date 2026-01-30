import React, { useState } from 'react';
import { X, Phone, Lock, User, Mail, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        email: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let result;
        if (isLogin) {
            result = await login(formData.phone, formData.password);
        } else {
            result = await register(formData.name, formData.phone, formData.password, formData.email);
        }

        if (result.success) {
            onSuccess?.();
            onClose();
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Decoration */}
                        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-[32px]" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner">
                                    <ShieldCheck size={26} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">
                                    {isLogin ? 'Welcome Back' : 'Join N.A.I.R'}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm px-2">
                                    {isLogin
                                        ? 'Log in to securely download your files and keep track of your history.'
                                        : 'Create your free account to access unlimited downloads and history.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {!isLogin && (
                                    <div className="relative group">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold placeholder:font-medium text-slate-900 text-sm"
                                        />
                                    </div>
                                )}

                                <div className="relative group">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:font-medium text-slate-900"
                                    />
                                </div>

                                {!isLogin && (
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address (Optional)"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:font-medium text-slate-900"
                                        />
                                    </div>
                                )}

                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:font-medium text-slate-900"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            {isLogin ? 'Sign In' : 'Create Account'}
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-5 text-center">
                                <p className="text-slate-500 font-semibold text-xs">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                                </p>
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                    className="mt-1.5 text-blue-600 font-bold text-sm md:hover:underline underline-offset-4"
                                >
                                    {isLogin ? 'Create one for free' : 'Sign in to your account'}
                                </button>

                                {isLogin && (
                                    <div className="mt-5 pt-4 border-t border-slate-100">
                                        <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1.5">Want to earn with us?</p>
                                        <a
                                            href="/worker-signup"
                                            onClick={onClose}
                                            className="text-indigo-600 font-bold text-sm hover:text-indigo-700 md:hover:underline underline-offset-4 flex items-center justify-center gap-1"
                                        >
                                            Create professional account
                                            <ArrowRight size={13} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center rounded-b-[32px]">
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                Secure Login Protected by NAIR Solutions
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
