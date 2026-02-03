import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar, MapPin, Clock, Search, Loader2, PartyPopper, ArrowRight, ExternalLink, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RestrictedAccess from '../components/RestrictedAccess';

const EventsPage = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                if (res.data.success) {
                    setEvents(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full font-black text-xs uppercase tracking-widest"
                    >
                        <PartyPopper size={14} />
                        What's Happening Locally
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight">
                        Events <span className="text-orange-500">Near You</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                        Stay updated with the latest workshops, festivals, and community gatherings in your neighborhood.
                    </p>
                </div>

                {!isLoggedIn ? (
                    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <RestrictedAccess onLoginClick={() => setShowAuthModal(true)} />
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading upcoming events...</p>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {events.map((event, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={event._id}
                                className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-orange-200/30 transition-all duration-500 hover:-translate-y-2"
                            >
                                {/* Image Section */}
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                    <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg">
                                        <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                                            <CalendarDays size={14} className="text-orange-500" />
                                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-orange-500" />
                                            {event.location}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-orange-500 transition-colors leading-tight">
                                        {event.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                                        {event.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Organized By</p>
                                            <p className="text-sm font-bold text-slate-700">{event.organizer || 'Local Community'}</p>
                                        </div>
                                        {event.link && (
                                            <a
                                                href={event.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <ExternalLink size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Calendar size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Events Scheduled</h3>
                        <p className="text-slate-500 font-medium max-w-md mx-auto">
                            It's quiet for now! Please check back soon or follow us for updates on upcoming workshops and festivals.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
