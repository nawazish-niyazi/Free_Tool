import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import axios from 'axios';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';

const RemoveWatermarkPage = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processedLink, setProcessedLink] = useState(null);

    const handleRemoveWatermark = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/pdf/remove-watermark`, formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setProcessedLink(url);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        alert(`Error: ${errorData.message || 'Failed to remove watermark'}`);
                    } catch (e) {
                        alert('Error removing watermark. Please try again.');
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                alert(error.response?.data?.message || 'Error communicating with server');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Remove Watermark from PDF</h1>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-center py-16">
                        <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mb-6">
                            <AlertCircle size={64} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Coming Soon</h2>
                        <p className="text-lg text-gray-600 max-w-md mx-auto">
                            This feature will be enabled soon. We are currently upgrading our removal algorithms to provide better results.
                        </p>
                        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 max-w-sm mx-auto">
                            <p className="text-sm text-gray-500">
                                Please check back later for updates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoveWatermarkPage;
