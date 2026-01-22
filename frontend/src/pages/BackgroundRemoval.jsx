import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import axios from 'axios';
import { FileDown, Loader2, Image as ImageIcon, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BackgroundRemoval = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processedFilename, setProcessedFilename] = useState(null);
    const [error, setError] = useState(null);

    const onFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setProcessedFilename(null);
        setError(null);
    };

    const handleRemoveBackground = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://localhost:5000/api/image/remove-bg', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setProcessedFilename(res.data.filename);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to process image. Make sure AI service is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        if (!processedFilename) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/image/download/${processedFilename}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `no-bg-${file.name.split('.')[0]}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Download failed. File may have expired.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="text-center mb-12">
                    <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">AI Background Removal</h1>
                    <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
                        Automatically remove backgrounds from your images in seconds. Powered by open-source AI.
                    </p>
                </header>

                <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-12">
                        {!processedFilename ? (
                            <>
                                <UploadBox
                                    onFileSelect={onFileSelect}
                                    selectedFile={file}
                                    onClear={() => { setFile(null); setPreviewUrl(null); setError(null); }}
                                    supportText="Supports JPG, PNG up to 10MB"
                                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
                                />

                                {file && (
                                    <div className="mt-10">
                                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8">
                                            <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                                                <ImageIcon size={20} className="text-blue-600" />
                                                Original Preview
                                            </div>
                                            <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                                <img src={previewUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 font-bold">
                                                <AlertCircle size={20} />
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleRemoveBackground}
                                            disabled={loading}
                                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[24px] shadow-xl shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg group"
                                        >
                                            {loading ? (
                                                <><Loader2 className="animate-spin" size={24} /> Processing with AI...</>
                                            ) : (
                                                <>Remove Background <Sparkles size={20} className="group-hover:rotate-12 transition-transform" /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-4">Background Removed!</h2>
                                <p className="text-slate-500 font-medium mb-10">Preview your transparent image below.</p>

                                <div className="bg-[#f0f0f0] bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px] rounded-3xl p-8 border border-slate-200 mb-10 inline-block w-full max-w-2xl">
                                    <img
                                        src={`http://localhost:5000/temp/${processedFilename}`}
                                        alt="Processed"
                                        className="max-w-full max-h-96 object-contain mx-auto drop-shadow-2xl"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                    <button
                                        onClick={handleDownload}
                                        className="py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-[24px] shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        <FileDown size={24} />
                                        Download PNG
                                    </button>
                                    <button
                                        onClick={() => { setProcessedFilename(null); setFile(null); setPreviewUrl(null); }}
                                        className="py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-[24px] transition-all text-lg"
                                    >
                                        Upload Another
                                    </button>
                                </div>

                                {!isLoggedIn && (
                                    <p className="mt-6 text-sm text-slate-400 font-bold uppercase tracking-widest">
                                        Login required to download the high-quality result
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'AI Powered', desc: 'Uses advanced neural networks for precision.' },
                        { title: '100% Automatic', desc: 'No manual masking or brush tools needed.' },
                        { title: 'Privacy First', desc: 'Photos are processed and deleted automatically.' }
                    ].map((item, i) => (
                        <div key={i} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-900 mb-2">{item.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BackgroundRemoval;
