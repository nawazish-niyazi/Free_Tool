/**
 * PDF Tools Page
 * This page handles most of the PDF tasks like Converting, Compressing, and Locking.
 * It's a "dynamic" page, meaning it changes its look based on which tool you clicked.
 */

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import ToolCard from '../components/ToolCard';
import api from '../api/axios';
import { FileDown, Loader2, Settings2, FileText, Layers, FileType, Zap, Lock, Unlock, Droplets, Eraser } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProcessingOverlay from '../components/ProcessingOverlay';

const PdfTools = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    // 1. Check the URL to see which 'mode' we are in (e.g., compress, protect, etc.)
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');

    // Helper flags to check the current mode
    const isCompressMode = mode === 'compress';
    const isFromPdfMode = mode === 'from-pdf';
    const isToPdfMode = mode === 'to-pdf';
    const isProtectMode = mode === 'protect';
    const isUnlockMode = mode === 'unlock';

    // State: These variables store the data for the page
    const [file, setFile] = useState(null); // The file the user picked
    const [loading, setLoading] = useState(false); // If the file is being processed
    const [processedFilename, setProcessedFilename] = useState(null); // The filename returned by server
    const [compressionLevel, setCompressionLevel] = useState('ebook'); // Chosen compression quality
    const [targetFormat, setTargetFormat] = useState('docx'); // Chosen output format (like Word)
    const [password, setPassword] = useState(''); // Password for locking/unlocking

    // List of PDF Tools for the menu (shown if no mode is selected)
    const pdfToolsList = [
        {
            title: 'Convert to PDF',
            description: 'Convert Word, Excel, PowerPoint, and Images to PDF.',
            icon: FileText,
            to: '/pdf-tools?mode=to-pdf',
            color: 'bg-indigo-50/50 hover:bg-indigo-50'
        },
        {
            title: 'Compress PDF',
            description: 'Reduce PDF file size while maintaining quality.',
            icon: Layers,
            to: '/pdf-tools?mode=compress',
            color: 'bg-rose-50/50 hover:bg-rose-50'
        },
        {
            title: 'Convert from PDF',
            description: 'Convert PDF to Word, Excel, PowerPoint, and Images.',
            icon: FileType,
            to: '/pdf-tools?mode=from-pdf',
            color: 'bg-blue-50/50 hover:bg-blue-50'
        },
        {
            title: 'Protect PDF',
            description: 'Encrypt your PDF with a password.',
            icon: Lock,
            to: '/pdf-tools?mode=protect',
            color: 'bg-green-50/50 hover:bg-green-50'
        },
        {
            title: 'Unlock PDF',
            description: 'Remove password protection from PDF.',
            icon: Unlock,
            to: '/pdf-tools?mode=unlock',
            color: 'bg-red-50/50 hover:bg-red-50'
        },
        {
            title: 'Add Watermark',
            description: 'Add text or image watermarks to your PDF.',
            icon: Droplets,
            to: '/watermark',
            color: 'bg-purple-50/50 hover:bg-purple-50'
        },
        {
            title: 'Remove Watermark',
            description: 'Attempt to remove watermarks from PDF.',
            icon: Eraser,
            to: '/remove-watermark',
            color: 'bg-orange-50/50 hover:bg-orange-50'
        },
        {
            title: 'Sign PDF',
            description: 'Sign documents electronically.',
            icon: Zap,
            to: '/esign',
            color: 'bg-amber-50/50 hover:bg-amber-50'
        }
    ];

    // If no mode is selected, show the tools menu
    if (!mode) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-3 md:px-6 py-8 md:py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Tools</h1>
                        <p className="text-lg text-gray-600">All the tools you need to work with PDF files.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pdfToolsList.map((tool, index) => (
                            <ToolCard key={index} {...tool} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Determine the page title based on the mode
    const title = isCompressMode ? 'Compress PDF' :
        isFromPdfMode ? 'Convert from PDF' :
            isProtectMode ? 'Protect PDF' :
                isUnlockMode ? 'Unlock PDF' : 'Convert to PDF';

    // Helper: Suggests a filename for the download
    const getDownloadName = () => {
        if (!file?.name) return 'document.pdf';
        const base = file.name.split('.')[0];
        if (isCompressMode) return `compressed-${file.name}`;
        if (isFromPdfMode) return `converted-${base}.${targetFormat}`;
        if (isProtectMode) return `protected-${file.name}`;
        if (isUnlockMode) return `unlocked-${file.name}`;
        return `converted-${base}.pdf`;
    };

    // Helper: Changes button text based on mode
    const getButtonText = () => {
        if (loading) return 'Processing...';
        if (isCompressMode) return 'Compress PDF';
        if (isProtectMode) return 'Protect PDF';
        if (isUnlockMode) return 'Unlock PDF';
        return 'Convert Now';
    };

    /**
     * CORE ACTION: The Upload/Process Function
     * Guests CAN process files now.
     */
    const handleUpload = async () => {
        if (!file) return;

        // Check for password if it's required
        if ((isProtectMode || isUnlockMode) && !password) {
            alert("Please enter a password");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            let response;
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (isCompressMode) {
                formData.append('level', compressionLevel);
                response = await api.post('/pdf/compress', formData, config);
            } else if (isFromPdfMode) {
                formData.append('format', targetFormat);
                response = await api.post('/pdf/convert-from-pdf', formData, config);
            } else if (isProtectMode) {
                formData.append('password', password);
                response = await api.post('/pdf/protect', formData, config);
            } else if (isUnlockMode) {
                formData.append('password', password);
                response = await api.post('/pdf/unlock', formData, config);
            } else {
                response = await api.post('/pdf/convert-to-pdf', formData, config);
            }

            if (response.data.success) {
                setProcessedFilename(response.data.filename);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong during processing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * DOWNLOAD ACTION: Triggered when user clicks "Download File"
     * This checks for authentication!
     */
    const handleDownload = async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        if (!processedFilename) return;

        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/pdf/download/${processedFilename}`, {
                responseType: 'blob'
            });


            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', getDownloadName());
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            if (error.response?.status === 401) {
                setShowAuthModal(true);
            } else {
                alert('Download failed. The file may have expired.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
                <h1 className="text-3xl md:text-4xl font-semibold md:font-bold mb-8 text-gray-900 text-center tracking-tight">
                    {title}
                </h1>

                <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!processedFilename ? (
                        <>
                            {/* The box where users drop their files */}
                            <UploadBox
                                onFileSelect={setFile}
                                selectedFile={file}
                                onClear={() => { setFile(null); setPassword(''); }}
                                supportText={
                                    isCompressMode ? "Supports PDF up to 50MB" :
                                        isFromPdfMode ? "Supports PDF conversion to Word, Excel, JPG, PNG" :
                                            isProtectMode ? "Supports PDF encryption" :
                                                isUnlockMode ? "Supports encrypted PDF" :
                                                    "Supports Word, Excel, PowerPoint, JPG, PNG up to 50MB"
                                }
                                accept={isCompressMode || isFromPdfMode || isProtectMode || isUnlockMode ? { 'application/pdf': ['.pdf'] } : {
                                    'application/*': ['.pdf', '.docx', '.pptx', '.xlsx'],
                                    'image/*': ['.jpg', '.jpeg', '.png']
                                }}
                            />

                            {/* Extra Settings for Compression */}
                            {file && isCompressMode && (
                                <div className="mt-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-4 text-blue-800 font-semibold">
                                        <Settings2 size={20} />
                                        <h3>Compression Settings</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[
                                            { id: 'screen', label: 'Extreme', desc: 'Low quality' },
                                            { id: 'ebook', label: 'Recommended', desc: 'Good quality' },
                                            { id: 'printer', label: 'High Quality', desc: 'Large size' },
                                        ].map((level) => (
                                            <button
                                                key={level.id}
                                                onClick={() => setCompressionLevel(level.id)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${compressionLevel === level.id ? 'border-blue-500 bg-white shadow-sm ring-2 ring-blue-500/10' : 'border-transparent bg-white/50 hover:bg-white hover:border-blue-200'}`}
                                            >
                                                <div className="font-bold text-gray-900">{level.label}</div>
                                                <div className="text-xs text-gray-500 mt-1">{level.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extra Settings for Converting FROM PDF */}
                            {file && isFromPdfMode && (
                                <div className="mt-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-4 text-blue-800 font-semibold">
                                        <Settings2 size={20} />
                                        <h3>Convert PDF to:</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {['docx', 'xlsx', 'jpg', 'png'].map((fmt) => (
                                            <button
                                                key={fmt}
                                                onClick={() => setTargetFormat(fmt)}
                                                className={`p-3 rounded-xl border-2 transition-all text-center uppercase ${targetFormat === fmt ? 'border-blue-500 bg-white shadow-sm ring-2 ring-blue-500/10 text-blue-700' : 'border-transparent bg-white/50 hover:bg-white hover:border-blue-200 text-gray-600'}`}
                                            >
                                                <div className="font-bold text-sm">{fmt}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Password input for Protect/Unlock modes */}
                            {file && (isProtectMode || isUnlockMode) && (
                                <div className="mt-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-4 text-blue-800 font-semibold">
                                        <div className="p-1 bg-blue-200 rounded">
                                            {isProtectMode ? <Lock size={16} /> : <Unlock size={16} />}
                                        </div>
                                        <h3>{isProtectMode ? 'Set Password' : 'Enter Password'}</h3>
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                        placeholder={isProtectMode ? "Enter password to protect PDF" : "Enter password to unlock PDF"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* The Main Action Button */}
                            {file && (
                                <button
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : getButtonText()}
                                </button>
                            )}

                        </>
                    ) : (
                        /* Show the Download section after processing is done */
                        <div className="text-center py-6 md:py-10">
                            <div className="inline-flex p-4 bg-green-100 text-green-600 rounded-full mb-4">
                                <FileDown size={48} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">File Ready!</h3>
                            <button
                                onClick={handleDownload}
                                className="inline-block mt-4 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 w-full"
                            >
                                Download File
                            </button>

                            <button
                                onClick={() => { setProcessedFilename(null); setFile(null); setPassword(''); }}
                                className="block w-full mt-4 text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Convert Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <ProcessingOverlay
                isOpen={loading}
                message={isCompressMode ? "Compressing PDF..." : isProtectMode ? "Securing PDF..." : isUnlockMode ? "Unlocking PDF..." : "Converting File..."}
            />
        </div>
    );
};

export default PdfTools;
