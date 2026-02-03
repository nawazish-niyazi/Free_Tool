import React from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RestrictedAccess = ({ onLoginClick }) => {
    // const { t } = useTranslation(); // If you want to use translation later

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Lock className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3 text-center">
                Restricted Access
            </h3>
            <p className="text-slate-500 font-medium text-center max-w-md mb-8">
                For accessing tool please sing in
            </p>
            <button
                onClick={onLoginClick}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
                Sign In
            </button>
        </div>
    );
};

export default RestrictedAccess;
