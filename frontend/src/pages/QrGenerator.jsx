import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Navbar from '../components/Navbar';
import { QrCode, Download, Link as LinkIcon, RefreshCw, Loader2, Settings2, Palette, Plus, Trash2, List, Image as ImageIcon, LogIn, PlusCircle, X, Smartphone, ExternalLink, Save, Plus as PlusIcon, CheckCircle2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const QrGenerator = () => {
    const { isLoggedIn, user, setShowAuthModal } = useAuth();
    const [url, setUrl] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [error, setError] = useState('');
    const [options, setOptions] = useState({
        width: 300,
        dark: '#000000',
        light: '#ffffff'
    });
    const [mode, setMode] = useState('single'); // 'single' or 'multi'
    const [multiLinks, setMultiLinks] = useState([]);
    const [multiTitle, setMultiTitle] = useState('');
    const [myQRs, setMyQRs] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [showAddLinkModal, setShowAddLinkModal] = useState(false);
    const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'preview'
    const [editingQrId, setEditingQrId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [imageToCrop, setImageToCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropShape, setCropShape] = useState('rect'); // 'rect' or 'round'

    const fetchMyQRs = async () => {
        if (!isLoggedIn) return;
        setFetchLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/qr/my-multi-qrs`);
            if (res.data.success) {
                setMyQRs(res.data.data);
            }
        } catch (err) {
            console.error('Fetch my QRs error:', err);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        fetchMyQRs();
        fetchInvoiceLogo();
    }, [isLoggedIn, user?.id]);

    const fetchInvoiceLogo = () => {
        const userSuffix = isLoggedIn && user?.id ? user.id : 'guest';
        const businessKey = `invoice_business_info_${userSuffix}`;
        const savedData = localStorage.getItem(businessKey);

        if (isLoggedIn && savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.logo) {
                setLogoPreview(parsedData.logo);
                setLogo(parsedData.logo);
                setImageToCrop(parsedData.logo);
            } else {
                setLogoPreview(null);
                setLogo(null);
            }
        } else {
            // Clear if not logged in or no data found
            setLogoPreview(null);
            setLogo(null);
            setImageToCrop(null);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (mode === 'single' && url) {
            const timer = setTimeout(() => {
                generateQr();
            }, 800);
            return () => clearTimeout(timer);
        } else if (mode === 'multi' && url && qrDataUrl) {
            // Regeneration purely for options (color/size)
            generateQrImageData(url);
        }
    }, [url, options, mode]);

    const generateQrImageData = async (urlToUse) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/qr/generate`, {
                url: urlToUse.startsWith('http') ? urlToUse : `https://${urlToUse}`,
                options
            });
            if (res.data.success) {
                setQrDataUrl(res.data.qrDataUrl);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generateQr = async () => {
        if (mode === 'single') {
            if (!url) {
                setError('Please enter a valid URL');
                return;
            }

            try {
                // Basic URL validation
                new URL(url.startsWith('http') ? url : `https://${url}`);
                setError('');
            } catch (e) {
                setError('Please enter a valid URL (e.g., https://example.com)');
                return;
            }

            setLoading(true);
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/qr/generate`, {
                    url: url.startsWith('http') ? url : `https://${url}`,
                    options
                });
                if (res.data.success) {
                    setQrDataUrl(res.data.qrDataUrl);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to generate QR code');
            } finally {
                setLoading(false);
            }
        } else {
            // Multi-link logic
            const validLinks = multiLinks.filter(l => l.name && l.url);
            if (validLinks.length === 0) {
                setError('At least one link with name and URL is required');
                return;
            }

            setLoading(true);
            try {
                // 1. Create or Update the multi-link record
                let multiRes;
                const payload = { title: multiTitle, links: validLinks, logo: logoPreview, logoShape: cropShape };

                if (editingQrId) {
                    multiRes = await axios.put(`${import.meta.env.VITE_API_URL}/qr/multi/${editingQrId}`, payload);
                } else {
                    multiRes = await axios.post(`${import.meta.env.VITE_API_URL}/qr/multi`, payload);
                }

                if (multiRes.data.success) {
                    const landingPageUrl = multiRes.data.url;
                    setUrl(landingPageUrl);

                    // 2. Generate QR for the landing page URL
                    await generateQrImageData(landingPageUrl);
                    fetchMyQRs(); // Refresh the list
                    setSuccessMessage(editingQrId ? 'Changes saved successfully!' : 'QR Collection created!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to save multi-link QR');
            } finally {
                setLoading(false);
                setActiveTab('qr');
            }
        }
    };

    const handleDeleteQR = async (id) => {
        if (!window.confirm('Are you sure you want to delete this QR? This will make the links inaccessible.')) return;

        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/qr/multi/${id}`);
            if (res.data.success) {
                setMyQRs(myQRs.filter(qr => qr._id !== id));
                // If currently viewing the deleted QR, clear it
                if (url.includes(myQRs.find(q => q._id === id)?.shortId)) {
                    setQrDataUrl('');
                    setUrl('');
                }
            }
        } catch (err) {
            console.error('Delete QR error:', err);
            alert('Failed to delete QR');
        }
    };

    const addLinkField = () => {
        if (multiLinks.length < 10) {
            setShowAddLinkModal(true);
        } else {
            alert('Maximum 10 links allowed');
        }
    };

    const handleAddLink = (newLink) => {
        setMultiLinks([...multiLinks, newLink]);
        setQrDataUrl(''); // Clear old QR as data changed
    };

    const removeLinkField = (index) => {
        const newLinks = [...multiLinks];
        newLinks.splice(index, 1);
        setMultiLinks(newLinks);
    };

    const updateLinkField = (index, field, value) => {
        const newLinks = [...multiLinks];
        newLinks[index][field] = value;
        setMultiLinks(newLinks);
        setQrDataUrl(''); // Clear old QR
    };

    // Removed auto-generation as per user request. 
    // QR is now only generated when the button is clicked.

    const handleDownload = async (format) => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        setDownloadLoading(true);
        try {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/qr/download`, {
                url: fullUrl,
                format,
                options
            }, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: format === 'svg' ? 'image/svg+xml' : 'image/png' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `qrcode-${new URL(fullUrl).hostname}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Error downloading QR code');
        } finally {
            setDownloadLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight uppercase">
                        Link to <span className="text-blue-600">QR Code</span>
                    </h1>
                    <p className="text-gray-500 text-lg font-medium">Instantly convert any URL into a high-quality QR code.</p>
                </header>

                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1.5 rounded-2xl shadow-lg flex gap-1 border border-gray-100">
                        <button
                            onClick={() => { setMode('single'); setQrDataUrl(''); setUrl(''); setError(''); }}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${mode === 'single' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <LinkIcon size={18} /> Single Link
                        </button>
                        <button
                            onClick={() => { setMode('multi'); setQrDataUrl(''); setUrl(''); setError(''); }}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${mode === 'multi' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <List size={18} /> Multi-Link
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Panel: Input & Settings */}
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 p-4 md:p-8 space-y-8">
                        {/* Dynamic Input based on Mode */}
                        {mode === 'single' ? (
                            <section>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Target URL</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => {
                                            setUrl(e.target.value);
                                            setQrDataUrl('');
                                        }}
                                        placeholder="https://example.com"
                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-red-200' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-lg`}
                                    />
                                </div>
                            </section>
                        ) : (
                            <div className="space-y-6">
                                <section>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Collection Title (Optional)</label>
                                    <input
                                        type="text"
                                        value={multiTitle}
                                        onChange={(e) => setMultiTitle(e.target.value)}
                                        placeholder="e.g. My Social Links"
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold"
                                    />
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Links ({multiLinks.length}/10)</label>
                                        <button
                                            onClick={addLinkField}
                                            disabled={multiLinks.length >= 10}
                                            className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <Plus size={14} /> Add Link
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {multiLinks.length === 0 && (
                                            <div className="text-center py-8 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                                                <LinkIcon className="text-slate-200 mb-2" size={32} />
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No links added yet</p>
                                            </div>
                                        )}
                                        {multiLinks.map((link, index) => (
                                            <div key={index} className="bg-slate-50 p-3 md:p-4 rounded-3xl border border-slate-100 relative group animate-in fade-in slide-in-from-top-2">
                                                <button
                                                    onClick={() => removeLinkField(index)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <div className="grid gap-3">
                                                    <input
                                                        type="text"
                                                        value={link.name}
                                                        onChange={(e) => updateLinkField(index, 'name', e.target.value)}
                                                        placeholder="Link Name (e.g. Instagram)"
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 text-sm font-bold"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={link.url}
                                                        onChange={(e) => updateLinkField(index, 'url', e.target.value)}
                                                        placeholder="URL (e.g. instagram.com/user)"
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Custom Logo (Fetched from Invoice if available)</label>
                                    <div className="flex items-center gap-4">
                                        <div className={`relative group cursor-pointer ${logoPreview ? (cropShape === 'round' ? 'w-24' : 'w-fit min-w-[6rem] max-w-[12rem] px-6') : 'w-24'} h-24 border-2 border-dashed border-slate-200 ${cropShape === 'round' ? 'rounded-full' : 'rounded-3xl'} flex items-center justify-center overflow-hidden transition-all hover:border-blue-400 hover:bg-slate-50`}>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                            {logoPreview ? (
                                                <div className="relative w-full h-full flex items-center justify-center group">
                                                    <img src={logoPreview} className="max-w-full max-h-full" alt="Logo preview" />

                                                    {/* Control Overlay */}
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setShowCropModal(true);
                                                            }}
                                                            className="p-2 bg-white text-blue-600 rounded-xl hover:scale-110 transition-transform shadow-lg"
                                                            title="Edit/Crop Logo"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setLogo(null);
                                                                setLogoPreview(null);
                                                                setImageToCrop(null);
                                                            }}
                                                            className="p-2 bg-white text-red-500 rounded-xl hover:scale-110 transition-transform shadow-lg"
                                                            title="Remove Logo"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <PlusCircle size={24} className="mb-1" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Add Logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {logoPreview
                                                    ? "Logo will be displayed at the top of your landing page."
                                                    : "Personalize your QR landing page with your business logo. We've tried to fetch it from your Invoice settings."}
                                            </p>
                                            {!logoPreview && (
                                                <button
                                                    onClick={fetchInvoiceLogo}
                                                    className="mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                                >
                                                    Retry Fetching Logo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

                        {/* Customization */}
                        <div className="grid grid-cols-2 gap-6">
                            <section>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <Palette size={18} className="text-blue-600" />
                                    QR Color
                                </h3>
                                <input
                                    type="color"
                                    value={options.dark}
                                    onChange={(e) => {
                                        setOptions(prev => ({ ...prev, dark: e.target.value }));
                                        setQrDataUrl('');
                                    }}
                                    className="w-full h-12 rounded-xl cursor-pointer border-none p-1 bg-slate-50"
                                />
                            </section>
                            <section>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <Settings2 size={18} className="text-blue-600" />
                                    Size
                                </h3>
                                <select
                                    value={options.width}
                                    onChange={(e) => {
                                        setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }));
                                        setQrDataUrl('');
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold cursor-pointer"
                                >
                                    <option value="200">200x200</option>
                                    <option value="300">300x300</option>
                                    <option value="500">500x500</option>
                                    <option value="1000">1000x1000</option>
                                </select>
                            </section>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={generateQr}
                                disabled={loading || (mode === 'single' ? !url : multiLinks.length === 0)}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-xl shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-lg group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        {editingQrId ? (
                                            <>Save Changes <Save size={20} className="group-hover:scale-110 transition-transform" /></>
                                        ) : (
                                            <>Generate QR <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /></>
                                        )}
                                    </>
                                )}
                            </button>

                            {editingQrId && (
                                <button
                                    onClick={() => {
                                        setEditingQrId(null);
                                        setMultiTitle('');
                                        setMultiLinks([]);
                                        setQrDataUrl('');
                                        setUrl('');
                                        setError('');
                                    }}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex justify-center items-center gap-2 text-sm"
                                >
                                    <PlusIcon size={16} /> Create New Collection
                                </button>
                            )}

                            <AnimatePresence>
                                {successMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-black flex items-center gap-2 border border-green-100"
                                    >
                                        <CheckCircle2 size={18} />
                                        {successMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Panel: Preview & Download */}
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 p-4 md:p-8 flex flex-col items-center sticky top-24">
                        <div className="flex w-full items-center justify-between mb-8">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Preview</label>
                            {mode === 'multi' && (
                                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                    <button
                                        onClick={() => setActiveTab('qr')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'qr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <QrCode size={12} className="inline mr-1" /> QR
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('preview')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Smartphone size={12} className="inline mr-1" /> Page
                                    </button>
                                </div>
                            )}
                        </div>

                        {activeTab === 'qr' ? (
                            <div className="aspect-square w-full max-w-[300px] bg-slate-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group shadow-inner mb-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
                                {qrDataUrl ? (
                                    <img
                                        src={qrDataUrl}
                                        alt="QR Preview"
                                        className="w-full h-full object-contain p-4"
                                    />
                                ) : (
                                    <div className="text-center p-6">
                                        <QrCode size={64} className="text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold">
                                            {mode === 'single' ? 'Enter a URL' : 'Click "Generate QR"'} to see the preview
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full max-w-[280px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative overflow-hidden ring-8 ring-slate-800 mb-8 border-[6px] border-slate-900">
                                {/* iPhone-style notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20"></div>

                                <div className="w-full h-full bg-slate-50 rounded-[2.2rem] overflow-y-auto custom-scrollbar p-4 md:p-6 pt-8 md:pt-10 flex flex-col items-center">
                                    {logoPreview ? (
                                        <div className={`w-16 h-16 bg-white ${cropShape === 'round' ? 'rounded-full' : 'rounded-2xl'} flex items-center justify-center mb-4 shadow-md border border-gray-100 overflow-hidden p-1`}>
                                            <img src={logoPreview} className="max-w-full max-h-full object-contain" alt="Preview logo" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                            <span className="text-white text-2xl font-black italic">N</span>
                                        </div>
                                    )}
                                    <h4 className="text-sm font-black text-slate-900 mb-1 text-center min-h-[1.25rem]">
                                        {multiTitle || 'My Shared Links'}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mb-6">Click any link below</p>

                                    <div className="w-full space-y-3">
                                        {multiLinks.length > 0 ? (
                                            multiLinks.map((link, i) => (
                                                <div key={i} className="w-full p-2 md:p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                                    <span className="text-[10px] font-black text-slate-800 truncate pr-2">{link.name || 'Untitled Link'}</span>
                                                    <ExternalLink size={10} className="text-slate-300" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 opacity-20">
                                                <Plus size={32} className="mx-auto mb-2 text-slate-400" />
                                                <p className="text-[10px] uppercase font-black">No Links Yet</p>
                                            </div>
                                        )}
                                    </div>

                                    <footer className="mt-auto pt-8 flex flex-col items-center">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Powered by</p>
                                        <p className="text-[10px] font-black text-blue-600 italic">N.A.I.R SOLUTIONS</p>
                                    </footer>
                                </div>
                            </div>
                        )}

                        <div className="w-full space-y-4">
                            <h3 className="font-bold text-gray-900 text-center mb-4">Download QR Code</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleDownload('png')}
                                    disabled={!qrDataUrl || downloadLoading}
                                    className="flex-1 py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Download size={18} /> PNG
                                </button>
                                <button
                                    onClick={() => handleDownload('svg')}
                                    disabled={!qrDataUrl || downloadLoading}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Download size={18} /> SVG
                                </button>
                            </div>
                            {!isLoggedIn && qrDataUrl && (
                                <p className="text-xs text-center text-amber-600 font-bold bg-amber-50 py-2 rounded-lg border border-amber-100">
                                    Login required to download
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* My QRs Section */}
                {isLoggedIn && (
                    <div className="mt-20">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-2xl font-black text-gray-900 uppercase">My Multi-Link <span className="text-blue-600">QRs</span></h2>
                            <div className="h-px flex-1 bg-gray-200"></div>
                        </div>

                        {fetchLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : myQRs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myQRs.map((qr) => (
                                    <div key={qr._id} className="bg-white rounded-[32px] p-4 md:p-6 shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col group animate-in fade-in zoom-in-95 duration-500">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-gray-900 line-clamp-1">{qr.title || 'Untitled Collection'}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{qr.links.length} Links • {qr.scanCount} Scans</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQR(qr._id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete QR"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{qr.shortId}</span>
                                            <button
                                                onClick={() => {
                                                    setMode('multi');
                                                    setMultiTitle(qr.title || '');
                                                    setMultiLinks(qr.links.map(l => ({ name: l.name, url: l.url })));
                                                    setLogoPreview(qr.logo || null);
                                                    setLogo(qr.logo || null);
                                                    setCropShape(qr.logoShape || 'rect');
                                                    setEditingQrId(qr._id);
                                                    const qrUrl = `${window.location.origin}/q/${qr.shortId}`;
                                                    setUrl(qrUrl);
                                                    generateQrImageData(qrUrl);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
                                            >
                                                Edit / View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-[40px] py-12 text-center">
                                <List className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-400 font-bold text-lg">You haven't created any multi-link QRs yet.</p>
                                <p className="text-gray-400 text-sm">Created codes will appear here for management.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'Unlimited Codes', desc: 'Generate as many QR codes as you need for free.' },
                        { title: 'High Quality', desc: 'Download in PNG or SVG formats for print or web.' },
                        { title: 'Customizable', desc: 'Change colors and sizes to match your brand.' }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
            <AddLinkModal
                isOpen={showAddLinkModal}
                onClose={() => setShowAddLinkModal(false)}
                onAdd={handleAddLink}
            />
            <CropModal
                isOpen={showCropModal}
                image={imageToCrop}
                shape={cropShape}
                onClose={() => setShowCropModal(false)}
                onCropComplete={(croppedData) => {
                    setLogoPreview(croppedData);
                    setLogo(croppedData);
                    setShowCropModal(false);
                }}
                onShapeChange={setCropShape}
            />
        </div>
    );
};

const AddLinkModal = ({ isOpen, onClose, onAdd }) => {
    const [linkData, setLinkData] = useState({ name: '', url: '' });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!linkData.name || !linkData.url) {
            alert('Please fill both fields');
            return;
        }
        onAdd(linkData);
        setLinkData({ name: '', url: '' });
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900">Add New Link</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link Display Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. My Portfolio"
                                    autoFocus
                                    value={linkData.name}
                                    onChange={(e) => setLinkData({ ...linkData, name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination URL</label>
                                <input
                                    type="text"
                                    placeholder="e.g. example.com"
                                    value={linkData.url}
                                    onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Plus size={18} />
                                    Add Link
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const CropModal = ({ isOpen, image, shape, onClose, onCropComplete, onShapeChange }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => setCrop(crop);
    const onZoomChange = (zoom) => setZoom(zoom);

    const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, shape === 'round');
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
            alert('Failed to crop image');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 uppercase">Crop Your Logo</h2>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            <button
                                onClick={() => onShapeChange('rect')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${shape === 'rect' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Square
                            </button>
                            <button
                                onClick={() => onShapeChange('round')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${shape === 'round' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Circle
                            </button>
                        </div>
                    </div>

                    <div className="relative h-[400px] w-full bg-slate-900">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape={shape === 'round' ? 'round' : 'rect'}
                            showGrid={false}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteInternal}
                            onZoomChange={onZoomChange}
                        />
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zoom Level</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> Apply & Save Logo
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const getCroppedImg = async (imageSrc, pixelCrop, isRound) => {
    const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (error) => reject(error));
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    if (isRound) {
        ctx.beginPath();
        ctx.arc(
            pixelCrop.width / 2,
            pixelCrop.height / 2,
            pixelCrop.width / 2,
            0,
            2 * Math.PI
        );
        ctx.clip();
    }

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/png');
};

export default QrGenerator;
