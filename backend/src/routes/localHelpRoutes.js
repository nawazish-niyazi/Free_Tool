const express = require('express');
const router = express.Router();
const Professional = require('../models/Professional');
const { protect } = require('../middleware/auth');

// @route   GET api/local-help/professionals
// @desc    Get all professionals with filters
// @access  Private
router.get('/professionals', protect, async (req, res) => {
    try {
        const { location, category, service } = req.query;
        let query = {};

        if (location) query.location = location;
        if (category) query.category = category;
        if (service) query.service = service;

        const professionals = await Professional.find(query);
        res.json({ success: true, count: professionals.length, data: professionals });
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

module.exports = router;
