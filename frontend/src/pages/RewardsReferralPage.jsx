import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Gift, Ticket, Share2, Copy, Check, Info, Users, MapPin, Briefcase, Phone, Send, Loader2, Star, Sparkles, Heart, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import api from '../api/axios';

const CouponCard = ({ coupon, isGrid = false, capturedCodes, handleRevealAndCopy, copiedCode, t }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -15, scale: 1.02 }}
        className={`bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col group shrink-0 transition-all duration-500 ${isGrid ? 'w-full' : 'w-[300px] md:w-[340px] lg:w-[360px] snap-start'
            }`}
    >
        <div className="h-44 relative overflow-hidden">
            <img
                src={coupon.image}
                alt={coupon.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-blue-600 font-black text-[10px] shadow-lg uppercase tracking-wider">
                {t('rewards.limited')}
            </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{coupon.title}</h3>
            <p className="text-slate-500 font-medium text-sm mb-4 line-clamp-2">{coupon.description}</p>

            <div className="space-y-2 mb-6">
                {coupon.keyPoints?.slice(0, 3).map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600 font-semibold text-[11px] md:text-xs">
                        <div className="w-4 h-4 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                            <Check size={10} strokeWidth={3} />
                        </div>
                        {point}
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <AnimatePresence mode="wait">
                    {capturedCodes.includes(coupon._id) ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-between mb-3"
                        >
                            <div>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('rewards.code')}</p>
                                <p className="text-base font-black text-blue-800 tracking-widest uppercase">{coupon.code}</p>
                            </div>
                            <button
                                onClick={() => (handleRevealAndCopy(coupon._id, coupon.code))}
                                className="p-2 bg-white text-blue-600 rounded-lg shadow-md hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                            >
                                {copiedCode === coupon.code ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <button
                    onClick={() => handleRevealAndCopy(coupon._id, coupon.code)}
                    className={`w-full py-3 rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 ${capturedCodes.includes(coupon._id)
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1'
                        }`}
                    disabled={capturedCodes.includes(coupon._id)}
                >
                    {capturedCodes.includes(coupon._id) ? t('rewards.code_revealed') : t('rewards.get_code')}
                </button>
            </div>
        </div>
    </motion.div>
);

const RewardsReferralPage = () => {
    const { t } = useTranslation();
    const { isLoggedIn, setShowAuthModal } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const [referralSuccess, setReferralSuccess] = useState(false);
    const [area, setArea] = useState('');
    const [capturedCodes, setCapturedCodes] = useState([]); // Array of revealed coupon IDs
    const [referralData, setReferralData] = useState({
        name: '',
        service: '',
        number: '',
        area: ''
    });
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const scrollRef = useRef(null);

    const updateScrollState = () => {
        const { current } = scrollRef;
        if (current) {
            setCanScrollLeft(current.scrollLeft > 20);
            setCanScrollRight(
                current.scrollLeft < current.scrollWidth - current.clientWidth - 20
            );
        }
    };

    const scroll = (direction) => {
        const { current } = scrollRef;
        if (current) {
            // Scroll by exactly one tile width + gap (360 + 32 = 392)
            const scrollAmount = window.innerWidth > 1024 ? 392 : 340;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
            setTimeout(updateScrollState, 500);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    useEffect(() => {
        if (!loading && coupons.length > 0) {
            // Initial check after data is loaded and DOM is rendered
            setTimeout(updateScrollState, 100);
        }
    }, [loading, coupons]);

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/rewards/coupons');
            if (res.data.success) {
                setCoupons(res.data.data);
            }
        } catch (err) {
            console.error('Fetch coupons error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevealAndCopy = (couponId, code) => {
        if (!capturedCodes.includes(couponId)) {
            setCapturedCodes([...capturedCodes, couponId]);
        }
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleReferralSubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/rewards/referrals', referralData);
            if (res.data.success) {
                setReferralSuccess(true);
                setReferralData({ name: '', service: '', number: '', area: '' });
                setTimeout(() => setReferralSuccess(false), 5000);
            }
        } catch (err) {
            console.error('Referral error:', err);
            alert(t('common.error_title') + ': ' + (err.response?.data?.message || 'Failed to submit referral.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReferralChange = (e) => {
        setReferralData({ ...referralData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12 md:py-20 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold mb-6">
                        <Sparkles size={16} />
                        {t('rewards.tagline')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        {t('rewards.hero_title_1')} <span className="text-blue-200">{t('rewards.hero_title_2')}</span>
                    </h1>
                    <p className="text-blue-50 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('rewards.hero_subtitle')}
                    </p>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

                {/* Find Coupons Tile */}
                <div className="mb-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <Ticket size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('rewards.coupons_title')}</h2>
                        </div>

                        {coupons.length > 3 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-sm group"
                            >
                                {showAll ? t('rewards.show_slider') : t('rewards.view_all')}
                                <motion.div
                                    animate={{ rotate: showAll ? 180 : 0 }}
                                    className="text-blue-500 group-hover:text-white"
                                >
                                    <ChevronDown size={20} />
                                </motion.div>
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        {!showAll && coupons.length > 0 && (
                            <>
                                <button
                                    onClick={() => scroll('left')}
                                    className="absolute -left-12 md:-left-20 lg:-left-24 top-1/2 -translate-y-1/2 z-40 p-5 bg-white border border-slate-100 text-slate-600 rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex active:scale-90 items-center justify-center scale-90 group-hover:scale-100 translate-x-4 group-hover:translate-x-0"
                                >
                                    <ChevronLeft size={28} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => scroll('right')}
                                    className="absolute -right-12 md:-right-20 lg:-right-24 top-1/2 -translate-y-1/2 z-40 p-5 bg-white border border-slate-100 text-slate-600 rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex active:scale-90 items-center justify-center scale-90 group-hover:scale-100 -translate-x-4 group-hover:translate-x-0"
                                >
                                    <ChevronRight size={28} strokeWidth={3} />
                                </button>
                            </>
                        )}

                        {loading ? (
                            <div className="flex gap-6 overflow-hidden">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-[32px] w-[320px] shrink-0 h-[450px] animate-pulse border border-slate-100 shadow-sm" />
                                ))}
                            </div>
                        ) : coupons.length > 0 ? (
                            <AnimatePresence mode="wait">
                                {!showAll ? (
                                    <motion.div
                                        key="slider"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative"
                                    >
                                        <div
                                            ref={scrollRef}
                                            onScroll={updateScrollState}
                                            className="flex gap-8 overflow-x-auto pb-8 pt-4 scrollbar-hide snap-x snap-mandatory no-scrollbar"
                                            style={{
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none',
                                                WebkitMaskImage: `linear-gradient(to right, 
                                                    ${canScrollLeft ? 'transparent' : 'black'} 0%, 
                                                    black ${canScrollLeft ? '10%' : '0%'}, 
                                                    black ${canScrollRight ? '90%' : '100%'}, 
                                                    ${canScrollRight ? 'transparent' : 'black'} 100%)`,
                                                maskImage: `linear-gradient(to right, 
                                                    ${canScrollLeft ? 'transparent' : 'black'} 0%, 
                                                    black ${canScrollLeft ? '10%' : '0%'}, 
                                                    black ${canScrollRight ? '90%' : '100%'}, 
                                                    ${canScrollRight ? 'transparent' : 'black'} 100%)`
                                            }}
                                        >
                                            {coupons.map((coupon) => (
                                                <CouponCard
                                                    key={coupon._id}
                                                    coupon={coupon}
                                                    capturedCodes={capturedCodes}
                                                    handleRevealAndCopy={handleRevealAndCopy}
                                                    copiedCode={copiedCode}
                                                    t={t}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="grid"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-12"
                                    >
                                        {coupons.map((coupon) => (
                                            <CouponCard
                                                key={coupon._id}
                                                coupon={coupon}
                                                isGrid
                                                capturedCodes={capturedCodes}
                                                handleRevealAndCopy={handleRevealAndCopy}
                                                copiedCode={copiedCode}
                                                t={t}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ) : (
                            <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
                                <Ticket className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-800 mb-2">{t('rewards.no_coupons')}</h3>
                                <p className="text-slate-500 font-medium">{t('rewards.no_coupons_desc')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Referrals & Rewards Tile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <Users size={28} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('rewards.referral_title')}</h2>
                        </div>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed mb-6">
                            {t('rewards.referral_desc')}
                        </p>


                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-blue-900/10 border border-slate-100 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 bg-blue-50/50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />

                        <h3 className="text-2xl font-black text-slate-900 mb-8 relative">{t('rewards.submit_title')}</h3>

                        <form onSubmit={handleReferralSubmit} className="space-y-6 relative">
                            {referralSuccess ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-green-50 border border-green-100 p-8 rounded-3xl text-center"
                                >
                                    <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                                        <Check size={32} />
                                    </div>
                                    <h4 className="text-xl font-black text-green-900 mb-2">{t('rewards.success_title')}</h4>
                                    <p className="text-green-700 font-bold">{t('rewards.success_desc')}</p>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Users size={20} />
                                            </div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-14 z-10 transition-colors group-focus-within:text-blue-500">{t('rewards.label_name')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                placeholder={t('rewards.placeholder_name')}
                                                value={referralData.name}
                                                onChange={handleReferralChange}
                                                className="w-full pl-14 pr-6 pt-8 pb-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Briefcase size={20} />
                                            </div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-14 z-10 transition-colors group-focus-within:text-blue-500">{t('rewards.label_service')}</label>
                                            <input
                                                type="text"
                                                name="service"
                                                required
                                                placeholder={t('rewards.placeholder_service')}
                                                value={referralData.service}
                                                onChange={handleReferralChange}
                                                className="w-full pl-14 pr-6 pt-8 pb-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Phone size={20} />
                                            </div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-14 z-10 transition-colors group-focus-within:text-blue-500">{t('rewards.label_phone')}</label>
                                            <input
                                                type="tel"
                                                name="number"
                                                required
                                                placeholder={t('rewards.placeholder_phone')}
                                                value={referralData.number}
                                                onChange={handleReferralChange}
                                                className="w-full pl-14 pr-6 pt-8 pb-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <MapPin size={20} />
                                            </div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-14 z-10 transition-colors group-focus-within:text-blue-500">{t('rewards.label_area')}</label>
                                            <input
                                                type="text"
                                                name="area"
                                                required
                                                placeholder={t('rewards.placeholder_area')}
                                                value={referralData.area}
                                                onChange={handleReferralChange}
                                                className="w-full pl-14 pr-6 pt-8 pb-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                {t('rewards.submit_button')}
                                                <Send size={24} />
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </form>
                    </motion.div>
                </div>
            </div>

        </div>
    );
};

export default RewardsReferralPage;

