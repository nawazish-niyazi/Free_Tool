import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, MapPin, Briefcase, Phone, User, Star, ShieldCheck, Clock, MessageSquare, Send, ChevronRight, Lock, Loader2, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ProcessingOverlay from '../components/ProcessingOverlay';

const LOCATIONS = ["Smriti Nagar", "Nehru Nagar", "Kohka", "Supela", "Durg"];

const parseExperience = (expStr) => {
    if (!expStr) return [];

    // Fallback for old simple strings
    if (!expStr.includes('(')) {
        return [{
            skill: 'Overall Experience',
            years: expStr.toLowerCase().includes('year') ? expStr : `${expStr} Years`,
            price: null
        }];
    }

    const parts = expStr.split(/, |,/);
    return parts.map(part => {
        const lastParenIndex = part.lastIndexOf('(');
        if (lastParenIndex !== -1 && part.endsWith(')')) {
            const skill = part.substring(0, lastParenIndex).trim();
            const detail = part.substring(lastParenIndex + 1, part.length - 1).trim();

            // Check if detail is actually experience info (contains digits or "year")
            const hasDigits = /\d/.test(detail);
            const hasYear = detail.toLowerCase().includes('year');
            const hasPrice = detail.includes('₹') || detail.includes('@');

            if (hasDigits || hasYear || hasPrice) {
                let years = detail;
                let price = null;
                if (detail.includes('@ ₹')) {
                    const subParts = detail.split('@ ₹');
                    years = subParts[0].trim() || 'N/A';
                    price = subParts[1].trim();
                } else if (detail.includes('@')) {
                    const subParts = detail.split('@');
                    years = subParts[0].trim() || 'N/A';
                    price = subParts[1].trim();
                }

                if (years !== 'N/A' && !years.toLowerCase().includes('year') && /\d/.test(years)) {
                    years += ' Years';
                }
                return { skill, years, price };
            } else {
                // If it's extra info like (Artist), include it in the skill name
                return { skill: `${skill} (${detail})`, years: 'N/A', price: null };
            }
        }
        return { skill: part.trim(), years: 'N/A', price: null };
    });
};

const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <strong key={i} className="text-blue-700 font-black">{part}</strong>
                    : part
            )}
        </span>
    );
};

