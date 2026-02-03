import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const ToolCard = ({ title, description, icon: Icon, to, color = "bg-white" }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Routes that require login
    const protectedRoutes = ['/local-help', '/financial-aid', '/events', '/invoice-generator'];
    const isProtected = protectedRoutes.includes(to);

    const handleClick = (e) => {
        navigate(to);
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={`group relative p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 md:hover:shadow-xl transition-all duration-300 ${color} flex flex-col justify-between overflow-hidden cursor-pointer`}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 md:group-hover:opacity-20 transition-opacity">
                    <Icon size={64} />
                </div>

                <div className="z-10">
                    <div className="p-3 bg-blue-50 w-fit rounded-xl mb-4 md:group-hover:scale-110 transition-transform duration-300">
                        <Icon className="text-blue-600" size={24} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
                    <p className="text-gray-500 text-sm">{description}</p>
                </div>

                <div className="mt-6 flex items-center text-blue-600 font-medium md:group-hover:translate-x-1 transition-transform">
                    <span>{t('common.use_tool')}</span>
                    <ArrowRight size={16} className="ml-2" />
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                message="For accessing tool please login"
            />
        </>
    );
};

export default ToolCard;
