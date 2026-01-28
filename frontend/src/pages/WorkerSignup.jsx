import React, { useState } from 'react';
import { UserPlus, MapPin, Briefcase, Phone, User, Award, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import ProcessingOverlay from '../components/ProcessingOverlay';

const WorkerSignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        location: '',
        category: '',
        service: '',
        experience: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const locations = ['Smriti Nagar', 'Nehru Nagar', 'Kohka', 'Supela', 'Durg'];

    const serviceCategories = [
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

    const selectedCategory = serviceCategories.find(cat => cat.name === formData.category);
    const availableServices = selectedCategory ? selectedCategory.services : [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Reset service when category changes
            ...(name === 'category' && { service: '' })
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        // Validation
        if (!formData.name || !formData.number || !formData.location ||
            !formData.category || !formData.service || !formData.experience) {
            setError('All fields are required');
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

        try {
            const response = await api.post('/local-help/worker-signup', formData);

            if (response.data.success) {
                setSuccess(true);
                setFormData({
                    name: '',
                    number: '',
                    location: '',
                    category: '',
                    service: '',
                    experience: ''
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
                            <h1 className="text-3xl font-bold text-gray-900">Worker Registration</h1>
                            <p className="text-gray-600 mt-1">Join our professional network</p>
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
                            Your profile is now live in the Local Help Line directory. You can now be reached by users in your area.
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
                        {/* Info Banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-6 mb-8">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Important Information
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1 ml-7">
                                <li>• No account creation or password required</li>
                                <li>• Free registration - no charges</li>
                                <li>• Your profile will be visible in the directory immediately</li>
                                <li>• You can be contacted by users directly</li>
                            </ul>
                        </div>

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

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    Location *
                                </label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                    required
                                >
                                    <option value="">Select your location</option>
                                    {locations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4 inline mr-2" />
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {serviceCategories.map(cat => (
                                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Service */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4 inline mr-2" />
                                    Service *
                                </label>
                                <select
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                    required
                                    disabled={!formData.category}
                                >
                                    <option value="">
                                        {formData.category ? 'Select service' : 'First select a category'}
                                    </option>
                                    {availableServices.map(service => (
                                        <option key={service} value={service}>{service}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Award className="w-4 h-4 inline mr-2" />
                                    Years of Experience *
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    placeholder="e.g., 5 years"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
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
                                    'Submit Application'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
            <ProcessingOverlay
                isOpen={loading}
                message="Submitting Application..."
                submessage="Registering your profile in our local directory"
            />
        </div>
    );
};

export default WorkerSignup;
