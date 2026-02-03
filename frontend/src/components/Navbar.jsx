import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Zap, LogOut, User as UserIcon, AlertCircle, X, ChevronDown, FileText, Image as ImageIcon, QrCode, Receipt, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileModal from './UserProfileModal';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { isLoggedIn, user, logout, setShowAuthModal } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
    ];

    const currentLanguage = languages.find(l => l.code === (i18n.language?.split('-')[0] || 'en')) || languages[0];

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <Link to="/" className="flex items-center space-x-3 mr-4 lg:mr-12 shrink-0">
                            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                                <Zap className="text-white" size={24} />
                            </div>
                            <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">N.A.I.R Solutions</span>
                        </Link>

                        <div className="hidden md:flex space-x-6 lg:space-x-8 items-center flex-1">
                            {/* Tools Dropdown */}
                            <div className="relative group"
                                onMouseEnter={() => setIsToolsOpen(true)}
                                onMouseLeave={() => setIsToolsOpen(false)}>
                                <button className="flex items-center gap-1.5 text-slate-600 group-hover:text-blue-600 font-bold transition-all text-sm lg:text-base py-7">
                                    {t('nav.tools')} <ChevronDown size={16} className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isToolsOpen && (
                                    <div className="absolute top-full left-0 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[60]">
                                        <Link to="/pdf-tools" onClick={() => setIsToolsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group/item">
                                            <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover/item:bg-red-100 transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <span className="font-bold text-sm">{t('nav.pdf_tools')}</span>
                                        </Link>
                                        <Link to="/image-tools" onClick={() => setIsToolsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group/item">
                                            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg group-hover/item:bg-orange-100 transition-colors">
                                                <ImageIcon size={18} />
                                            </div>
                                            <span className="font-bold text-sm">{t('nav.image_tools')}</span>
                                        </Link>
                                        <Link to="/qr-generator" onClick={() => setIsToolsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group/item">
                                            <div className="p-2 bg-purple-50 text-purple-500 rounded-lg group-hover/item:bg-purple-100 transition-colors">
                                                <QrCode size={18} />
                                            </div>
                                            <span className="font-bold text-sm">{t('nav.qr_generator')}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link
                                to="/invoice-generator"
                                onClick={(e) => {
                                    if (!isLoggedIn) {
                                        e.preventDefault();
                                        setShowAuthModal(true);
                                    }
                                }}
                                className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base whitespace-nowrap"
                            >
                                {t('nav.invoice_generator')}
                            </Link>
                            <Link
                                to="/financial-aid"
                                onClick={(e) => {
                                    if (!isLoggedIn) {
                                        e.preventDefault();
                                        setShowAuthModal(true);
                                    }
                                }}
                                className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base whitespace-nowrap"
                            >
                                {t('nav.financial_aid')}
                            </Link>
                            <Link
                                to="/events"
                                onClick={(e) => {
                                    if (!isLoggedIn) {
                                        e.preventDefault();
                                        setShowAuthModal(true);
                                    }
                                }}
                                className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base whitespace-nowrap"
                            >
                                {t('nav.events')}
                            </Link>
                            <Link to="/rewards-referral" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base">{t('nav.deals')}</Link>
                            {isLoggedIn && (
                                <Link to="/local-help" className="text-slate-600 hover:text-blue-600 font-bold transition-all text-sm lg:text-base whitespace-nowrap">{t('nav.local_help')}</Link>
                            )}

                            {isLoggedIn && <div className="h-6 w-px bg-slate-200 mx-2" />}

                            {/* Language Switcher */}
                            <div className="relative ml-4"
                                onMouseEnter={() => setIsLangOpen(true)}
                                onMouseLeave={() => setIsLangOpen(false)}>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all text-slate-600 hover:text-blue-600">
                                    <Languages size={18} />
                                    <span className="text-xs font-bold uppercase">{currentLanguage.code}</span>
                                    <ChevronDown size={12} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isLangOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-1 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-[70]"
                                        >
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        i18n.changeLanguage(lang.code);
                                                        setIsLangOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${i18n.language?.startsWith(lang.code)
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{lang.flag}</span>
                                                        <span>{lang.name}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {isLoggedIn ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowProfileModal(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 max-w-[150px] hover:bg-blue-100 transition-colors"
                                    >
                                        {user?.profilePicture ? (
                                            <img
                                                src={user.profilePicture}
                                                alt="Profile"
                                                className="w-6 h-6 rounded-full object-cover border border-blue-200 shrink-0"
                                            />
                                        ) : (
                                            <UserIcon size={16} className="shrink-0" />
                                        )}
                                        <span className="font-bold text-xs lg:text-sm truncate">{user?.name}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowLogoutConfirm(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                        title={t('nav.sign_out')}
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 hover:-translate-y-0.5 shadow-lg shadow-blue-200 active:scale-95 transition-all whitespace-nowrap"
                                >
                                    {t('nav.sign_in')}
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            {isLoggedIn && (
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 max-w-[120px] shrink overflow-hidden"
                                >
                                    {user?.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt="Profile"
                                            className="w-5 h-5 rounded-full object-cover border border-blue-200 shrink-0"
                                        />
                                    ) : (
                                        <UserIcon size={14} className="shrink-0" />
                                    )}
                                    <span className="font-bold text-[10px] truncate">{user?.name?.split(' ')[0]}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all shrink-0"
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
                            <div className="px-3 md:px-4 py-4 md:py-6 space-y-2">
                                {/* Mobile Tools Section */}
                                <div className="space-y-1 py-1">
                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('nav.tools')}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link to="/pdf-tools" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-slate-600 font-bold hover:bg-red-50 rounded-xl transition-all text-xs">
                                            <FileText size={14} className="text-red-500" /> {t('nav.pdf_tools')}
                                        </Link>
                                        <Link to="/image-tools" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-slate-600 font-bold hover:bg-orange-50 rounded-xl transition-all text-xs">
                                            <ImageIcon size={14} className="text-orange-500" /> {t('nav.image_tools')}
                                        </Link>
                                        <Link to="/qr-generator" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-slate-600 font-bold hover:bg-purple-50 rounded-xl transition-all text-xs">
                                            <QrCode size={14} className="text-purple-500" /> {t('nav.qr_gen_short')}
                                        </Link>
                                    </div>
                                </div>

                                <Link
                                    to="/invoice-generator"
                                    onClick={(e) => {
                                        if (!isLoggedIn) {
                                            e.preventDefault();
                                            setIsMenuOpen(false);
                                            setShowAuthModal(true);
                                        } else {
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className="block px-3 py-2.5 text-slate-700 font-bold hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    {t('nav.invoice_generator')}
                                </Link>
                                <Link
                                    to="/financial-aid"
                                    onClick={(e) => {
                                        if (!isLoggedIn) {
                                            e.preventDefault();
                                            setIsMenuOpen(false);
                                            setShowAuthModal(true);
                                        } else {
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className="block px-3 py-2.5 text-slate-700 font-bold hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    {t('nav.financial_aid')}
                                </Link>
                                <Link
                                    to="/events"
                                    onClick={(e) => {
                                        if (!isLoggedIn) {
                                            e.preventDefault();
                                            setIsMenuOpen(false);
                                            setShowAuthModal(true);
                                        } else {
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className="block px-3 py-2.5 text-slate-700 font-bold hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    {t('nav.events_near_me')}
                                </Link>
                                <Link to="/rewards-referral" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-slate-700 font-bold hover:bg-blue-50 rounded-xl transition-all">{t('nav.deals')}</Link>
                                {isLoggedIn && (
                                    <Link to="/local-help" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-slate-700 font-bold hover:bg-blue-50 rounded-xl transition-all">{t('nav.local_help')}</Link>
                                )}

                                {/* Mobile Language Switcher */}
                                <div className="pt-2 pb-2">
                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Language</div>
                                    <div className="flex flex-wrap gap-2 px-3">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => i18n.changeLanguage(lang.code)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${i18n.language?.startsWith(lang.code)
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-slate-50 text-slate-600'
                                                    }`}
                                            >
                                                {lang.flag} {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                            {t('nav.sign_out')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                setShowAuthModal(true);
                                            }}
                                            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                        >
                                            {t('nav.sign_in')}
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
                            <div className="p-6 md:p-8 text-center">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">{t('logout.confirm_title')}</h3>
                                <p className="text-slate-500 font-medium mb-8">
                                    {t('logout.confirm_message')}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                    >
                                        {t('logout.cancel')}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all"
                                    >
                                        {t('logout.confirm_button')}
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

            <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        </>
    );
};

export default Navbar;
