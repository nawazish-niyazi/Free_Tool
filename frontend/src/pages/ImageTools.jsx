import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import ToolCard from '../components/ToolCard';
import { FileDown, Loader2, Image as ImageIcon, Settings2, Maximize, Trash2, Sparkles, Wand2, Type } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const ImageTools = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');

    // States for the Editor mode
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processedUrl, setProcessedUrl] = useState(null);
    const [processedSize, setProcessedSize] = useState(null);
    const [settings, setSettings] = useState({
        width: 0,
        height: 0,
        quality: 0.8,
        format: 'image/jpeg',
        maintainAspectRatio: true
    });
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
    const canvasRef = useRef(null);

    const imageToolsList = [
        {
            title: 'Resize & Compress',
            description: 'Change dimensions and reduce file size while maintaining quality.',
            icon: Maximize,
            to: '/image-tools?mode=editor',
            color: 'bg-blue-50/50 hover:bg-blue-50'
        },
        {
            title: 'Background Removal',
            description: 'Automatically remove image backgrounds using AI.',
            icon: Sparkles,
            to: '/background-removal',
            color: 'bg-cyan-50/50 hover:bg-cyan-50'
        },
        {
            title: 'Image Converter',
            description: 'Convert between JPG, PNG, and WebP formats instantly.',
            icon: RefreshCw,
            to: '/image-tools?mode=editor',
            color: 'bg-emerald-50/50 hover:bg-emerald-50'
        }
    ];

    const onFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setProcessedUrl(null);
        setProcessedSize(null);

        const img = new Image();
        img.onload = () => {
            setOriginalDimensions({ width: img.width, height: img.height });
            setSettings(prev => ({ ...prev, width: img.width, height: img.height }));
        };
        img.src = url;
    };

    const handleDimensionChange = (e) => {
        const { name, value } = e.target;
        const val = parseInt(value) || 0;

        setSettings(prev => {
            if (prev.maintainAspectRatio) {
                const ratio = originalDimensions.width / originalDimensions.height;
                if (name === 'width') {
                    return { ...prev, width: val, height: Math.round(val / ratio) };
                } else {
                    return { ...prev, height: val, width: Math.round(val * ratio) };
                }
            }
            return { ...prev, [name]: val };
        });
        setProcessedUrl(null);
        setProcessedSize(null);
    };

    const processImage = async () => {
        if (!file || !previewUrl) return;
        setLoading(true);

        try {
            const img = new Image();
            img.src = previewUrl;
            await new Promise((resolve) => (img.onload = resolve));

            const canvas = canvasRef.current;
            canvas.width = settings.width;
            canvas.height = settings.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, settings.width, settings.height);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                setProcessedUrl(url);
                setProcessedSize(blob.size);
                setLoading(false);
            }, settings.format, settings.quality);

        } catch (error) {
            console.error(error);
            alert('Error processing image');
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setProcessedUrl(null);
        setProcessedSize(null);
    };

    const isPng = settings.format === 'image/png';

    // RENDER: Landing Menu
    if (!mode) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                    <h1 className="text-5xl font-black text-slate-900 mb-6 uppercase tracking-tight">
                        Image <span className="text-blue-600">Power Tools</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium mb-16 max-w-2xl mx-auto">
                        A full suite of professional tools to edit, optimize, and transform your images instantly.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {imageToolsList.map((tool, index) => (
                            <ToolCard key={index} {...tool} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: Editor Mode
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight uppercase">Resize & Compress</h1>
                    <p className="text-gray-500 text-lg font-medium">Optimize your images for the web in seconds.</p>
                </header>

                <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                    {!file ? (
                        <div className="p-8 md:p-12">
                            <UploadBox
                                onFileSelect={onFileSelect}
                                selectedFile={file}
                                onClear={reset}
                                supportText="Supports JPG, PNG, WEBP up to 50MB"
                                accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                                className="h-96"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                            {/* Preview Section */}
                            <div className="lg:col-span-3 p-8 bg-gray-50/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <ImageIcon size={20} className="text-blue-600" />
                                        Preview
                                    </h3>
                                    <button
                                        onClick={reset}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove image"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div className="aspect-video bg-white rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group shadow-sm">
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain p-4"
                                        />
                                    )}
                                </div>
                                <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-500 justify-center">
                                    <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm font-bold text-slate-700">
                                        Original: {originalDimensions.width} × {originalDimensions.height}
                                    </div>
                                    <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm font-bold text-slate-700">
                                        Size: {(file.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                            </div>

                            {/* Controls Section */}
                            <div className="lg:col-span-2 p-8 bg-white">
                                <div className="space-y-8">
                                    {/* Resize */}
                                    <section>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <Maximize size={20} className="text-blue-600" />
                                            Dimensions
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Width</label>
                                                <input
                                                    type="number"
                                                    name="width"
                                                    value={settings.width}
                                                    onChange={handleDimensionChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Height</label>
                                                <input
                                                    type="number"
                                                    name="height"
                                                    value={settings.height}
                                                    onChange={handleDimensionChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                        <label className="mt-4 flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.maintainAspectRatio}
                                                    onChange={(e) => {
                                                        setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }));
                                                        setProcessedUrl(null);
                                                        setProcessedSize(null);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </div>
                                            <span className="text-sm font-bold text-slate-600">Maintain Aspect Ratio</span>
                                        </label>
                                    </section>

                                    {/* Quality & Format */}
                                    <section>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <Settings2 size={20} className="text-blue-600" />
                                            Settings
                                        </h3>
                                        <div className="space-y-5">
                                            <div className={`space-y-1 transition-opacity ${isPng ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quality</label>
                                                    <span className="text-sm font-black text-blue-600">{Math.round(settings.quality * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1.0"
                                                    step="0.1"
                                                    value={settings.quality}
                                                    onChange={(e) => {
                                                        setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }));
                                                        setProcessedUrl(null);
                                                        setProcessedSize(null);
                                                    }}
                                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Output Format</label>
                                                <select
                                                    value={settings.format}
                                                    onChange={(e) => {
                                                        setSettings(prev => ({ ...prev, format: e.target.value }));
                                                        setProcessedUrl(null);
                                                        setProcessedSize(null);
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold cursor-pointer"
                                                >
                                                    <option value="image/jpeg">JPEG (Progressive)</option>
                                                    <option value="image/png">PNG (Lossless)</option>
                                                    <option value="image/webp">WebP (Optimized)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Action Button */}
                                    {!processedUrl ? (
                                        <button
                                            onClick={processImage}
                                            disabled={loading}
                                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-xl shadow-blue-200 transition-all disabled:opacity-50 flex justify-center items-center gap-3 text-lg group"
                                        >
                                            {loading ? <><Loader2 className="animate-spin" size={24} /> Processing...</> : <>Process Image <Wand2 size={20} /></>}
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                                                <div className="flex justify-between text-sm mb-1 font-bold">
                                                    <span className="text-green-700">New Size:</span>
                                                    <span className="text-green-800">{(processedSize / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-400">Saving:</span>
                                                    <span className="text-green-600">
                                                        {Math.round((1 - (processedSize / file.size)) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {!isLoggedIn ? (
                                                <button
                                                    onClick={() => setShowAuthModal(true)}
                                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-xl shadow-blue-200 transition-all flex justify-center items-center gap-3 text-lg"
                                                >
                                                    <FileDown size={24} />
                                                    Login to Download
                                                </button>
                                            ) : (
                                                <a
                                                    href={processedUrl}
                                                    download={`nair-image-${file.name.split('.')[0]}.${settings.format.split('/')[1]}`}
                                                    className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-3xl shadow-xl shadow-green-200 transition-all flex justify-center items-center gap-3 text-lg"
                                                >
                                                    <FileDown size={24} />
                                                    Download Ready
                                                </a>
                                            )}
                                            <button
                                                onClick={() => { setProcessedUrl(null); setProcessedSize(null); }}
                                                className="w-full py-3 text-slate-400 hover:text-slate-900 font-bold transition-colors text-sm"
                                            >
                                                Adjust Settings
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

// Add missing icon
const RefreshCw = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
);

export default ImageTools;
