import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, MapPin, Briefcase, Phone, User, Star, ShieldCheck, Clock, MessageSquare, Send, ChevronRight, Lock, Loader2, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CATEGORIES = [
    {
        name: "House Needs",
        services: ["Electrician", "Plumber", "Carpenter", "Carpenter with Supplies", "Painter", "House Help", "Gardener", "Water Supply", "Lock and Key", "AC Repair", "RO Repair", "Garbage Collector"]
    },
    {
        name: "Food & Help",
        services: ["Cook", "Helper", "Local Mess"]
    },
    {
        name: "Automobile",
        services: ["Driver", "Driver + Vehicle", "Auto Driver"]
    },
    {
        name: "Mechanics and Repairing",
        services: ["Car Mechanic", "Bike Mechanic", "Car Wash", "RO Repair", "AC Repair", "Laptop Repair"]
    },
    {
        name: "Entertainment",
        services: ["Anchor", "Clown", "Poet", "Comedian", "Singer", "Dancer", "Sound Engineer", "DJ"]
    },
    {
        name: "Fashion & Makeup",
        services: ["Makeup Artist", "Designer", "Tailor", "Salon", "Tattoo Artist"]
    },
    {
        name: "Art & Crafts",
        services: ["Potter", "Sculpture Artist", "Wall Art", "Handicrafts", "Mehendi Artist"]
    },
    {
        name: "Freelancers",
        services: ["Project Developer", "Practical Writer", "Photographer", "Editor", "Matchmaker", "Vet Grooming", "Vet Health"]
    },
    {
        name: "Tutors",
        services: ["Educational Tutor", "Sign Language", "Braille", "Cooking Tutor", "Martial Art", "Yoga"]
    },
    {
        name: "Health & Care",
        services: ["Doctor", "Caretaker", "Babysitter", "House Nurse", "Private Ambulance", "Therapist", "Counselor", "Massage Therapist", "Dietitian", "Mortuary"]
    },
    {
        name: "Religious Center",
        services: ["Pandit", "Qadri & Imam", "Church Father", "Bhajan Mandli"]
    },
    {
        name: "Govt Center",
        services: ["Choice Center", "NGO Helpline"]
    },
    {
        name: "Caterers & Tent",
        services: ["Catering", "Tent", "Catering + Tent", "Transgender Help"]
    },
    {
        name: "Others",
        services: ["Construction Worker", "Donation & Recycling"]
    }
];

const LOCATIONS = ["Smriti Nagar", "Nehru Nagar", "Kohka", "Supela", "Durg"];