const LocalHelpPage = () => {
    const { user: authUser, isLoggedIn, setShowAuthModal } = useAuth();
    const navigate = useNavigate();

    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [newReview, setNewReview] = useState({ workerId: null, rating: 5, comment: '' });
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [submittedReviews, setSubmittedReviews] = useState({}); // Tracking success messages per workerId
    const [initialLoad, setInitialLoad] = useState(true);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
    const shouldLoadOnNextFetch = useRef(false);

    const tooltips = {
        location: "Select your neighborhood to find the nearest professionals.",
        category: "Choose a service category to see available specialties.",
        service: "Pick the exact service you need from this list."
    };

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/local-help/categories');
                if (res.data.success) {
                    setCategories(res.data.data);
                    const services = [...new Set(res.data.data.flatMap(cat => cat.services))].sort();
                    setAllServices(services);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const fetchWorkers = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const params = {};
            if (selectedLocation) params.location = selectedLocation.toLowerCase();
            if (selectedCategory) params.category = selectedCategory;
            if (selectedService) params.service = selectedService;
            if (appliedSearchQuery) params.search = appliedSearchQuery;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;

            const res = await api.get('/local-help/professionals', { params });
            if (res.data.success) {
                let sortedData = [...res.data.data];

                if (appliedSearchQuery) {
                    const query = appliedSearchQuery.toLowerCase();
                    sortedData.sort((a, b) => {
                        // Priority 1: Exact match in services
                        const aExactService = a.services?.some(s => s.toLowerCase() === query) || (a.service?.toLowerCase() === query);
                        const bExactService = b.services?.some(s => s.toLowerCase() === query) || (b.service?.toLowerCase() === query);

                        if (aExactService && !bExactService) return -1;
                        if (!aExactService && bExactService) return 1;

                        // Priority 2: Name starts with query
                        const aNameStart = a.name?.toLowerCase().startsWith(query);
                        const bNameStart = b.name?.toLowerCase().startsWith(query);

                        if (aNameStart && !bNameStart) return -1;
                        if (!aNameStart && bNameStart) return 1;

                        // Priority 3: Skill contains query
                        const aHasSkill = a.services?.some(s => s.toLowerCase().includes(query)) || a.service?.toLowerCase().includes(query) || a.experience?.toLowerCase().includes(query);
                        const bHasSkill = b.services?.some(s => s.toLowerCase().includes(query)) || b.service?.toLowerCase().includes(query) || b.experience?.toLowerCase().includes(query);

                        if (aHasSkill && !bHasSkill) return -1;
                        if (!aHasSkill && bHasSkill) return 1;

                        return 0;
                    });
                }

                setWorkers(sortedData);
                if (appliedSearchQuery) setHasSearched(true);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [selectedLocation, selectedCategory, selectedService, appliedSearchQuery, minPrice, maxPrice]);

    // Single source of truth for fetching workers
    useEffect(() => {
        if (isLoggedIn) {
            if (initialLoad) {
                fetchWorkers(true); // Show loading on initial load
                setInitialLoad(false);
            } else {
                fetchWorkers(shouldLoadOnNextFetch.current); // Use ref to decide loading state
                shouldLoadOnNextFetch.current = false; // Reset after usage
            }
        }
    }, [fetchWorkers, isLoggedIn, initialLoad]);

    const handleSearch = () => {
        shouldLoadOnNextFetch.current = true;
        setAppliedSearchQuery(searchQuery);
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
        shouldLoadOnNextFetch.current = true;
        setAppliedSearchQuery(suggestion);
        setShowSuggestions(false);
        setHasSearched(true);
    };

    useEffect(() => {
        if (searchQuery.length > 0) {
            const filtered = allServices.filter(s =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 8); // Limit to 8 suggestions
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery, allServices]);

    const handleAddReview = async (workerId) => {
        const comment = newReview.workerId === workerId ? newReview.comment : '';
        const rating = newReview.workerId === workerId ? newReview.rating : 5;

        if (!comment.trim()) return;

        try {
            const res = await api.post(`/local-help/review/${workerId}`, {
                rating: rating,
                comment: comment
            });

            if (res.data.success) {
                // Show success message for 3 seconds
                setSubmittedReviews(prev => ({ ...prev, [workerId]: true }));
                setTimeout(() => {
                    setSubmittedReviews(prev => ({ ...prev, [workerId]: false }));
                }, 3000);

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
            await api.post('/local-help/seed');
            await fetchWorkers(false); // Fetch without additional loading since we're already showing it
            alert("Data seeded successfully!");
        } catch (err) {
            console.error('Seed error:', err);
            alert('Seed failed');
        } finally {
            setLoading(false);
        }
    };

    // Update derived services when category changes
    const availableServices = categories.find(c => c.name === selectedCategory)?.services || [];

    // Removed redundant useEffect since the new one handles everything

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
                    <h1 className="text-3xl md:text-4xl font-semibold md:font-bold text-slate-800 mb-3">
                        Local Help Line
                    </h1>
                    <p className="text-slate-600">
                        Find verified professionals in your neighborhood
                    </p>
                </div>

                {/* Enhanced Search & Filter Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 mb-8">
                    <div className="flex flex-col gap-4">
                        {/* Main Search Bar */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search singer, painter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 md:pl-12 pr-28 md:pr-32 py-3.5 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold text-base md:text-lg text-slate-800 placeholder:text-slate-400"
                            />

                            {/* Autocomplete Suggestions */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                                    >
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="w-full px-5 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors group"
                                            >
                                                <Search size={16} className="text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-slate-700 font-medium group-hover:text-blue-600">{suggestion}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 md:px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70 text-sm md:text-base"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Search"}
                            </button>
                        </div>

                        {/* Filter Toggle */}
                        <div className="flex justify-between items-center px-1">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 text-sm font-bold transition-colors ${showFilters ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Filter size={16} />
                                {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
                            </button>
                            {(selectedLocation || selectedCategory || selectedService || minPrice || maxPrice) && (
                                <button
                                    onClick={() => {
                                        setSelectedLocation('');
                                        setSelectedCategory('');
                                        setSelectedService('');
                                        setSearchQuery('');
                                        setAppliedSearchQuery('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setHasSearched(false);
                                    }}
                                    className="text-xs font-bold text-red-500 hover:underline"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Collapsible Filters */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-6 border-t border-slate-100 mt-2 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Location Filter */}
                                            <div className="flex flex-col relative">
                                                <label className="text-xs font-bold text-slate-500 mb-1 ml-1">Location</label>
                                                <AnimatePresence>
                                                    {activeTooltip === 'location' && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            className="absolute -top-12 left-0 bg-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 z-20 pointer-events-none whitespace-nowrap"
                                                        >
                                                            <Sparkles size={12} className="text-blue-100" />
                                                            <span className="font-medium">{tooltips.location}</span>
                                                            <div className="absolute -bottom-1 left-4 w-2.5 h-2.5 bg-blue-600 rotate-45"></div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <select
                                                    value={selectedLocation}
                                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                                    onFocus={() => setActiveTooltip('location')}
                                                    onBlur={() => setActiveTooltip(null)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                                >
                                                    <option value="">All Locations</option>
                                                    {LOCATIONS.map(loc => (
                                                        <option key={loc} value={loc.toLowerCase()}>{loc}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Category Filter */}
                                            <div className="flex flex-col relative">
                                                <label className="text-xs font-bold text-slate-500 mb-1 ml-1">Category</label>
                                                <AnimatePresence>
                                                    {activeTooltip === 'category' && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            className="absolute -top-12 left-0 bg-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 z-20 pointer-events-none whitespace-nowrap"
                                                        >
                                                            <Sparkles size={12} className="text-blue-100" />
                                                            <span className="font-medium">{tooltips.category}</span>
                                                            <div className="absolute -bottom-1 left-4 w-2.5 h-2.5 bg-blue-600 rotate-45"></div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <select
                                                    value={selectedCategory}
                                                    onChange={(e) => {
                                                        setSelectedCategory(e.target.value);
                                                        setSelectedService('');
                                                    }}
                                                    onFocus={() => setActiveTooltip('category')}
                                                    onBlur={() => setActiveTooltip(null)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                                >
                                                    <option value="">All Categories</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Service Type Filter */}
                                            <div className="flex flex-col relative">
                                                <label className="text-xs font-bold text-slate-500 mb-1 ml-1">Service Type</label>
                                                <AnimatePresence>
                                                    {activeTooltip === 'service' && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            className="absolute -top-12 left-0 bg-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 z-20 pointer-events-none whitespace-nowrap"
                                                        >
                                                            <Sparkles size={12} className="text-blue-100" />
                                                            <span className="font-medium">{tooltips.service}</span>
                                                            <div className="absolute -bottom-1 left-4 w-2.5 h-2.5 bg-blue-600 rotate-45"></div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <select
                                                    value={selectedService}
                                                    onChange={(e) => setSelectedService(e.target.value)}
                                                    disabled={!selectedCategory}
                                                    onFocus={() => setActiveTooltip('service')}
                                                    onBlur={() => setActiveTooltip(null)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">
                                                        {selectedCategory ? `All ${selectedCategory}` : "First Select Category"}
                                                    </option>
                                                    {availableServices.map(svc => (
                                                        <option key={svc} value={svc}>{svc}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Price Range Filter */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-xs font-bold text-slate-500 mb-1 ml-1">Min Price (₹)</label>
                                                <input
                                                    type="number"
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value)}
                                                    placeholder="Min price"
                                                    min="0"
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-xs font-bold text-slate-500 mb-1 ml-1">Max Price (₹)</label>
                                                <input
                                                    type="number"
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value)}
                                                    placeholder="Max price"
                                                    min="0"
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 md:px-2">
                                <h3 className="text-lg md:text-xl font-bold text-slate-800">
                                    {workers.length} Professionals Found
                                </h3>

                                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Near:</span>
                                    <button
                                        onClick={() => setSelectedLocation('')}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all shrink-0 ${!selectedLocation ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'}`}
                                    >
                                        All
                                    </button>
                                    {LOCATIONS.map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() => setSelectedLocation(loc.toLowerCase())}
                                            className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all shrink-0 ${selectedLocation === loc.toLowerCase() ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'}`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {workers.map(worker => (
                                <div key={worker._id} className="bg-white rounded-2xl p-3 md:p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                                    <div className="flex flex-col md:flex-row gap-4 md:gap-8">

                                        {/* HEADER ROW: Avatar + Name (Utilizes space next to icon) */}
                                        <div className="flex flex-row md:flex-col gap-3 md:gap-4 items-start md:items-center md:w-32 shrink-0">
                                            {/* Avatar */}
                                            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl md:rounded-3xl flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                                <User size={30} className="md:size-12" />
                                            </div>

                                            {/* Name & Basic Info - NEXT TO ICON on Mobile, BELOW on Laptop */}
                                            <div className="flex-1 md:hidden">
                                                <div className="flex items-center gap-2 mb-1.5 pt-1">
                                                    <h4 className="text-xl font-bold text-slate-900 leading-tight">
                                                        {highlightText(worker.name, appliedSearchQuery)}
                                                    </h4>
                                                    <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-100 uppercase">
                                                        <ShieldCheck size={12} className="fill-current" /> Verified
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 line-clamp-1">
                                                        <Briefcase size={12} className="text-slate-400" />
                                                        {(() => {
                                                            let services = worker.services && worker.services.length > 0 ? [...worker.services] : [worker.service];
                                                            return services.join(', ');
                                                        })()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                                        <MapPin size={12} className="text-slate-400" />
                                                        {(worker.locations || [worker.location])[0]}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MAIN CONTENT: Stats & Pricing (Full width below header on mobile) */}
                                        <div className="flex-1 min-w-0">
                                            {/* Desktop Header */}
                                            <div className="hidden md:block mb-5">
                                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                                    <h4 className="text-2xl font-bold text-slate-900 leading-tight">
                                                        {highlightText(worker.name, appliedSearchQuery)}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100 uppercase tracking-wider">
                                                        <ShieldCheck size={14} className="fill-current" /> Verified Professional
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-5 text-sm text-slate-600">
                                                    <span className="flex items-center gap-2 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                        <Briefcase size={18} className="text-slate-400" />
                                                        {(() => {
                                                            let services = worker.services && worker.services.length > 0 ? [...worker.services] : [worker.service];
                                                            return highlightText(services.join(', '), appliedSearchQuery);
                                                        })()}
                                                    </span>
                                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                        <MapPin size={18} className="text-slate-400" />
                                                        <div className="flex items-center gap-2">
                                                            {(() => {
                                                                const locs = worker.locations || [worker.location];
                                                                const primaryLoc = locs[0];
                                                                return <span className="font-semibold text-slate-900">{primaryLoc}</span>;
                                                            })()}
                                                        </div>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Better Experience Display */}
                                            <div className="mt-3 md:mt-5 mb-3 md:mb-5">
                                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                                    <div className="w-0.5 h-3 md:w-1 md:h-4 bg-blue-600 rounded-full"></div>
                                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
                                                    {(() => {
                                                        let exps = parseExperience(worker.experience);
                                                        // Show all experience entries from the string

                                                        if (appliedSearchQuery) {
                                                            const query = appliedSearchQuery.toLowerCase();
                                                            exps.sort((a, b) => {
                                                                const aMatch = a.skill.toLowerCase().includes(query);
                                                                const bMatch = b.skill.toLowerCase().includes(query);
                                                                if (aMatch && !bMatch) return -1;
                                                                if (!aMatch && bMatch) return 1;
                                                                return 0;
                                                            });
                                                        }
                                                        return exps.map((exp, i) => (
                                                            <div key={i} className={`flex flex-col min-w-0 p-2.5 md:p-3 border rounded-xl hover:border-blue-100 hover:bg-white transition-all group ${appliedSearchQuery && exp.skill.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                                                                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight mb-1 md:mb-1.5 transition-colors line-clamp-1 ${appliedSearchQuery && exp.skill.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-500'}`}>
                                                                    {highlightText(exp.skill, appliedSearchQuery)}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                                    {exp.years !== 'N/A' && (
                                                                        <>
                                                                            <Clock size={10} className={`md:size-3 ${appliedSearchQuery && exp.skill.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ? "text-blue-400" : "text-slate-300 group-hover:text-blue-400"}`} />
                                                                            <span className={`text-xs md:text-sm font-bold tracking-tight ${appliedSearchQuery && exp.skill.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ? 'text-blue-900' : 'text-slate-800'}`}>
                                                                                {exp.years}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {exp.price && (
                                                                        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5">
                                                                            ₹{exp.price}
                                                                        </span>
                                                                    )}
                                                                    {exp.years === 'N/A' && !exp.price && (
                                                                        <span className="text-[10px] font-medium text-slate-400">Professional</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Price Range Section - Prominent Display */}
                                            {(worker.priceRange && (worker.priceRange.minPrice > 0 || worker.priceRange.maxPrice > 0)) && (() => {
                                                const matchedExp = appliedSearchQuery ? parseExperience(worker.experience).find(e => e.skill.toLowerCase().includes(appliedSearchQuery.toLowerCase())) : null;
                                                const hasMatch = !!(matchedExp && matchedExp.price);
                                                const displayPrice = hasMatch ? matchedExp.price : worker.priceRange.minPrice;

                                                return (
                                                    <div className={`mt-3 mb-3 inline-flex items-center gap-2 md:gap-3 border rounded-xl px-3 py-2 md:px-4 md:py-2.5 shadow-sm transition-all ${hasMatch ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                                                        <div className={`${hasMatch ? 'bg-blue-600' : 'bg-green-50'} p-1.5 md:p-2 rounded-lg border ${hasMatch ? 'border-blue-400' : 'border-green-100'}`}>
                                                            <span className={`${hasMatch ? 'text-white' : 'text-green-600'} font-bold text-base md:text-lg leading-none`}>₹</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${hasMatch ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                {hasMatch ? `Price for ${matchedExp.skill}` : 'Service Range'}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`font-bold text-sm md:text-base ${hasMatch ? 'text-blue-900' : 'text-slate-900'}`}>
                                                                    ₹{Number(displayPrice).toLocaleString()}
                                                                </span>
                                                                {!hasMatch && (
                                                                    <>
                                                                        <span className="text-slate-300 font-bold">-</span>
                                                                        {worker.priceRange.maxPrice > 0 ? (
                                                                            <span className="text-slate-900 font-bold text-sm md:text-base">
                                                                                ₹{worker.priceRange.maxPrice.toLocaleString()}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-500 font-bold text-xs md:text-sm italic">
                                                                                Depends upon work
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {hasMatch && (
                                                                    <span className="text-blue-500/60 font-bold text-[10px] md:text-xs">
                                                                        • Minimum Payout
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {worker.description && (
                                                <p className="text-sm text-slate-500 mt-3 line-clamp-2 italic">
                                                    "{worker.description}"
                                                </p>
                                            )}
                                        </div>

                                        {/* CALL BUTTON - Bottom on Mobile, Right on Desktop */}
                                        <div className="flex flex-col justify-end shrink-0">
                                            <a
                                                href={`tel:${worker.number}`}
                                                className="w-full md:w-auto h-auto md:h-14 py-3.5 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-100 hover:shadow-green-200 transition-all hover:scale-[1.02] active:scale-95 no-underline"
                                            >
                                                <div className="bg-green-500/30 p-1.5 rounded-lg">
                                                    <Phone size={18} className="md:size-5" />
                                                </div>
                                                <span className="text-base md:text-lg">Call Now</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Review Section */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        {submittedReviews[worker._id] ? (
                                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                                                    <Sparkles size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-green-700 font-black text-sm uppercase tracking-tight">Thank you for your review</p>
                                                    <p className="text-green-600 text-xs font-bold">Submitted successfully.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Sparkles size={14} className="text-blue-500" />
                                                    Experience Quality? Rate This Professional
                                                </h5>

                                                {/* Simple Review Input */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Write a review..."
                                                            value={newReview.workerId === worker._id ? newReview.comment : ''}
                                                            onChange={(e) => setNewReview({ ...newReview, workerId: worker._id, comment: e.target.value })}
                                                            className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => handleAddReview(worker._id)}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        >
                                                            <Send size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-center sm:justify-start gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setNewReview({ ...newReview, workerId: worker._id, rating: star })}
                                                                className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all"
                                                            >
                                                                <Star
                                                                    size={18}
                                                                    className={(newReview.workerId === worker._id ? newReview.rating : 5) >= star ? "text-amber-400 fill-current" : "text-slate-300"}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No Professionals Found</h3>
                            <p className="text-slate-500 mb-6">Try changing your location or category filters.</p>
                            <button
                                onClick={() => {
                                    setSelectedLocation('');
                                    setSelectedCategory('');
                                    setSelectedService('');
                                    setSearchQuery('');
                                    setAppliedSearchQuery('');
                                    setMinPrice('');
                                    setMaxPrice('');
                                    setHasSearched(false);
                                }}
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
