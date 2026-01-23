/**
 * Home Page
 * This is the main page that users see when they open the website.
 * It shows a list of all the different tools available.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { FileType, Image, Zap, Shield, FileText, Layers, Lock, Unlock, Droplets, Eraser, Building2, Sparkles, Search, QrCode } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();
    /**
     * List of all tools shown on the home page.
     * Each tool has a title, description, icon, and link.
     */
    const tools = [
        {
            title: 'Invoice Generator',
            description: 'Create professional PDF invoices with custom branding.',
            icon: Building2,
            to: '/invoice-generator',
            color: 'bg-slate-100 hover:bg-slate-200 border-2 border-slate-900/5'
        },
        {
            title: 'QR Code Generator',
            description: 'Convert any link into a custom QR code instantly.',
            icon: QrCode,
            to: '/qr-generator',
            color: 'bg-yellow-50/50 hover:bg-yellow-50'
        },
        {
            title: 'PDF Tools',
            description: 'Convert, Compress, Protect, and Edit your PDF files in one place.',
            icon: FileText,
            to: '/pdf-tools',
            color: 'bg-indigo-50/50 hover:bg-indigo-50'
        },
        {
            title: 'Image Tools',
            description: 'Resize, Compress, and Convert Images instantly.',
            icon: Image,
            to: '/image-tools',
            color: 'bg-emerald-50/50 hover:bg-emerald-50'
        },
        {
            title: 'Local Help',
            description: 'Find local plumbers, electricians, and other professionals nearby.',
            icon: Search,
            to: '/local-help',
            color: 'bg-cyan-50/50 hover:bg-cyan-50'
        }
    ].filter(tool => tool.to !== '/local-help' || user);

    return (
        <div className="min-h-screen bg-white">
            {/* The top navigation bar */}
            <Navbar />

            {/* Hero Section: The big welcome text at the top (Restored to original centered style) */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-4xl py-20 sm:py-24 lg:py-28 text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl mb-6">
                        One-Stop <span className="text-blue-600">Solution</span>
                    </h1>
                    <p className="text-xl leading-8 text-gray-600 mb-10 max-w-2xl mx-auto">
                        Your all-in-one destination for documents, images, and tools. One place to find everything you need to get the job done.
                    </p>

                    {/* Local Help Line: Centered integration for logged-in users */}
                    {user && (
                        <div className="flex justify-center items-center">
                            <Link
                                to="/local-help"
                                className="group relative flex flex-row items-center gap-6 p-6 bg-white rounded-[2.5rem] border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-xl"
                            >
                                <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Search size={28} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-xl font-bold text-gray-900">Local Help Line</span>
                                    <p className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                        Find professionals near you.
                                    </p>
                                </div>
                                <div className="ml-4 p-2 bg-blue-600 text-white rounded-full group-hover:translate-x-1 transition-transform">
                                    <Zap size={14} />
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Tools Grid: Shows all the tools categorized in boxes */}
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Loop through the tools list and create a 'ToolCard' component for each one */}
                    {tools.map((tool, index) => (
                        <ToolCard key={index} {...tool} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;

