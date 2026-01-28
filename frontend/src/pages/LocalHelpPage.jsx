import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, MapPin, Briefcase, Phone, User, Star, ShieldCheck, Clock, MessageSquare, Send, ChevronRight, Lock, Loader2, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ProcessingOverlay from '../components/ProcessingOverlay';

const CATEGORIES = [
    {
        name: "House Needs",
        services: ["Electrician", "Plumber", "Carpenter", "Carpenter with Supplies", "Painter", "House Help", "Gardener", "Water Supply", "Lock and Key", "AC Repair", "RO Repair", "Garbage Collector"]
    },
    {
        name: "Construction",
        services: ["Reja", "Mistri", "Contractor", "Construction Worker", "Tiles Mistri", "Centering Worker"]
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
        services: ["Catering", "Tent", "Catering + Tent"]
    },
    {
        name: "Miscellaneous",
        services: ["Transgender Help", "Donation & Recycling"]
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

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/local-help/professionals`, { params });
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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/local-help/review/${workerId}`, {
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
            await axios.post(`${import.meta.env.VITE_API_URL}/local-help/seed`);
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
                <div className="flex-1 flex items-center justify-center p-3 md:p-6">
                    <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-center shadow-xl shadow-blue-900/5 border border-gray-100">
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
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-8">
                {/* Simplified Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                        Local Help Line
                    </h1>
                    <p className="text-slate-600">
                        Find verified professionals in your neighborhood
                    </p>
                </div>

                {/* Simplified Search Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-slate-700 mb-1">Select Location</label>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                            >
                                <option value="">All Locations</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc.toLowerCase()}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-slate-700 mb-1">Select Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setSelectedService('');
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-slate-700 mb-1">Service Type</label>
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                disabled={!selectedCategory}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">{selectedCategory ? `All ${selectedCategory}` : "First Select Category"}</option>
                                {availableServices.map(svc => (
                                    <option key={svc} value={svc}>{svc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 text-lg disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                <Search size={22} /> Find Professionals
                            </>
                        )}
                    </button>

                    {/* Developer Tool - Subtle */}
                    <div className="mt-2 text-right">
                        <button
                            onClick={seedData}
                            className="text-xs text-slate-400 hover:text-blue-500 underline"
                        >
                            Reset Demo Data
                        </button>
                    </div>
                </div>

                {/* Results List */}
                <div>
                    {loading && workers.length === 0 ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Searching for help nearby...</p>
                        </div>
                    ) : workers.length > 0 ? (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-800 px-2">
                                {workers.length} Professionals Found
                            </h3>
                            {workers.map(worker => (
                                <div key={worker._id} className="bg-white rounded-xl p-4 md:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        {/* Avatar & Basic Info */}
                                        <div className="flex sm:flex-col items-center sm:w-32 shrink-0 gap-4 sm:gap-2">
                                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <User size={32} className="sm:w-10 sm:h-10" />
                                            </div>
                                            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-sm font-bold border border-amber-100">
                                                <Star size={14} className="fill-current" /> {worker.rating}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                                <div>
                                                    <h4 className="text-xl font-bold text-slate-900 mb-1">{worker.name}</h4>
                                                    <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase size={14} className="text-slate-400" />
                                                            {worker.service}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={14} className="text-slate-400" />
                                                            {worker.location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} className="text-slate-400" />
                                                            {worker.experience} Exp.
                                                        </span>
                                                    </div>
                                                </div>

                                                <a
                                                    href={`tel:${worker.number}`}
                                                    className="w-full md:w-auto py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all no-underline"
                                                >
                                                    <Phone size={18} />
                                                    Call Now
                                                </a>
                                            </div>

                                            {/* Reviews Section - Simplified */}
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                                        <MessageSquare size={16} className="text-blue-500" />
                                                        Recent Reviews
                                                    </h5>
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        {worker.reviews && worker.reviews.length > 0 ? (
                                                            <div className="text-sm text-slate-600">
                                                                <span className="font-bold text-slate-900">{worker.reviews[0].user}: </span>
                                                                "{worker.reviews[0].comment}"
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-400 italic">No reviews yet.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Simple Review Input */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Write a review..."
                                                            value={newReview.workerId === worker._id ? newReview.comment : ''}
                                                            onChange={(e) => setNewReview({ ...newReview, workerId: worker._id, comment: e.target.value })}
                                                            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => handleAddReview(worker._id)}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            <Send size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-0.5 shrink-0">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setNewReview({ ...newReview, workerId: worker._id, rating: star })}
                                                                className="p-1 hover:bg-slate-100 rounded"
                                                            >
                                                                <Star
                                                                    size={16}
                                                                    className={(newReview.workerId === worker._id ? newReview.rating : 5) >= star ? "text-amber-400 fill-current" : "text-slate-300"}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No Professionals Found</h3>
                            <p className="text-slate-500 mb-6">Try changing your location or category filters.</p>
                            <button
                                onClick={() => { setSelectedLocation(''); setSelectedCategory(''); setSelectedService(''); fetchWorkers(); setHasSearched(false); }}
                                className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ProcessingOverlay
                isOpen={loading}
                message="Checking availability..."
            />
        </div>
    );
};

export default LocalHelpPage;
