/**
 * Watermark Page
 * This page allows users to add text or images on top of their PDF files (Watermarking).
 */

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import api from '../api/axios';
import { FileDown, Loader2, Type, Image as ImageIcon, Droplet, RotateCw, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProcessingOverlay from '../components/ProcessingOverlay';

const WatermarkPage = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    // State: Variables to store the user's choices
    const [file, setFile] = useState(null); // The PDF file
    const [loading, setLoading] = useState(false); // If it's currently processing
    const [processedFilename, setProcessedFilename] = useState(null); // The final filename

    // Watermark settings
    const [watermarkType, setWatermarkType] = useState('text'); // 'text' or 'image'
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkImage, setWatermarkImage] = useState(null); // The image file for the watermark
    const [opacity, setOpacity] = useState(0.3); // How see-through it is (0 to 1)
    const [rotation, setRotation] = useState(45); // Angle of the watermark
    const [fontSize, setFontSize] = useState(48);
    const [scale, setScale] = useState(0.5); // Default scale
    const [position, setPosition] = useState('center');
    const [pageSelection, setPageSelection] = useState('all'); // Which pages to mark
    const [selectedPages, setSelectedPages] = useState('');

    /**
     * CORE ACTION: Apply Watermark
     * Guests CAN process files now.
     */
    const handleApplyWatermark = async () => {
        if (!file) return;

        // Basic validation
        if (watermarkType === 'text' && !watermarkText) {
            alert('Please enter watermark text');
            return;
        }
        if (watermarkType === 'image' && !watermarkImage) {
            alert('Please upload a watermark image');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('type', watermarkType);
        formData.append('text', watermarkText);
        formData.append('opacity', opacity);
        formData.append('rotation', rotation);
        formData.append('fontSize', fontSize);
        formData.append('scale', scale);
        formData.append('position', position);

        if (pageSelection === 'all') {
            formData.append('pageNumbers', 'all');
        } else {
            const pages = selectedPages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
            formData.append('pageNumbers', JSON.stringify(pages));
        }

        formData.append('color', JSON.stringify({ r: 0.5, g: 0.5, b: 0.5 }));
        formData.append('file', file);
        if (watermarkType === 'image' && watermarkImage) {
            formData.append('watermarkImage', watermarkImage);
        }

        try {
            const response = await api.post('/pdf/watermark', formData);
            if (response.data.success) {
                setProcessedFilename(response.data.filename);
            }
        } catch (error) {
            console.error(error);
            alert('Error adding watermark. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * DOWNLOAD ACTION
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
            link.setAttribute('download', `watermarked_${file.name}`);
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
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
                <h1 className="text-3xl md:text-4xl font-semibold md:font-bold mb-8 text-gray-900 text-center tracking-tight">Add Watermark to PDF</h1>

                <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!processedFilename ? (
                        <>
                            {/* Upload Area */}
                            <UploadBox
                                onFileSelect={setFile}
                                selectedFile={file}
                                onClear={() => setFile(null)}
                                supportText="Upload PDF to add watermark"
                                accept={{ 'application/pdf': ['.pdf'] }}
                            />

                            {/* Show settings only after a file is picked */}
                            {file && (
                                <div className="mt-8 space-y-6">
                                    {/* Select Type: Text or Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Watermark Type</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setWatermarkType('text')}
                                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${watermarkType === 'text' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}
                                            >
                                                <Type size={20} />
                                                <span className="font-semibold">Text Watermark</span>
                                            </button>
                                            <button
                                                onClick={() => setWatermarkType('image')}
                                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${watermarkType === 'image' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}
                                            >
                                                <ImageIcon size={20} />
                                                <span className="font-semibold">Image Watermark</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Text Input */}
                                    {watermarkType === 'text' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Watermark Text</label>
                                            <input
                                                type="text"
                                                value={watermarkText}
                                                onChange={(e) => setWatermarkText(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                placeholder="Enter watermark text"
                                            />
                                        </div>
                                    )}

                                    {/* Image Input */}
                                    {watermarkType === 'image' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Watermark Image</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setWatermarkImage(e.target.files[0])}
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Settings: sliders for Opacity and Rotation */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Opacity: {Math.round(opacity * 100)}%</label>
                                            <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rotation: {rotation}°</label>
                                            <input type="range" min="0" max="360" step="15" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <Maximize2 size={16} />
                                                Scale: {Math.round(scale * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="3.0"
                                                step="0.1"
                                                value={scale}
                                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                                            <select
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                                            >
                                                <option value="center">Center</option>
                                                <option value="top-left">Top Left</option>
                                                <option value="top-right">Top Right</option>
                                                <option value="bottom-left">Bottom Left</option>
                                                <option value="bottom-right">Bottom Right</option>
                                                <option value="top-center">Top Center</option>
                                                <option value="bottom-center">Bottom Center</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Main Button */}
                                    <button
                                        onClick={handleApplyWatermark}
                                        disabled={loading}
                                        className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Add Watermark'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Download Link section */
                        <div className="text-center py-10">
                            <div className="inline-flex p-4 bg-green-100 text-green-600 rounded-full mb-4">
                                <FileDown size={48} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Watermark Added!</h3>
                            <button
                                onClick={handleDownload}
                                className="inline-block mt-4 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 w-full"
                            >
                                Download Watermarked PDF
                            </button>

                            <button
                                onClick={() => { setProcessedFilename(null); setFile(null); }}
                                className="block w-full mt-4 text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Add Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <ProcessingOverlay
                isOpen={loading}
                message="Adding Watermark..."
                submessage="Embedding digital overlay on each page"
            />
        </div>
    );
};

export default WatermarkPage;
