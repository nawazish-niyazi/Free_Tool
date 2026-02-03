import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { FileType, Image, Zap, Shield, FileText, Layers, Lock, Unlock, Droplets, Eraser, Building2, Sparkles, Search, QrCode, Landmark, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Home = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Rotating Placeholder Logic
    const categories = ['Electrician', 'Plumber', 'Painter', 'Carpenter', 'Singer', 'Mechanic', 'Developer', 'Designer', 'Consultant'];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % categories.length);
        }, 1500); // 1.5 seconds for a smooth rotation
        return () => clearInterval(interval);
    }, []);
    /**
     * List of all tools shown on the home page.
     * Each tool has a title, description, icon, and link.
     */
    const tools = [
        {
            title: t('home.tools.local_help_title'),
            description: t('home.tools.local_help_desc'),
            icon: Search,
            to: '/local-help',
            color: 'bg-cyan-100 hover:bg-cyan-200'
        },
        {
            title: t('home.tools.financial_aid_title'),
            description: t('home.tools.financial_aid_desc'),
            icon: Landmark,
            to: '/financial-aid',
            color: 'bg-rose-100 hover:bg-rose-200'
        },
        {
            title: t('home.tools.invoice_generator_title'),
            description: t('home.tools.invoice_generator_desc'),
            icon: Building2,
            to: '/invoice-generator',
            color: 'bg-slate-200 hover:bg-slate-300 border-2 border-slate-900/5'
        },
        {
            title: t('home.tools.events_title'),
            description: t('home.tools.events_desc'),
            icon: Calendar,
            to: '/events',
            color: 'bg-orange-100 hover:bg-orange-200'
        },
        {
            title: t('home.tools.qr_generator_title'),
            description: t('home.tools.qr_generator_desc'),
            icon: QrCode,
            to: '/qr-generator',
            color: 'bg-yellow-100 hover:bg-yellow-200'
        },
        {
            title: t('home.tools.pdf_tools_title'),
            description: t('home.tools.pdf_tools_desc'),
            icon: FileText,
            to: '/pdf-tools',
            color: 'bg-indigo-100 hover:bg-indigo-200'
        },
        {
            title: t('home.tools.image_tools_title'),
            description: t('home.tools.image_tools_desc'),
            icon: Image,
            to: '/image-tools',
            color: 'bg-emerald-100 hover:bg-emerald-200'
        },
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* The top navigation bar */}
            <Navbar />

            {/* Hero Section: The big welcome text at the top (Restored to original centered style) */}
            <div className="relative isolate px-4 sm:px-6 pt-10 sm:pt-12 lg:px-8">
                <div className="mx-auto max-w-4xl py-8 sm:py-20 lg:pt-14 lg:pb-24 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
                        {t('home.hero_title_1')} <span className="text-blue-600">{t('home.hero_title_2')}</span>
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-gray-600 mb-10 max-w-2xl mx-auto px-4">
                        {t('home.hero_subtitle')}
                    </p>

                    {/* Local Help Line: Premium Mobile-First Search Bar */}
                    {user && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center px-4 max-w-2xl mx-auto w-full"
                        >
                            <div className="flex items-center mb-5">
                                <h2 className="text-sm md:text-xl font-black text-slate-900 uppercase">{t('home.search_title')}</h2>
                            </div>

                            <Link to="/local-help" className="w-full">
                                <motion.div
                                    className="group w-full flex items-center gap-3 p-2 md:p-2.5 bg-white rounded-full border-2 border-slate-200 md:hover:border-blue-500 transition-all duration-300 shadow-xl shadow-slate-100 md:hover:shadow-blue-100 cursor-pointer transform md:hover:-translate-y-1"
                                >
                                    <div className="flex-1 flex items-center gap-3 pl-2 md:pl-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full group-hover:bg-white group-hover:shadow-md transition-all">
                                            <Search size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <div className="flex items-center gap-1.5 overflow-hidden h-6 md:h-8">
                                            <span className="text-sm md:text-lg text-slate-400 font-semibold whitespace-nowrap">
                                                {t('home.search_prefix')}
                                            </span>
                                            <div className="relative h-full flex items-center">
                                                <AnimatePresence mode="wait">
                                                    <motion.span
                                                        key={categories[index]}
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -20, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                                        className="text-sm md:text-lg text-blue-600 font-bold whitespace-nowrap"
                                                    >
                                                        {categories[index]}...
                                                    </motion.span>
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 group-hover:rotate-[360deg] transition-all duration-700 flex-shrink-0">
                                        <Zap size={18} fill="white" className="drop-shadow-sm" />
                                    </div>
                                </motion.div>
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Tools Grid: Shows all the tools categorized in boxes */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Loop through the tools list and create a 'ToolCard' component for each one */}
                    {tools.map((tool, index) => (
                        <ToolCard key={index} {...tool} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;

