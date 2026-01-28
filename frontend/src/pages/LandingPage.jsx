import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

const LandingPage = () => {
    const { shortId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/qr/multi/${shortId}`);
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load links');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [shortId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-8 rounded-[32px] shadow-xl text-center max-w-md w-full border border-red-100">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Oops!</h1>
                    <p className="text-gray-500 font-medium">{error}</p>
                    <a href="/" className="mt-6 inline-block text-blue-600 font-bold hover:underline">Back to Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 md:py-12 md:px-6">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-10">
                    {data.logo ? (
                        <div className={`h-24 bg-white ${data.logoShape === 'round' ? 'w-24 rounded-full' : 'w-fit min-w-[6rem] max-w-[15rem] rounded-[2rem] px-6'} flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-100 overflow-hidden py-2`}>
                            <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
                            <span className="text-white text-3xl font-black italic">N</span>
                        </div>
                    )}
                    <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                        {data.title || 'My Shared Links'}
                    </h1>
                    <p className="text-gray-500 font-medium">Click any link below to visit</p>
                </div>

                <div className="space-y-4">
                    {data.links.map((link, index) => (
                        <a
                            key={index}
                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-white hover:bg-blue-600 p-5 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200 flex items-center justify-between"
                        >
                            <span className="font-black text-gray-900 group-hover:text-white transition-colors">{link.name}</span>
                            <ExternalLink className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                        </a>
                    ))}
                </div>

                <footer className="mt-16 text-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Powered by</p>
                    <p className="text-sm font-black text-blue-600 italic">N.A.I.R SOLUTIONS</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
