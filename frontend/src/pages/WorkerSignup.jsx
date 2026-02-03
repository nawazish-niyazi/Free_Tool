import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, MapPin, Briefcase, Phone, User, Award, CheckCircle, AlertCircle, MessageSquare, Mail, Lock } from 'lucide-react';
import api from '../api/axios';
import ProcessingOverlay from '../components/ProcessingOverlay';
import { motion, AnimatePresence } from 'framer-motion';

const WorkerSignup = () => {
    const { isLoggedIn, user, secureLogin } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        locations: [],
        services: [],
        experience: '',
        description: '',
        minPrice: '',
        maxPrice: '',
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Skills/Services State
    const [serviceInput, setServiceInput] = useState('');
    const [categories, setCategories] = useState([]); // Raw categories data
    const [availableServices, setAvailableServices] = useState([]); // All possible services from backend
    const [filteredServices, setFilteredServices] = useState([]); // Search results
    const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const optionsRef = React.useRef(null);

    // Dropdown Helpers
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedServiceDropdown, setSelectedServiceDropdown] = useState('');
    const [skillExperiences, setSkillExperiences] = useState({});
    const [skillPrices, setSkillPrices] = useState({});

    // Placeholder Animation State
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const placeholders = [
        "Practical Writer",
        "Singer",
        "AC Repair",
        "Electrician",
        "Painter",
        "Cook",
        "Tutor",
        "Plumber"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 2000); // Rotate every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const predefinedLocations = ['Smriti Nagar', 'Nehru Nagar', 'Kohka', 'Supela', 'Durg'];

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/local-help/categories');
                if (res.data.success) {
                    setCategories(res.data.data); // Store raw category data
                    // Flatten all services from all categories into one unique list
                    const allServices = res.data.data.flatMap(cat => cat.services);
                    const uniqueServices = [...new Set(allServices)].sort();
                    setAvailableServices(uniqueServices);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Filter services based on input
    React.useEffect(() => {
        if (serviceInput.trim()) {
            const filtered = availableServices.filter(s =>
                s.toLowerCase().includes(serviceInput.toLowerCase()) &&
                !formData.services.includes(s)
            );
            setFilteredServices(filtered);
            setShowServiceSuggestions(true);
            setActiveIndex(-1);
        } else {
            setFilteredServices([]);
            setShowServiceSuggestions(false);
            setActiveIndex(-1);
        }
    }, [serviceInput, availableServices, formData.services]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    // Toggle Location Selection
    const toggleLocation = (loc) => {
        setFormData(prev => {
            const current = prev.locations;
            if (current.includes(loc)) {
                return { ...prev, locations: current.filter(l => l !== loc) };
            } else {
                return { ...prev, locations: [...current, loc] };
            }
        });
    };

    // Add Service/Skill
    const addService = (service) => {
        if (!formData.services.includes(service)) {
            setFormData(prev => ({
                ...prev,
                services: [...prev.services, service]
            }));
            // Initialize experience and price for the new service
            setSkillExperiences(prev => ({
                ...prev,
                [service]: ''
            }));
            setSkillPrices(prev => ({
                ...prev,
                [service]: ''
            }));
        }
        setServiceInput('');
        setShowServiceSuggestions(false);
    };

    // Custom Service Add (if not in list)
    const handleServiceKeyDown = (e) => {
        const canNavigateToCustom = filteredServices.length === 0 && serviceInput.trim() !== '';
        const maxIndex = filteredServices.length > 0 ? filteredServices.length - 1 : (canNavigateToCustom ? 0 : -1);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < maxIndex ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > -1 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredServices.length) {
                addService(filteredServices[activeIndex]);
            } else if (canNavigateToCustom && activeIndex === 0) {
                addService(serviceInput.trim());
            } else if (serviceInput.trim()) {
                addService(serviceInput.trim());
            }
        } else if (e.key === 'Escape') {
            setShowServiceSuggestions(false);
        }
    };

    // Auto scroll to active index
    useEffect(() => {
        if (activeIndex >= 0 && optionsRef.current) {
            const activeElement = optionsRef.current.children[activeIndex];
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [activeIndex]);

    // Remove Service/Skill
    const removeService = (service) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter(s => s !== service)
        }));
        setSkillExperiences(prev => {
            const newState = { ...prev };
            delete newState[service];
            return newState;
        });
        setSkillPrices(prev => {
            const newState = { ...prev };
            delete newState[service];
            return newState;
        });
    };

    const handleSkillExperienceChange = (skill, value) => {
        setSkillExperiences(prev => ({
            ...prev,
            [skill]: value
        }));
    };

    const handleSkillPriceChange = (skill, value) => {
        setSkillPrices(prev => ({
            ...prev,
            [skill]: value
        }));
    };

    // Auto-sync minPrice with the lowest skill price
    useEffect(() => {
        const prices = Object.values(skillPrices)
            .filter(p => p && String(p).trim() !== '')
            .map(p => parseFloat(p))
            .filter(p => !isNaN(p));

        if (prices.length > 0) {
            const min = Math.min(...prices);
            // Only auto-update if minPrice is empty or already in sync with one of the skill prices
            setFormData(prev => {
                const currentMin = parseFloat(prev.minPrice);
                if (!prev.minPrice || isNaN(currentMin) || prices.includes(currentMin)) {
                    return { ...prev, minPrice: min.toString() };
                }
                return prev;
            });
        }
    }, [skillPrices]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        // Validation
        const hasIndividualPrices = Object.values(skillPrices).some(p => p && p.trim() !== '');

        if (!formData.name || !formData.number || formData.locations.length === 0 ||
            formData.services.length === 0 ||
            (!formData.minPrice && !hasIndividualPrices)) {
            setError('Please fill all required fields. Select at least one location and one skill.');
            setLoading(false);
            return;
        }

        // Price validation
        if (parseInt(formData.minPrice) < 0) {
            setError('Minimum price cannot be negative');
            setLoading(false);
            return;
        }

        if (formData.maxPrice && parseInt(formData.maxPrice) < 0) {
            setError('Maximum price cannot be negative');
            setLoading(false);
            return;
        }

        if (formData.maxPrice && parseInt(formData.minPrice) > parseInt(formData.maxPrice)) {
            setError('Minimum price cannot be greater than maximum price');
            setLoading(false);
            return;
        }

        // Phone number validation (basic)
        const phoneRegex = /^[+]?[\d\s-]{10,}$/;
        if (!phoneRegex.test(formData.number)) {
            setError('Please enter a valid phone number');
            setLoading(false);
            return;
        }

        if (!isLoggedIn && !formData.password) {
            setError('Password is required for account creation');
            setLoading(false);
            return;
        }

        try {
            // Consolidate experiences and prices
            const consolidatedExperience = formData.services.map(s => {
                const exp = skillExperiences[s];
                const price = skillPrices[s];
                let info = s;
                if (exp && price) info = `${s} (${exp} @ ₹${price})`;
                else if (exp) info = `${s} (${exp})`;
                else if (price) info = `${s} (@ ₹${price})`;
                return info;
            }).join(', ');

            const dataToSubmit = {
                ...formData,
                experience: consolidatedExperience, // Send consolidated string
                maxPrice: formData.maxPrice ? formData.maxPrice : 0,
                userId: isLoggedIn ? user.id : undefined
            };

            const response = await api.post('/local-help/worker-signup', dataToSubmit);

            if (response.data.success) {
                // If token returned (new account creation), log them in
                if (response.data.token && response.data.user) {
                    secureLogin(response.data.token, response.data.user, response.data.data);
                }

                // Redirect to landing page immediately
                navigate('/');
            }
        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-3 rounded-xl">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Professional Registration</h1>
                            <p className="text-gray-600 mt-1">Join our network and get hired locally</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-12">
                {success ? (
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 text-center">
                        <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Your profile is now live. Good luck!
                        </p>
                        <button
                            onClick={() => setSuccess(false)}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Submit Another Application
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 md:px-6 py-3 md:py-4 rounded-xl mb-6 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            {!isLoggedIn && (
                                <>
                                    {/* Email (Optional) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Lock className="w-4 h-4 inline mr-2" />
                                            Set Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a secure password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                        <p className="text-xs text-slate-500 mt-1 ml-1">You will use this to log in to your account.</p>
                                    </div>
                                </>
                            )}

                            <hr className="border-gray-100" />

                            {/* Multi-Location Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    Locations *
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {predefinedLocations.map(loc => (
                                        <button
                                            key={loc}
                                            type="button"
                                            onClick={() => toggleLocation(loc)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${formData.locations.includes(loc)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                        >
                                            {loc}
                                            {formData.locations.includes(loc) && <span className="ml-2 text-xs">✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 ml-1">Select all areas where you are available to work.</p>
                            </div>

                            {/* Skills / Services Search & Tags */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4 inline mr-2" />
                                    Your Skills / Professions *
                                </label>

                                {/* Selected Skills List with Experience Inputs */}
                                <div className="space-y-3 mb-4">
                                    {formData.services.map(skill => (
                                        <div key={skill} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-gray-700">{skill}</span>
                                            </div>

                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Exp (e.g. 5 Years)"
                                                    value={skillExperiences[skill] || ''}
                                                    onChange={(e) => handleSkillExperienceChange(skill, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="relative w-full">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Min Payout"
                                                        value={skillPrices[skill] || ''}
                                                        onChange={(e) => handleSkillPriceChange(skill, e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeService(skill)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <span className="sr-only">Remove</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Search Input with Animated Placeholder */}
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={serviceInput}
                                        onChange={(e) => setServiceInput(e.target.value)}
                                        onKeyDown={handleServiceKeyDown}
                                        className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-transparent relative z-10"
                                    />

                                    {/* Animated Placeholder Overlay */}
                                    {!serviceInput && (
                                        <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none z-0 overflow-hidden w-[calc(100%-2rem)]">
                                            <span className="text-gray-400 mr-1 whitespace-nowrap">Search or add skills: </span>
                                            <div className="relative h-6 flex-1 overflow-hidden">
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={placeholderIndex}
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -20, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="absolute left-0 text-gray-400 font-medium truncate w-full"
                                                    >
                                                        {placeholders[placeholderIndex]}
                                                    </motion.div>
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestions Dropdown */}
                                    {showServiceSuggestions && (
                                        <div
                                            ref={optionsRef}
                                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto custom-scrollbar"
                                        >
                                            {filteredServices.length > 0 ? (
                                                filteredServices.map((service, index) => (
                                                    <button
                                                        key={service}
                                                        type="button"
                                                        onClick={() => addService(service)}
                                                        className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 transition-colors ${index === activeIndex
                                                            ? 'bg-blue-600 text-white font-bold'
                                                            : 'text-gray-700 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {service}
                                                    </button>
                                                ))
                                            ) : (
                                                <div
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${activeIndex === 0
                                                        ? 'bg-blue-600 text-white font-bold'
                                                        : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                    onClick={() => addService(serviceInput.trim())}
                                                >
                                                    Add "{serviceInput}" as a new skill
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 ml-1">Type to search existing professions or press Enter to add a new one.</p>

                                {/* Helper: Select from Categories */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 block">Or select from categories:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Category Dropdown */}
                                        <div className="relative">
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => {
                                                    setSelectedCategory(e.target.value);
                                                    setSelectedServiceDropdown('');
                                                }}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>

                                        {/* Service Dropdown */}
                                        <div className="relative">
                                            <select
                                                value={selectedServiceDropdown}
                                                onChange={(e) => {
                                                    const svc = e.target.value;
                                                    setSelectedServiceDropdown(svc);
                                                    if (svc) addService(svc);
                                                }}
                                                disabled={!selectedCategory}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">
                                                    {selectedCategory ? 'Select Professional Skill' : 'Select Category First'}
                                                </option>
                                                {selectedCategory && categories.find(c => c.name === selectedCategory)?.services.map(svc => (
                                                    <option key={svc} value={svc}>{svc}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />



                            {/* Price Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Minimum Price */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Minimum Price (₹) {Object.values(skillPrices).some(p => p && p.trim() !== '') ? '(Optional)' : '*'}
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        name="minPrice"
                                        value={formData.minPrice}
                                        onChange={handleChange}
                                        placeholder={Object.values(skillPrices).some(p => p && String(p).trim() !== '') ? "Calculated from skills" : "e.g., 500"}
                                        min="0"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        required={!Object.values(skillPrices).some(p => p && String(p).trim() !== '')}
                                    />
                                </div>

                                {/* Maximum Price */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Maximum Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        value={formData.maxPrice}
                                        onChange={handleChange}
                                        placeholder="Depends upon work"
                                        min="0"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <MessageSquare className="w-4 h-4 inline mr-2" />
                                    Describe your work
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Tell users about your services, skills, or any other details..."
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
            <ProcessingOverlay
                isOpen={loading}
                message="Creating Account..."
                submessage="Registering your profile in our local directory"
            />
        </div>
    );
};

export default WorkerSignup;