const LocalHelpPage = () => {
    const { user: authUser, isLoggedIn, setShowAuthModal } = useAuth();
    const navigate = useNavigate();

    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [newReview, setNewReview] = useState({ workerId: null, rating: 5, comment: '' });

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedLocation) params.location = selectedLocation.toLowerCase();
            if (selectedCategory) params.category = selectedCategory;
            if (selectedService) params.service = selectedService;

            const res = await axios.get('http://localhost:5000/api/local-help/professionals', { params });
            if (res.data.success) {
                setWorkers(res.data.data);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchWorkers();
        setHasSearched(true);
    };

    const handleAddReview = async (workerId) => {
        if (!newReview.comment.trim()) return;

        try {
            const res = await axios.post(`http://localhost:5000/api/local-help/review/${workerId}`, {
                rating: newReview.rating,
                comment: newReview.comment
            });

            if (res.data.success) {
                // Update local state
                setWorkers(prev => prev.map(w => w._id === workerId ? res.data.data : w));
                setNewReview({ workerId: null, rating: 5, comment: '' });
            }
        } catch (err) {
            console.error('Review error:', err);
            alert('Failed to add review');
        }
    };

    const seedData = async () => {
        if (!window.confirm("This will reset and seed new professionals data. Continue?")) return;
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/local-help/seed');
            fetchWorkers();
            alert("Data seeded successfully!");
        } catch (err) {
            console.error('Seed error:', err);
            alert('Seed failed');
        } finally {
            setLoading(false);
        }
    };

    // Update derived services when category changes
    const availableServices = CATEGORIES.find(c => c.name === selectedCategory)?.services || [];

    useEffect(() => {
        if (isLoggedIn) {
            fetchWorkers();
        }
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-xl shadow-blue-900/5 border border-gray-100">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Lock size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Login Required</h2>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                            The Local Help Line is an exclusive feature for our registered members. Please sign in to find verified professionals near you.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                            >
                                Sign In Now
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-gray-100 text-slate-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <div className="inline-flex py-2 px-4 bg-blue-50 text-blue-600 rounded-full font-bold text-[11px] uppercase tracking-widest mb-4 border border-blue-100 shadow-sm items-center gap-2">
                        <Sparkles size={14} /> Verified Help Line
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">
                        Local <span className="text-blue-600">Help Line</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
                        Find verified professionals for all your home, automobile, and personal needs in your neighborhood.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <Filter className="text-blue-600" size={20} /> Filters
                                </h2>
                                <button
                                    onClick={seedData}
                                    className="text-[9px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-all uppercase tracking-wider"
                                    title="Developer: Click to reset demo data"
                                >
                                    Reset Data
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Location Select */}
                                <section>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">Where?</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                        <select
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Locations</option>
                                            {LOCATIONS.map(loc => (
                                                <option key={loc} value={loc.toLowerCase()}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                </section>

                                {/* Category Select */}
                                <section>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">Category</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => {
                                                setSelectedCategory(e.target.value);
                                                setSelectedService('');
                                            }}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Categories</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </section>

                                {/* Service (Sub-category) Select */}
                                <section className={`transition-all duration-300 ${!selectedCategory ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">Specific Service</label>
                                    <div className="relative">
                                        <ChevronRight className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                        <select
                                            value={selectedService}
                                            onChange={(e) => setSelectedService(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">{selectedCategory ? `All ${selectedCategory}` : "Select Category"}</option>
                                            {availableServices.map(svc => (
                                                <option key={svc} value={svc}>{svc}</option>
                                            ))}
                                        </select>
                                    </div>
                                </section>

                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2.5 text-base disabled:opacity-50 group mt-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Apply Search <Search size={20} className="group-hover:translate-x-0.5 transition-transform" /></>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="lg:col-span-9">
                        {loading && workers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                                <p className="font-bold text-slate-500 uppercase tracking-widest">Searching Professionals...</p>
                            </div>
                        ) : workers.length > 0 ? (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">
                                        {workers.length} Professionals <span className="text-blue-600">Found</span>
                                    </h3>
                                </div>
                                {workers.map(worker => (
                                    <div key={worker._id} className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-2xl shadow-blue-900/5 hover:translate-x-1.5 transition-all group overflow-hidden relative">
                                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
                                            {/* Avatar & Basic Info */}
                                            <div className="flex flex-col items-center text-center md:w-40 shrink-0">
                                                <div className="w-20 h-20 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 mb-3 shadow-inner border border-blue-100 group-hover:scale-105 transition-transform">
                                                    <User size={40} />
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500 font-black text-base mb-1 bg-amber-50 px-2.5 py-1 rounded-full">
                                                    <Star size={16} className="fill-current" /> {worker.rating}
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{worker.experience} Exp.</p>
                                            </div>

                                            {/* Name, Category & Contact */}
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                    <div>
                                                        <h4 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{worker.name}</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md shadow-blue-200">
                                                                {worker.service}
                                                            </span>
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                {worker.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <a href={`tel:${worker.number}`} className="flex items-center gap-2.5 py-2.5 px-5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-200 group/btn">
                                                            <Phone size={18} className="group-hover/btn:animate-bounce" />
                                                            <span className="font-black tracking-tight text-sm">{worker.number}</span>
                                                        </a>
                                                        <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 bg-green-50 rounded-lg">
                                                            <ShieldCheck size={14} /> Verified Pro
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 py-3 border-t border-slate-50">
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                                                        <MapPin size={16} className="text-blue-500" /> {worker.location}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                                                        <Clock size={16} className="text-blue-500" /> Active Local
                                                    </div>
                                                </div>

                                                {/* Reviews Section */}
                                                <div className="mt-6 space-y-3">
                                                    <h5 className="font-black text-slate-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
                                                        <MessageSquare size={14} className="text-blue-600" /> Customer Reviews ({worker.reviews?.length || 0})
                                                    </h5>
                                                    <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                                        {worker.reviews?.map((review, idx) => (
                                                            <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 relative group/rev">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-black text-slate-900 text-[10px]">{review.user}</span>
                                                                    <div className="flex gap-0.5">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star key={i} size={8} className={i < review.rating ? "text-amber-500 fill-current" : "text-slate-200"} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <p className="text-slate-600 text-[11px] leading-relaxed font-medium">"{review.comment}"</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Quick Review Input */}
                                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                                        <div className="flex items-center gap-1.5 mb-2.5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    onClick={() => setNewReview({ ...newReview, workerId: worker._id, rating: star })}
                                                                    className="transition-transform active:scale-90"
                                                                >
                                                                    <Star
                                                                        size={16}
                                                                        className={(newReview.workerId === worker._id ? newReview.rating : 5) >= star ? "text-amber-500 fill-current" : "text-slate-200"}
                                                                    />
                                                                </button>
                                                            ))}
                                                            <span className="text-[9px] font-black text-slate-300 uppercase ml-1 tracking-widest leading-none">Tap to rate</span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Quick comment..."
                                                                value={newReview.workerId === worker._id ? newReview.comment : ''}
                                                                onChange={(e) => setNewReview({ ...newReview, workerId: worker._id, comment: e.target.value })}
                                                                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/5 focus:bg-white outline-none font-bold placeholder:text-slate-300 transition-all"
                                                            />
                                                            <button
                                                                onClick={() => handleAddReview(worker._id)}
                                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                                                            >
                                                                <Send size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-blue-50 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center">
                                <Search className="w-24 h-24 text-slate-100 mb-8" />
                                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Nothing Found</h3>
                                <p className="text-slate-500 max-w-sm mx-auto font-medium mb-12">
                                    We couldn't find any professionals matching your current filters. Try different keywords or reset your search.
                                </p>
                                <button
                                    onClick={() => { setSelectedLocation(''); setSelectedCategory(''); setSelectedService(''); fetchWorkers(); setHasSearched(false); }}
                                    className="px-12 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-sm shadow-xl shadow-slate-100"
                                >
                                    Reset All Search
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocalHelpPage;
