import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ToolCard = ({ title, description, icon: Icon, to, color = "bg-white" }) => {
    return (
        <Link
            to={to}
            className={`group relative p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 ${color} flex flex-col justify-between overflow-hidden`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={64} />
            </div>

            <div className="z-10">
                <div className="p-3 bg-blue-50 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-blue-600" size={24} />
                </div>

                <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
                <p className="text-gray-500 text-sm">{description}</p>
            </div>

            <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                <span>Use Tool</span>
                <ArrowRight size={16} className="ml-2" />
            </div>
        </Link>
    );
};

export default ToolCard;
