const mongoose = require('mongoose');
const Coupon = require('./src/models/Coupon');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const seedCoupons = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nair');
        console.log('Connected to MongoDB');

        // Clear existing coupons
        await Coupon.deleteMany();

        const coupons = [
            {
                title: 'Cafe Delight for Couples',
                description: 'Enjoy a cozy evening with your special someone at Emerald Cafe. Flat 25% off on the entire bill.',
                image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80', // Placeholder but looking good
                code: 'COUPLE25',
                keyPoints: ['Flat 25% off', 'Valid on weekends', 'Minimum bill ₹1000'],
                active: true
            },
            {
                title: 'Tech Upgrade Special',
                description: 'Get the best electronics at unbeatable prices. Special discount for N.A.I.R community.',
                image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1744&q=80',
                code: 'TECHNAIR',
                keyPoints: ['Up to ₹2000 off', 'Expert installation included', 'Valid on all brands'],
                active: true
            },
            {
                title: 'Home Bliss Massage',
                description: 'Relieve your stress with a professional massage at your home. First time users only.',
                image: 'https://images.unsplash.com/photo-1544161515-4cf6b1d499de?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
                code: 'RELAX10',
                keyPoints: ['₹500 flat discount', 'Choose your therapist', 'Hygienic and safe'],
                active: true
            },
            {
                title: 'Fashion Hub Sale',
                description: 'Update your wardrobe with the latest trends. Exclusive offer for college students.',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
                code: 'FASHION30',
                keyPoints: ['Flat 30% off', 'Trendy collection', 'Valid on first 2 items'],
                active: true
            },
            {
                title: 'Gourmet Pizza Night',
                description: 'Perfect pizza for your weekend gatherings. Buy 1 Get 1 Free on all medium pizzas.',
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
                code: 'PIZZA2X',
                keyPoints: ['Buy 1 Get 1 Free', 'Valid after 7 PM', 'Multiple toppings'],
                active: true
            },
            {
                title: 'Gym & Fitness Pass',
                description: 'Start your fitness journey today. Get 1 month free on any annual membership.',
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
                code: 'FITPASS',
                keyPoints: ['1 Month Free', 'Access to all machines', 'Personal trainer session'],
                active: true
            }
        ];

        await Coupon.insertMany(coupons);
        console.log('Coupons seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCoupons();
