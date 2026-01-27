import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, LogOut, User as UserIcon, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { isLoggedIn, user, logout, setShowAuthModal } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <Link to="/" className="flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                                <Zap className="text-white" size={24} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">N.A.I.R <span className="text-blue-600">Solutions</span></span>
                        </Link>

                        <div className="hidden md:flex space-x-6 items-center">
                            <Link to="/" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">Home</Link>
                            <Link to="/pdf-tools" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">PDF Tools</Link>
                            <Link to="/image-tools" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">Image Tools</Link>
                            <Link to="/qr-generator" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">QR Generator</Link>
                            <Link to="/invoice-generator" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">Invoice Generator</Link>
                            {isLoggedIn && (
                                <Link to="/local-help" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">Local Help</Link>
                            )}

                            <div className="h-6 w-px bg-slate-200 mx-1" />

                            {isLoggedIn ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 max-w-[150px]">
                                        <UserIcon size={16} className="shrink-0" />
                                        <span className="font-bold text-xs lg:text-sm truncate">{user?.name}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowLogoutConfirm(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 hover:-translate-y-0.5 shadow-lg shadow-blue-200 active:scale-95 transition-all whitespace-nowrap"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-4">
                            {isLoggedIn && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 max-w-[100px]">
                                    <UserIcon size={14} className="shrink-0" />
                                    <span className="font-bold text-[10px] truncate">{user?.name?.split(' ')[0]}</span>
                                </div>
                            )}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                {isMenuOpen ? <X size={24} /> : (
                                    <div className="space-y-1.5">
                                        <div className="w-6 h-0.5 bg-slate-900 rounded-full" />
                                        <div className="w-4 h-0.5 bg-slate-900 rounded-full" />
                                        <div className="w-6 h-0.5 bg-slate-900 rounded-full" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-slate-50 overflow-hidden"
                        >
                            <div className="px-4 py-6 space-y-4">
                                <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-900 font-black hover:bg-blue-50 rounded-2xl transition-all">Home</Link>
                                <Link to="/pdf-tools" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-900 font-black hover:bg-blue-50 rounded-2xl transition-all">PDF Tools</Link>
                                <Link to="/image-tools" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-900 font-black hover:bg-blue-50 rounded-2xl transition-all">Image Tools</Link>
                                <Link to="/qr-generator" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-900 font-black hover:bg-blue-50 rounded-2xl transition-all">QR Generator</Link>
                                <Link to="/invoice-generator" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-900 font-black hover:bg-blue-50 rounded-2xl transition-all">Invoice Generator</Link>
                                {isLoggedIn && (
                                    <Link to="/local-help" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-900 font-black hover:bg-blue-50 rounded-2xl transition-all">Local Help</Link>
                                )}

                                <div className="pt-4 border-t border-slate-50">
                                    {isLoggedIn ? (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                setShowLogoutConfirm(true);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition-all"
                                        >
                                            <LogOut size={20} />
                                            Sign Out
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                setShowAuthModal(true);
                                            }}
                                            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                        >
                                            Sign In
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Sign Out?</h3>
                                <p className="text-slate-500 font-medium mb-8">
                                    Are you sure you want to sign out of your account?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
