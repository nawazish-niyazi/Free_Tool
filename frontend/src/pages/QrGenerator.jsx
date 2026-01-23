import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { QrCode, Download, Link as LinkIcon, RefreshCw, Loader2, Settings2, Palette, Plus, Trash2, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const QrGenerator = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
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
    const [multiLinks, setMultiLinks] = useState([{ name: '', url: '' }]);
    const [multiTitle, setMultiTitle] = useState('');
    const [myQRs, setMyQRs] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(false);

    const fetchMyQRs = async () => {
        if (!isLoggedIn) return;
        setFetchLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/qr/my-multi-qrs');
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
    }, [isLoggedIn]);

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
                const res = await axios.post('http://localhost:5000/api/qr/generate', {
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
                // 1. Create the multi-link record
                const multiRes = await axios.post('http://localhost:5000/api/qr/multi', {
                    title: multiTitle,
                    links: validLinks
                });

                if (multiRes.data.success) {
                    const landingPageUrl = multiRes.data.url;

                    // 2. Generate QR for the landing page URL
                    const qrRes = await axios.post('http://localhost:5000/api/qr/generate', {
                        url: landingPageUrl,
                        options
                    });

                    if (qrRes.data.success) {
                        setQrDataUrl(qrRes.data.qrDataUrl);
                        // Update the 'url' state so download works correctly
                        setUrl(landingPageUrl);
                        fetchMyQRs(); // Refresh the list
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to create multi-link QR');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteQR = async (id) => {
        if (!window.confirm('Are you sure you want to delete this QR? This will make the links inaccessible.')) return;

        try {
            const res = await axios.delete(`http://localhost:5000/api/qr/multi/${id}`);
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
            setMultiLinks([...multiLinks, { name: '', url: '' }]);
        }
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
            const response = await axios.post('http://localhost:5000/api/qr/download', {
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

            <div className="max-w-5xl mx-auto px-6 py-12">
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
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 p-8 space-y-8">
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
                                        {multiLinks.map((link, index) => (
                                            <div key={index} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 relative group animate-in fade-in slide-in-from-top-2">
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

                        <button
                            onClick={generateQr}
                            disabled={loading || (mode === 'single' ? !url : multiLinks.filter(l => l.name && l.url).length === 0)}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-xl shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-lg group"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <>Generate QR <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /></>}
                        </button>
                    </div>

                    {/* Right Panel: Preview & Download */}
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 p-8 flex flex-col items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6 self-start">Live Preview</label>

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
                                    <p className="text-gray-400 font-bold">Enter a URL to see the QR code</p>
                                </div>
                            )}
                        </div>

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
                                    <div key={qr._id} className="bg-white rounded-[32px] p-6 shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col group animate-in fade-in zoom-in-95 duration-500">
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
                                                    setUrl(`${window.location.origin}/q/${qr.shortId}`);
                                                    // Trigger QR generation for preview manually if needed, or just let user click generate
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
        </div>
    );
};

export default QrGenerator;
