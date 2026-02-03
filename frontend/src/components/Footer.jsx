import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Instagram, Linkedin, Send, ExternalLink, Copyright, MessageSquare, Zap } from 'lucide-react';

const Footer = () => {
    const handleSubmitAdvertisement = (e) => {
        e.preventDefault();
        const email = "nairsolutions02@gmail.com";
        const subject = encodeURIComponent("Advertisement Inquiry - NAIR SOLUTIONS");
        const body = encodeURIComponent("Hello,\n\nI am interested in advertising on NAIR SOLUTIONS. Please provide more details.\n\nRegards,");
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    return (
        <footer className="bg-slate-900 pt-12 md:pt-20 pb-8 md:pb-10 px-3 md:px-6 lg:px-8 mt-auto overflow-hidden w-full">
            <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
                    {/* Brand & Socials Section */}
                    <div className="space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <Zap className="text-white" size={24} />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight italic">NAIR <span className="text-blue-500">SOLUTIONS</span></span>
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-lg md:max-w-xs text-sm md:text-base">
                            Empowering your digital journey with professional tools and local connections. Built for efficiency, designed for you.
                        </p>
                        <div className="flex gap-4">
                            <motion.a
                                whileHover={{ y: -5, scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://www.instagram.com/code2dbug?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 md:w-11 md:h-11 bg-slate-800/50 backdrop-blur text-slate-400 rounded-2xl flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition-all shadow-xl"
                            >
                                <Instagram size={22} />
                            </motion.a>
                            <motion.a
                                whileHover={{ y: -5, scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://www.linkedin.com/company/code2dbug"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 md:w-11 md:h-11 bg-slate-800/50 backdrop-blur text-slate-400 rounded-2xl flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-all shadow-xl"
                            >
                                <Linkedin size={22} />
                            </motion.a>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="space-y-8 text-center md:text-left flex flex-col items-center md:items-start">
                        <h3 className="text-white font-black text-lg tracking-tight uppercase border-b-2 border-blue-600 pb-1 inline-block">Contact Us</h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-x-12 gap-y-8 w-full">
                            <a href="tel:9827563406" className="flex flex-col items-center md:items-start gap-3 group cursor-pointer">
                                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <Phone size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Call us</p>
                                    <p className="text-white font-bold text-base md:text-lg">98275 63406</p>
                                    <p className="text-slate-300 font-semibold text-sm">747 066 9907</p>
                                </div>
                            </a>
                            <a href="mailto:nairsolutions02@gmail.com" className="flex flex-col items-center md:items-start gap-3 group cursor-pointer">
                                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <Mail size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Email us</p>
                                    <p className="text-white font-bold text-base md:text-lg">nairsolutions02@gmail.com</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Advertisement Section */}
                    <div className="space-y-6 w-full">
                        <h3 className="text-white font-black text-lg tracking-tight uppercase text-center md:text-left">Advertisement</h3>
                        <div className="p-5 md:p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-[2rem] space-y-4 md:space-y-5 backdrop-blur-md shadow-2xl relative overflow-hidden group w-full">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-blue-600/10 transition-colors" />
                            <div className="flex items-center gap-2 text-blue-500 justify-center md:justify-start">
                                <MessageSquare size={20} className="animate-pulse" />
                                <span className="font-black text-xs uppercase tracking-widest leading-none">Partner with Us</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed text-center md:text-left">
                                Showcase your brand to our growing community. Get noticed by professional service providers and users.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmitAdvertisement}
                                className="w-full py-3.5 md:py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                Contact for Ads
                                <Send size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-6 w-full">
                        <h3 className="text-white font-black text-lg tracking-tight uppercase text-center md:text-left">Find Us</h3>
                        <div className="rounded-[2rem] overflow-hidden border border-slate-700/50 shadow-2xl h-56 md:h-48 group relative w-full">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3719.647478881766!2d81.32667057504906!3d21.20615848048798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a293dc78703616f%3A0x3f591dbc7d22f0e8!2sNAIR%20SOLUTIONS!5e0!3m2!1sen!2sin!4v1769778603864!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                            ></iframe>
                            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none group-hover:bg-transparent transition-colors" />
                            <a
                                href="https://maps.app.goo.gl/9ZpL9pL9pL9pL9pL9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-xl"
                            >
                                <ExternalLink size={16} className="text-white" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-slate-500">
                        <Copyright size={16} className="hidden md:block" />
                        <p className="text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] text-center">
                            © {new Date().getFullYear()} <span className="text-blue-500">NAIR SOLUTIONS</span>. <span className="block md:inline mt-1 md:mt-0 opacity-50 md:opacity-100">All Rights Reserved.</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <a href="#" className="hover:text-blue-500 hover:-translate-y-0.5 transition-all">Privacy Policy</a>
                        <a href="#" className="hover:text-blue-500 hover:-translate-y-0.5 transition-all">Terms</a>
                        <a href="#" className="hover:text-blue-500 hover:-translate-y-0.5 transition-all">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
