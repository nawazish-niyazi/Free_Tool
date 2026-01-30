const express = require('express');
const router = express.Router();
const Professional = require('../models/Professional');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// @route   PUT api/local-help/profile/update
// @desc    Update professional profile details
// @access  Private
router.put('/profile/update', protect, async (req, res) => {
    try {
        const { name, number, location, category, service, experience, minPrice, maxPrice, description } = req.body;

        // Find professional profile linked to user
        let professional = await Professional.findOne({ userRef: req.user._id });

        if (!professional) {
            // Try fallback by phone in case self-healing hasn't run yet
            const user = await User.findById(req.user._id);
            if (user && user.phone) {
                professional = await Professional.findOne({ number: user.phone });
            }
        }

        if (!professional) {
            return res.status(404).json({ success: false, message: 'Professional profile not found' });
        }

        // Update fields
        if (name) professional.name = name;
        if (number) professional.number = number;
        if (location) professional.location = location;
        if (category) professional.category = category;
        if (service) professional.service = service;
        if (experience) professional.experience = experience;
        if (description !== undefined) professional.description = description;

        // Update price range
        if (minPrice !== undefined) professional.priceRange.minPrice = Number(minPrice);
        if (maxPrice !== undefined) professional.priceRange.maxPrice = Number(maxPrice);

        // Ensure verified status logic isn't bypassed (e.g. changing sensitive categories might require re-verification in future, currently open)

        const updatedPro = await professional.save();

        res.json({
            success: true,
            data: updatedPro
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET api/local-help/professionals
// @desc    Get all professionals with filters
// @access  Private
router.get('/professionals', protect, async (req, res) => {
    try {
        const { location, category, service, search, minPrice, maxPrice } = req.query;
        let query = { status: 'approved' }; // Only show approved professionals

        // Case-insensitive matching for filters
        if (location) query.location = { $regex: new RegExp(`^${location}$`, 'i') };
        if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        if (service) query.service = { $regex: new RegExp(`^${service}$`, 'i') };

        // General search across name, category, and service
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { service: { $regex: search, $options: 'i' } }
            ];
        }

        // Price Range Filters
        if (minPrice) query['priceRange.minPrice'] = { $gte: Number(minPrice) };
        if (maxPrice) query['priceRange.maxPrice'] = { $lte: Number(maxPrice) };

        console.log('Query filters:', { location, category, service, search });
        console.log('MongoDB query:', JSON.stringify(query, null, 2));

        const professionals = await Professional.find(query);

        // Shuffle the results for fairness
        const shuffled = professionals
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => {
                const p = value.toObject();
                delete p.reviews; // Hide reviews from users
                // Note: We keep the average rating for now, but user said "how much start and revies a professional is getting" should be hidden.
                // Let's hide the rating too as per request interpretation "don't reflect it on user screen"
                delete p.rating;
                return p;
            });

        console.log(`Found and randomized ${shuffled.length} professionals`);

        res.json({ success: true, count: shuffled.length, data: shuffled });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST api/local-help/review/:id
// @desc    Add a review for a professional
// @access  Private
router.post('/review/:id', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const professional = await Professional.findById(req.params.id);

        if (!professional) {
            return res.status(404).json({ success: false, message: 'Professional not found' });
        }

        const newReview = {
            user: req.user.name,
            rating: Number(rating),
            comment
        };

        professional.reviews.push(newReview);

        // Update overall rating
        const totalRating = professional.reviews.reduce((acc, item) => item.rating + acc, 0);
        professional.rating = (totalRating / professional.reviews.length).toFixed(1);

        await professional.save();
        res.json({ success: true, data: professional });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST api/local-help/seed
// @desc    Seed demo professionals (Dev only)
// @access  Public
router.post('/seed', async (req, res) => {
    try {
        // Clear existing
        await Professional.deleteMany();

        const locs = ["smriti nagar", "Nehru Nagar", "Kohka", "Supela", "durg"];
        const serviceCategories = [
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

        const fNames = ["Amit", "Rahul", "Vijay", "Suresh", "Deepak", "Rajesh", "Mukesh", "Sanjay", "Anil", "Sunil", "Manish", "Pankaj"];
        const lNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Yadav", "Mishra"];

        const professionals = [];

        for (const loc of locs) {
            for (const cat of serviceCategories) {
                for (const service of cat.services) {
                    // Create 1-2 professionals for each service in each location
                    const count = Math.floor(Math.random() * 2) + 1;
                    for (let i = 0; i < count; i++) {
                        const firstName = fNames[Math.floor(Math.random() * fNames.length)];
                        const lastName = lNames[Math.floor(Math.random() * lNames.length)];
                        professionals.push({
                            name: `${firstName} ${lastName}`,
                            number: `+91 ${90000 + Math.floor(Math.random() * 10000)} ${10000 + Math.floor(Math.random() * 90000)}`,
                            location: loc,
                            category: cat.name,
                            service: service,
                            rating: (4 + Math.random()).toFixed(1),
                            experience: `${Math.floor(Math.random() * 15) + 1} years`,
                            verified: true,
                            priceRange: {
                                minPrice: Math.floor(Math.random() * 500) + 200, // Random 200-700
                                maxPrice: Math.floor(Math.random() * 1000) + 800 // Random 800-1800
                            },
                            reviews: [
                                {
                                    user: "Demo User",
                                    rating: 5,
                                    comment: "Excellent work and very professional!"
                                }
                            ]
                        });
                    }
                }
            }
        }

        await Professional.insertMany(professionals);
        res.json({ success: true, message: 'Seeded successfully', count: professionals.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Seed Error' });
    }
});

// @route   POST api/local-help/worker-signup
// @desc    Worker signup (Creates User + Professional)
// @access  Public
router.post('/worker-signup', async (req, res) => {
    try {
        console.log('Worker Signup Request:', req.body.number);
        let { name, number, location, category, service, experience, description, minPrice, maxPrice, email, password, userId } = req.body;

        // Sanitize inputs
        number = String(number).trim();
        email = email ? String(email).trim() : '';
        if (!name || !number || !location || !category || !service || !experience || minPrice === undefined || minPrice === '') {
            return res.status(400).json({
                success: false,
                message: 'All fields except description and max price are required'
            });
        }

        // Check if phone number already exists as a professional
        const existingWorker = await Professional.findOne({ number });
        if (existingWorker) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered as a professional with this phone number.'
            });
        }

        let user;
        let isNewUser = false;

        if (userId) {
            // Case 1: Existing logged-in user
            user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
        } else {
            // Case 2: New user or existing user by phone
            user = await User.findOne({ phone: number });

            if (!user) {
                // Create new user
                if (!password) {
                    return res.status(400).json({ success: false, message: 'Password is required for account creation' });
                }

                try {
                    console.log('Creating new user for worker...');
                    user = await User.create({
                        name,
                        phone: number,
                        email: email || undefined,
                        password
                    });
                    isNewUser = true;
                } catch (err) {
                    if (err.code === 11000) {
                        // Check which field caused the duplicate error
                        if (err.keyPattern && err.keyPattern.phone) {
                            return res.status(400).json({ success: false, message: 'Account with this phone number already exists. Please login.' });
                        }
                        return res.status(400).json({ success: false, message: 'Email already in use' });
                    }
                    throw err;
                }
            } else {
                // User exists but verify identity if trying to link without being logged in?
                // For simplicity, if they know the password, we link. Use simple password check if provided.
                if (password) {
                    const isMatch = await user.matchPassword(password);
                    if (!isMatch) {
                        return res.status(401).json({ success: false, message: 'User account with this phone exists. Invalid password provided.' });
                    }
                } else {
                    // If no password provided and user exists, we can't just link securely. 
                    // However, request implies "login" flow. 
                    return res.status(400).json({ success: false, message: 'User account exists. Please login or provide password to link professional account.' });
                }
            }
        }

        // Create approved professional record linked to user
        console.log('Creating professional record...');
        const newWorker = await Professional.create({
            name,
            number,
            location,
            category,
            service,
            experience,
            description: description || '',
            priceRange: {
                minPrice: Number(minPrice),
                maxPrice: Number(maxPrice)
            },
            status: 'approved',
            verified: true,
            rating: 0,
            reviews: [],
            userRef: user._id
        });

        // Generate token if we created a user or just reuse
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '30d'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            data: newWorker,
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });
    } catch (err) {
        console.error('Worker Signup Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
});

module.exports = router;
