import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, MapPin, Briefcase, Phone, User, Star, ShieldCheck, Clock, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LocalHelpPage = () => {
    const locations = ["smriti nagar", "Nehru Nagar", "Kohka", "Supela", "durg"];
    const jobs = ["plumber", "electrician", "carpenter", "painter", "mechanic", "cleaning", "gardener", "ac repair"];

    const generateDemoData = () => {
        const locs = ["smriti nagar", "Nehru Nagar", "Kohka", "Supela", "durg"];
        const categories = ["plumber", "electrician", "carpenter", "painter", "mechanic", "cleaning", "gardener", "ac repair"];
        const fNames = ["Amit", "Rahul", "Vijay", "Suresh", "Deepak", "Rajesh", "Mukesh", "Sanjay", "Anil", "Sunil", "Manish", "Pankaj", "Rakesh", "Arjun", "Karan", "Vivek", "Akash", "Vikram", "Sameer", "Rohan", "Nitin", "Piyush", "Gaurav", "Harsh"];
        const lNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Yadav", "Mishra", "Jha", "Choudhary", "Sahni", "Tiwari", "Pandey", "Rathore", "Sahu", "Shrivastav", "Dubey", "Maurya"];

        const reviewerNames = ["Sneha Patel", "Vikram Singh", "Anjali Verma", "Manoj Bajpayee", "Pooja Hegde", "Arjun Mehra", "Neha Gupta", "Rohan Das", "Sunita Rao", "Kunal Kohli", "Varun Dhawan", "Sara Khan", "Pankaj Tiwari", "Radhika Apte", "Ayushmann Khurrana", "Ishita Dutta"];

        const reviewPool = {
            "plumber": [
                "Fixed the kitchen leak perfectly. Very professional and arrived on time.",
                "Expert plumber! He suggested a much better piping route that saved me money.",
                "Reliable and honest. Didn't charge extra for the late-night emergency visit."
            ],
            "electrician": [
                "Found a short circuit in my house that 2 others missed. Highly skilled.",
                "Very neat wiring work. He even labeled all the switches in the new board.",
                "Quick and efficient. Fixed my AC starter issue in less than 20 minutes."
            ],
            "carpenter": [
                "Exceptional craftsmanship. The custom bookshelf he made is the highlight of my room.",
                "Repaired my antique wooden door with great care. Looks brand new now.",
                "Very creative carpenter. He gave me a great idea for a space-saving cabinet."
            ],
            "painter": [
                "World-class finishing! The textured paint in my living room looks amazing.",
                "Very clean worker. They covered all my furniture properly before starting.",
                "Patiently helped me choose the perfect shade for my bedroom. Great results."
            ],
            "mechanic": [
                "Only mechanic I trust with my car. Transparent pricing and great service.",
                "Diagnosed the engine noise quickly. My vehicle is running smoother than ever.",
                "Friendly and knowledgeable. Explained the parts replacement in detail."
            ],
            "cleaning": [
                "Deep cleaning service was incredible. They reached every corner of the house.",
                "Eco-friendly cleaning products used. My house feels fresh and safe for kids.",
                "Punctual team. They transformed my messy kitchen into a sparkling one."
            ],
            "gardener": [
                "Transformed my balcony into a green paradise. High quality plants used.",
                "Excellent knowledge of seasonal flowers. My garden is blooming beautifully.",
                "Regular maintenance is great. He is very dedicated and hard-working."
            ],
            "ac repair": [
                "The cooling is much better now after the servicing. Great technical skill.",
                "Very polite and explained the coolant leak issue clearly. Fixed it quickly.",
                "Professional AC service. They did a thorough check-up of all units."
            ]
        };

        const data = [];
        let idCount = 1;

        locs.forEach(loc => {
            categories.forEach(job => {
                // Generate 3 unique workers for EVERY specific location and service combo
                for (let i = 0; i < 3; i++) {
                    const firstName = fNames[(idCount * 13) % fNames.length];
                    const lastName = lNames[(idCount * 17) % lNames.length];

                    const jobReviews = reviewPool[job] || ["Good service", "Professional work"];

                    data.push({
                        id: idCount,
                        name: `${firstName} ${lastName}`,
                        number: `+91 ${91000 + (idCount * 7)} ${54000 + (idCount * 3)}`,
                        location: loc, // Assigned to a SPECIFIC location
                        job: job,
                        rating: parseFloat((4.2 + (Math.sin(idCount) * 0.7)).toFixed(1)),
                        experience: `${3 + (idCount % 12)} years`,
                        reviews: [
                            {
                                id: 1,
                                user: reviewerNames[(idCount * 7) % reviewerNames.length],
                                rating: 5,
                                comment: jobReviews[idCount % jobReviews.length]
                            },
                            {
                                id: 2,
                                user: reviewerNames[(idCount * 11) % reviewerNames.length],
                                rating: 4,
                                comment: jobReviews[(idCount + 1) % jobReviews.length]
                            }
                        ]
                    });
                    idCount++;
                }
            });
        });
        return data;
    };

    const initialData = generateDemoData();

    const { user: authUser, isLoggedIn, setShowAuthModal } = useAuth();
    const navigate = useNavigate();

    // Load initial data and merge with localStorage
    const [workers, setWorkers] = useState(() => {
        const saved = localStorage.getItem('nair_local_help_v2'); // Incremented version to force update
        if (saved) {
            return JSON.parse(saved);
        }
        return initialData;
    });

    // Save to localStorage whenever workers state changes
    useEffect(() => {
        localStorage.setItem('nair_local_help_v2', JSON.stringify(workers));
    }, [workers]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // State for temporary review input
    const [newReview, setNewReview] = useState({ workerId: null, rating: 5, comment: '' });

    // State for applied filters
    const [activeFilters, setActiveFilters] = useState({ location: '', job: '' });

    const handleSearch = () => {
        setActiveFilters({ location: selectedLocation, job: selectedJob });
        setHasSearched(true);
    };

    const filteredWorkers = workers.filter(item => {
        const locationMatch = activeFilters.location ? item.location === activeFilters.location : true;
        const jobMatch = activeFilters.job ? item.job === activeFilters.job : true;
        return locationMatch && jobMatch;
    });

    const handleAddReview = (workerId) => {
        if (!newReview.comment.trim()) return;

        setWorkers(prevWorkers => prevWorkers.map(worker => {
            if (worker.id === workerId) {
                const updatedReviews = [
                    ...worker.reviews,
                    {
                        id: Date.now(),
                        user: authUser?.name || "Anonymous",
                        rating: newReview.rating,
                        comment: newReview.comment
                    }
                ];
                // Recalculate average rating
                const avgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
                return { ...worker, reviews: updatedReviews, rating: parseFloat(avgRating.toFixed(1)) };
            }
            return worker;
        }));
        setNewReview({ workerId: null, rating: 5, comment: '' });
    };

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
        <div className="min-h-screen bg-gray-50 uppercase-links">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                        <Search className="text-blue-600 w-10 h-10" />
                        Local Help Services
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Find verified, high-quality local professionals in your area.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-600" />
                                Search Filters
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Location</label>
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">All Locations</option>
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Type</label>
                                    <select
                                        value={selectedJob}
                                        onChange={(e) => setSelectedJob(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">All Services</option>
                                        {jobs.map(job => (
                                            <option key={job} value={job}>{job.charAt(0).toUpperCase() + job.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100 mt-4"
                                >
                                    Apply Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {hasSearched ? `Search Results (${filteredWorkers.length})` : 'Find Local Professionals'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {!hasSearched ? (
                                <div className="py-24 text-center bg-white rounded-[3rem] border border-blue-100 shadow-sm">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">Ready to find help?</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        Select a location and service type from the sidebar to see available professionals in your area.
                                    </p>
                                </div>
                            ) : filteredWorkers.length > 0 ? (
                                filteredWorkers.map(person => (
                                    <div key={person.id} className="bg-white rounded-3xl border border-gray-100 hover:shadow-2xl transition-all overflow-hidden">
                                        <div className="p-8">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                                                        <User className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-gray-900 text-2xl mb-1">{person.name}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold uppercase tracking-wider">
                                                                {person.job}
                                                            </span>
                                                            <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-lg">
                                                                <Star className="w-4 h-4 fill-current" />
                                                                {person.rating}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 items-end">
                                                    <div className="text-blue-700 font-black flex items-center gap-2 text-2xl">
                                                        <Phone className="w-6 h-6" />
                                                        {person.number}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                                                        <ShieldCheck className="w-5 h-5" />
                                                        Verified Professional
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 py-6 border-y border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-600 font-medium">
                                                    <div className="p-2 bg-gray-50 rounded-lg"><MapPin className="w-5 h-5" /></div>
                                                    <span className="capitalize">{person.location}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600 font-medium">
                                                    <div className="p-2 bg-gray-50 rounded-lg"><Clock className="w-5 h-5" /></div>
                                                    <span>{person.experience} experience</span>
                                                </div>
                                            </div>

                                            {/* Reviews Section */}
                                            <div className="mt-8">
                                                <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-6">
                                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                                    Customer Reviews ({person.reviews.length})
                                                </h4>

                                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                    {person.reviews.map(review => (
                                                        <div key={review.id} className="bg-gray-50 p-4 rounded-2xl">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-bold text-gray-900 text-sm">{review.user}</span>
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star key={i} size={12} className={i < review.rating ? "text-amber-500 fill-current" : "text-gray-300"} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add Review Form */}
                                                <div className="mt-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 border-dashed">
                                                    <p className="text-sm font-bold text-blue-900 mb-3">Rate & Review this worker</p>
                                                    <div className="flex gap-2 mb-4">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setNewReview({ ...newReview, workerId: person.id, rating: star })}
                                                                className="transition-transform active:scale-90"
                                                            >
                                                                <Star
                                                                    size={24}
                                                                    className={(newReview.workerId === person.id ? newReview.rating : 5) >= star ? "text-amber-500 fill-current" : "text-gray-300"}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="relative">
                                                        <textarea
                                                            placeholder="Share your experience with this professional..."
                                                            value={newReview.workerId === person.id ? newReview.comment : ''}
                                                            onChange={(e) => setNewReview({ ...newReview, workerId: person.id, comment: e.target.value })}
                                                            className="w-full p-4 pr-12 bg-white border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                                            rows="2"
                                                        />
                                                        <button
                                                            onClick={() => handleAddReview(person.id)}
                                                            className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                                    <Search className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-gray-900">No matching professionals</h3>
                                    <p className="text-gray-500 mt-2">Try adjusting your filters or resetting them.</p>
                                    <button
                                        onClick={() => { setSelectedLocation(''); setSelectedJob(''); setHasSearched(false); }}
                                        className="mt-8 px-8 py-3 bg-blue-50 text-blue-600 font-black rounded-2xl hover:bg-blue-100 transition-all"
                                    >
                                        View All Professionals
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocalHelpPage;
