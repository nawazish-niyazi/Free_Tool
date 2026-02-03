const express = require('express');
const router = express.Router();
const Professional = require('../models/Professional');
const User = require('../models/User');
const LocalHelpCategory = require('../models/LocalHelpCategory');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// @route   GET api/local-help/categories
// @desc    Get all active service categories
// @access  Public (Used in Signup/Filters)
router.get('/categories', async (req, res) => {
    try {
        const categories = await LocalHelpCategory.find().sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT api/local-help/profile/update
// @desc    Update professional profile details
// @access  Private
router.put('/profile/update', protect, async (req, res) => {
    try {
        const { name, number, locations, services, experience, minPrice, maxPrice, description } = req.body;

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
        if (locations) professional.locations = locations;
        if (category) professional.category = category;
        if (services) professional.services = services;
        if (experience) professional.experience = experience;
        if (description !== undefined) professional.description = description;

        // Ensure active professionals are approved
        professional.status = 'approved';
        professional.verified = true;

        // Update price range
        if (minPrice !== undefined) professional.priceRange.minPrice = Number(minPrice);
        if (maxPrice !== undefined) professional.priceRange.maxPrice = Number(maxPrice);

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
        const { location, search, minPrice, maxPrice, category, service } = req.query;
        let query = { status: 'approved' }; // Only show approved professionals

        // Location Filter (Checks if ANY of the pro's locations match the query)
        if (location) {
            query.locations = { $regex: new RegExp(`^${location}$`, 'i') };
        }

        // Category Filter
        if (category) {
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        // Service Filter (Checks in services array)
        if (service) {
            query.services = { $regex: new RegExp(`^${service}$`, 'i') };
        }

        // General search across name, services and experience
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { services: { $elemMatch: { $regex: search, $options: 'i' } } },
                { experience: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        // Price Range Filters
        if (minPrice) query['priceRange.minPrice'] = { $gte: Number(minPrice) };
        if (maxPrice) query['priceRange.maxPrice'] = { $lte: Number(maxPrice) };

        console.log('Query filters:', { location, search });
        // console.log('MongoDB query:', JSON.stringify(query, null, 2));

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
// @desc    Seed demo professionals and categories (Dev only)
// @access  Public
router.post('/seed', async (req, res) => {
    try {
        // Clear existing
        await Professional.deleteMany();
        await LocalHelpCategory.deleteMany();

        const locs = ["Smriti Nagar", "Nehru Nagar", "Kohka", "Supela", "Durg"];

        // Categories for Suggestion usage
        const serviceCategories = [
            {
                name: "House Needs",
                services: ["Electrician", "Plumber", "Carpenter", "Painter", "House Help", "Gardener", "AC Repair", "Pest Control", "Home Cleaning"]
            },
            {
                name: "Construction",
                services: ["Reja", "Mistri", "Contractor", "Construction Worker", "Tiles Mistri", "Plastering", "Centering"]
            },
            {
                name: "Food & Help",
                services: ["Cook", "Helper", "Local Mess", "Tiffin Service", "Waiter"]
            },
            {
                name: "Automobile",
                services: ["Driver", "Car Mechanic", "Bike Mechanic", "Car Wash", "Towing Service"]
            },
            {
                name: "Mechanics and Repairing",
                services: ["Electronics Repair", "Laptop/Mobile Repair", "Appliance Repair", "Watch Repair", "Refrigerator Repair"]
            },
            {
                name: "Entertainment",
                services: ["DJ", "Event Manager", "Photographer", "Videographer", "Anchor/Emcee", "Magician"]
            },
            {
                name: "Fashion & Makeup",
                services: ["Tailor", "Makeup Artist", "Hair Stylist", "Fashion Designer", "Boutique", "Draper"]
            },
            {
                name: "Art & Crafts",
                services: ["Painter (Artist)", "Sculptor", "Mehndi Artist", "Tattoo Artist", "Craft Teacher"]
            },
            {
                name: "Freelancers",
                services: ["Web Developer", "Graphic Designer", "Content Writer", "SEO Expert", "Accountant", "Digital Marketer"]
            },
            {
                name: "Tutors",
                services: ["Math Tutor", "English Tutor", "Yoga Instructor", "Music Teacher", "Dance Teacher", "Science Tutor"]
            },
            {
                name: "Health & Care",
                services: ["Nurse", "Caretaker", "Physiotherapist", "Baby Sitter", "Gym Trainer", "Elderly Care"]
            },
            {
                name: "Religious Center",
                services: ["Pandit", "Priest", "Astrology", "Vastu Consultant"]
            },
            {
                name: "Govt Center",
                services: ["Aadhar Service", "Pan Card Service", "CSC Center", "E-Mitra"]
            },
            {
                name: "Caterers & Tent",
                services: ["Wedding Caterer", "Tent House", "Decoration Service", "Flower Decor"]
            }
        ];

        // Seed categories
        await LocalHelpCategory.insertMany(serviceCategories);

        const fNames = ["Amit", "Rahul", "Vijay", "Suresh", "Deepak", "Rajesh", "Mukesh", "Sanjay", "Anil", "Sunil", "Manish", "Pankaj"];
        const lNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Yadav", "Mishra"];

        const professionals = [];

        // Create 20 random professionals
        for (let i = 0; i < 20; i++) {
            // Pick random services (1 to 3)
            const randomCategory = serviceCategories[Math.floor(Math.random() * serviceCategories.length)];
            const numServices = Math.floor(Math.random() * 2) + 1;
            const myServices = [];
            for (let j = 0; j < numServices; j++) {
                myServices.push(randomCategory.services[Math.floor(Math.random() * randomCategory.services.length)]);
            }
            // Dedup
            const uniqueServices = [...new Set(myServices)];

            // Pick random locations (1 to 3)
            const numLocs = Math.floor(Math.random() * 3) + 1;
            const myLocs = [];
            for (let j = 0; j < numLocs; j++) {
                myLocs.push(locs[Math.floor(Math.random() * locs.length)]);
            }
            const uniqueLocs = [...new Set(myLocs)];

            const firstName = fNames[Math.floor(Math.random() * fNames.length)];
            const lastName = lNames[Math.floor(Math.random() * lNames.length)];

            professionals.push({
                name: `${firstName} ${lastName}`,
                number: `+91 ${90000 + Math.floor(Math.random() * 10000)} ${10000 + Math.floor(Math.random() * 90000)}`,
                locations: uniqueLocs,
                services: uniqueServices,
                rating: (4 + Math.random()).toFixed(1),
                experience: `${Math.floor(Math.random() * 15) + 1} years`,
                verified: true,
                priceRange: {
                    minPrice: Math.floor(Math.random() * 500) + 200,
                    maxPrice: Math.floor(Math.random() * 1000) + 800
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

        await Professional.insertMany(professionals);
        res.json({ success: true, message: 'Seeded successfully', count: professionals.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Seed Error' });
    }
});

// @route   POST api/local-help/sync-categories
// @desc    Sync/Add missing categories without deleting professionals
// @access  Public
router.post('/sync-categories', async (req, res) => {
    try {
        const serviceCategories = [
            { name: "House Needs", services: ["Electrician", "Plumber", "Carpenter", "Painter", "House Help", "Gardener", "AC Repair", "Pest Control", "Home Cleaning"] },
            { name: "Construction", services: ["Reja", "Mistri", "Contractor", "Construction Worker", "Tiles Mistri", "Plastering", "Centering"] },
            { name: "Food & Help", services: ["Cook", "Helper", "Local Mess", "Tiffin Service", "Waiter"] },
            { name: "Automobile", services: ["Driver", "Car Mechanic", "Bike Mechanic", "Car Wash", "Towing Service"] },
            { name: "Mechanics and Repairing", services: ["Electronics Repair", "Laptop/Mobile Repair", "Appliance Repair", "Watch Repair", "Refrigerator Repair"] },
            { name: "Entertainment", services: ["DJ", "Event Manager", "Photographer", "Videographer", "Anchor/Emcee", "Magician"] },
            { name: "Fashion & Makeup", services: ["Tailor", "Makeup Artist", "Hair Stylist", "Fashion Designer", "Boutique", "Draper"] },
            { name: "Art & Crafts", services: ["Painter (Artist)", "Sculptor", "Mehndi Artist", "Tattoo Artist", "Craft Teacher"] },
            { name: "Freelancers", services: ["Web Developer", "Graphic Designer", "Content Writer", "SEO Expert", "Accountant", "Digital Marketer"] },
            { name: "Tutors", services: ["Math Tutor", "English Tutor", "Yoga Instructor", "Music Teacher", "Dance Teacher", "Science Tutor"] },
            { name: "Health & Care", services: ["Nurse", "Caretaker", "Physiotherapist", "Baby Sitter", "Gym Trainer", "Elderly Care"] },
            { name: "Religious Center", services: ["Pandit", "Priest", "Astrology", "Vastu Consultant"] },
            { name: "Govt Center", services: ["Aadhar Service", "Pan Card Service", "CSC Center", "E-Mitra"] },
            { name: "Caterers & Tent", services: ["Wedding Caterer", "Tent House", "Decoration Service", "Flower Decor"] }
        ];

        let added = 0;
        let updated = 0;

        for (const cat of serviceCategories) {
            const existing = await LocalHelpCategory.findOne({ name: cat.name });
            if (existing) {
                const mergedServices = [...new Set([...existing.services, ...cat.services])];
                existing.services = mergedServices;
                await existing.save();
                updated++;
            } else {
                await LocalHelpCategory.create(cat);
                added++;
            }
        }
        res.json({ success: true, message: `Sync complete. Added ${added}, Updated ${updated} categories.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST api/local-help/worker-signup
// @desc    Worker signup (Creates User + Professional)
// @access  Public
router.post('/worker-signup', async (req, res) => {
    try {
        console.log('Worker Signup Request:', req.body.number);
        let { name, number, locations, services, experience, description, minPrice, maxPrice, email, password, userId } = req.body;

        // Sanitize inputs
        number = String(number).trim();
        email = email ? String(email).trim() : '';

        // Basic validation
        if (!name || !number || !locations || locations.length === 0 || !services || services.length === 0 || !experience || minPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required. Please select at least one location and one service.'
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

        // Fetch all predefined services to check against
        const allCategories = await LocalHelpCategory.find();
        const predefinedServices = new Set(allCategories.flatMap(cat => cat.services.map(s => s.toLowerCase())));

        const approvedServices = [];
        const pendingServices = [];

        services.forEach(s => {
            if (predefinedServices.has(s.toLowerCase())) {
                approvedServices.push(s);
            } else {
                pendingServices.push(s);
            }
        });

        // Create approved professional record linked to user
        console.log('Creating professional record...');
        const newWorker = await Professional.create({
            name,
            number,
            locations, // Array
            services: approvedServices,  // Predefined skills
            pendingServices: pendingServices, // Custom skills for admin approval
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
