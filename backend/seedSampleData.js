const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const FinancialAid = require('./src/models/FinancialAid');
const Event = require('./src/models/Event');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Sample Financial Aids
        const aids = [
            {
                name: 'Kashyap Money Lenders',
                type: 'LALA',
                description: 'Providing quick personal loans with flexible repayment options for local residents.',
                phone: '9876543210',
                location: 'Nehru Nagar',
                isApproved: true
            },
            {
                name: 'Global Finance NBFC',
                type: 'NBFC',
                description: 'Professional financial services including business and gold loans at competitive rates.',
                phone: '011-22334455',
                location: 'Civil Lines',
                isApproved: true
            },
            {
                name: 'City Community Bank',
                type: 'Banking',
                description: 'Full-service banking with special saving schemes for farmers and small businesses.',
                phone: '1800-444-555',
                location: 'Main Market',
                isApproved: true
            }
        ];

        // Sample Events
        const events = [
            {
                title: 'Local Craft & Food Festival 2026',
                description: 'Experience the best local crafts, street food, and music. Fun for the whole family!',
                image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
                date: new Date('2026-03-15'),
                location: 'Central Stadium',
                organizer: 'City Cultural Board',
                link: '#'
            },
            {
                title: 'Tech Workshop: Digital Skills',
                description: 'Free workshop on basic computer skills and online safety for senior citizens.',
                image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
                date: new Date('2026-02-28'),
                location: 'Public Library',
                organizer: 'Youth Connect NGO',
                link: '#'
            }
        ];

        await FinancialAid.insertMany(aids);
        await Event.insertMany(events);

        console.log('Sample data seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
