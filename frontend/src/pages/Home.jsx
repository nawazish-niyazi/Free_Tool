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
            color: 'bg-slate-200 hover:bg-slate-300 border-2 border-slate-900/5'
        },
        {
            title: 'QR Code Generator',
            description: 'Convert any link into a custom QR code instantly.',
            icon: QrCode,
            to: '/qr-generator',
            color: 'bg-yellow-100 hover:bg-yellow-200'
        },
        {
            title: 'PDF Tools',
            description: 'Convert, Compress, Protect, and Edit your PDF files in one place.',
            icon: FileText,
            to: '/pdf-tools',
            color: 'bg-indigo-100 hover:bg-indigo-200'
        },
        {
            title: 'Image Tools',
            description: 'Resize, Compress, and Convert Images instantly.',
            icon: Image,
            to: '/image-tools',
            color: 'bg-emerald-100 hover:bg-emerald-200'
        },
        {
            title: 'Local Help',
            description: 'Find local plumbers, electricians, and other professionals nearby.',
            icon: Search,
            to: '/local-help',
            color: 'bg-cyan-100 hover:bg-cyan-200'
        },
    ].filter(tool => tool.to !== '/local-help' || user);

    return (
        <div className="min-h-screen bg-white">
            {/* The top navigation bar */}
            <Navbar />

            {/* Hero Section: The big welcome text at the top (Restored to original centered style) */}
            <div className="relative isolate px-4 sm:px-6 pt-10 sm:pt-14 lg:px-8">
                <div className="mx-auto max-w-4xl py-8 sm:py-20 lg:py-28 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
                        One-Stop <span className="text-blue-600">Solution</span>
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-gray-600 mb-10 max-w-2xl mx-auto px-4">
                        Your all-in-one destination for documents, images, and tools. One place to find everything you need to get the job done.
                    </p>

                    {/* Local Help Line: Centered integration for logged-in users */}
                    {user && (
                        <div className="flex justify-center items-center px-4">
                            <Link
                                to="/local-help"
                                className="group relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 md:p-6 bg-white rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-xl w-full sm:w-auto"
                            >
                                <div className="p-3 sm:p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Search size={24} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <span className="block text-lg sm:text-xl font-bold text-gray-900">Local Help Line</span>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
                                        Find professionals near you.
                                    </p>
                                </div>
                                <div className="hidden sm:flex ml-4 p-2 bg-blue-600 text-white rounded-full group-hover:translate-x-1 transition-transform">
                                    <Zap size={14} />
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Tools Grid: Shows all the tools categorized in boxes */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-24">
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

