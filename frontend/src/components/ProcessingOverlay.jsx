import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, ShieldCheck, Zap, FileJson, CheckCircle2 } from 'lucide-react';

const ProcessingOverlay = ({ isOpen, message = "Processing your request...", submessage = "This usually takes a few seconds" }) => {
    const [progress, setProgress] = useState(0);

    // Simulate progress for visual feedback
    useEffect(() => {
        let interval;
        if (isOpen) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    const next = prev + (Math.random() * 15);
                    return next > 90 ? 90 : next;
                });
            }, 600);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-[40px] shadow-2xl p-10 max-w-md w-full text-center border border-white/20 relative overflow-hidden"
                    >
                        {/* Animated background glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-blue-50 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-inner group">
                                <motion.div
                                    animate={{
                                        rotate: 360,
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{
                                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 1.5, repeat: Infinity }
                                    }}
                                    className="text-blue-600"
                                >
                                    <Sparkles size={40} />
                                </motion.div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2">{message}</h3>
                            <p className="text-slate-500 font-medium text-sm mb-10">{submessage}</p>

                            {/* Custom Progress Bar */}
                            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full relative"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-white/20"
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    />
                                </motion.div>
                            </div>

                            <div className="mt-4 flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Engine Active</span>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
                            </div>

                            <div className="mt-12 grid grid-cols-3 gap-4">
                                {[
                                    { icon: ShieldCheck, label: 'Secure' },
                                    { icon: Zap, label: 'Fast' },
                                    { icon: FileJson, label: 'AI Ready' }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                            <item.icon size={20} />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProcessingOverlay;
