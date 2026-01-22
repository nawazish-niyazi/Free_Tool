import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Draggable from 'react-draggable';
import { useDropzone } from 'react-dropzone';
import { Settings, PenTool, Download, X, UploadCloud, Type, Trash2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BUTTON_CLASS = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2";

const DraggableSignature = ({ sig, containerDimensions, onUpdate, onRemove }) => {
    const nodeRef = useRef(null);
    const { width: containerWidth, height: containerHeight } = containerDimensions;
    const [isResizing, setIsResizing] = useState(false);

    const defaultPos = {
        x: sig.x * containerWidth,
        y: sig.y * containerHeight
    };

    const handleStop = (e, data) => {
        if (isResizing) return;
        const newX = data.x / containerWidth;
        const newY = data.y / containerHeight;
        onUpdate(sig.id, { x: newX, y: newY });
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = sig.width * containerWidth;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidthPx = Math.max(50, startWidth + deltaX);
            const newWidthPercent = newWidthPx / containerWidth;
            onUpdate(sig.id, { width: newWidthPercent });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            defaultPosition={defaultPos}
            onStop={handleStop}
            disabled={isResizing}
            cancel=".resize-handle"
        >
            <div
                ref={nodeRef}
                className="absolute group border border-transparent hover:border-blue-500 transition-colors"
                style={{
                    width: `${sig.width * 100}%`,
                    top: 0,
                    left: 0,
                    position: 'absolute'
                }}
            >
                <div className="relative w-full">
                    <img
                        src={sig.data}
                        alt="Signature"
                        className="w-full h-auto pointer-events-none select-none block"
                        draggable={false}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(sig.id);
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm z-50 hover:bg-red-600"
                        title="Remove"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={12} />
                    </button>
                    <div
                        className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 z-50"
                        onMouseDown={handleResizeStart}
                    />
                </div>
            </div>
        </Draggable>
    );
};

export default function ESignPage() {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    const [file, setFile] = useState(null);
    const [serverFilename, setServerFilename] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageDimensions, setPageDimensions] = useState({});
    const [signatures, setSignatures] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [signing, setSigning] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const onDrop = async (acceptedFiles) => {
        const uploadedFile = acceptedFiles[0];
        if (uploadedFile && uploadedFile.type === 'application/pdf') {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            try {
                const res = await axios.post('http://localhost:5000/api/esign/upload', formData);
                setFile(uploadedFile);
                setServerFilename(res.data.file.filename);
                setSignatures([]);
                setDownloadUrl(null);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Upload failed. Ensure backend is running.");
            }
        }
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

    const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

    const onPageLoadSuccess = (page, index) => {
        setPageDimensions(prev => ({ ...prev, [index]: { width: page.width, height: page.height } }));
    };

    const handleAddSignature = (data) => {
        const newSig = {
            id: Date.now(),
            pageIndex: 0,
            x: 0.35,
            y: 0.4,
            width: 0.3,
            height: 0.1,
            data: data
        };
        setSignatures(prev => [...prev, newSig]);
        setIsModalOpen(false);
    };

    const handleUpdateSignature = (id, newPos) => {
        setSignatures(prev => prev.map(sig => sig.id === id ? { ...sig, ...newPos } : sig));
    };

    const removeSignature = (id) => setSignatures(prev => prev.filter(s => s.id !== id));

    const handleFinish = async () => {
        if (!serverFilename) return;
        setSigning(true);
        try {
            const payload = {
                filename: serverFilename,
                signatures: signatures.map(s => ({
                    pageIndex: s.pageIndex,
                    x: s.x,
                    y: s.y,
                    width: s.width,
                    height: s.height,
                    imageData: s.data
                }))
            };

            const res = await axios.post('http://localhost:5000/api/esign/sign', payload);
            if (res.data.success) {
                setDownloadUrl(res.data.downloadUrl);
            }
        } catch (err) {
            console.error(err);
            alert("Signing failed");
        } finally {
            setSigning(false);
        }
    };

    const handleDownload = async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000${downloadUrl}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `signed_${serverFilename}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Download failed. File might have expired.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />
            <div className="p-8 flex flex-col items-center flex-1 w-full">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                    Electronic Signature
                </h1>

                {!file ? (
                    <div {...getRootProps()} className="w-full max-w-2xl h-64 border-2 border-dashed border-gray-300 rounded-xl bg-white flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition shadow-sm">
                        <input {...getInputProps()} />
                        <div className="p-4 bg-blue-50 rounded-full mb-4">
                            <UploadCloud className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-700">Drop your PDF here</p>
                        <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                    </div>
                ) : downloadUrl ? (
                    <div className="w-full max-w-2xl bg-white p-12 rounded-[40px] shadow-xl text-center border border-gray-100">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Document Ready!</h2>
                        <p className="text-gray-500 mb-8 font-medium">Your document has been electronically signed and is ready for download.</p>

                        <button
                            onClick={handleDownload}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 mb-4"
                        >
                            <Download size={20} />
                            Download Signed PDF
                        </button>

                        <button
                            onClick={() => { setFile(null); setDownloadUrl(null); }}
                            className="text-gray-400 font-bold hover:text-gray-600 transition-colors"
                        >
                            Sign Another Document
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-7xl flex gap-6 items-start h-[calc(100vh-200px)]">
                        <div className="w-64 bg-white p-6 rounded-xl shadow-lg space-y-4 h-full flex flex-col border border-gray-100">
                            <h3 className="font-semibold text-gray-800">Tools</h3>
                            <button onClick={() => setIsModalOpen(true)} className={`${BUTTON_CLASS} w-full justify-center shadow-md`}>
                                <PenTool size={18} /> Add Signature
                            </button>

                            <div className="flex-1 mt-4 border-t pt-4 overflow-auto">
                                <h3 className="font-semibold text-gray-800 mb-2">Signatures</h3>
                                {signatures.length === 0 && <p className="text-xs text-gray-400 italic">No signatures added yet.</p>}
                                {signatures.map((sig, i) => (
                                    <div key={sig.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded mb-2 border">
                                        <span>Sig #{i + 1}</span>
                                        <button onClick={() => removeSignature(sig.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 mt-auto">
                                <p className="text-sm text-gray-600 mb-2">Pages: {numPages || '-'}</p>
                                <button onClick={handleFinish} disabled={signing} className={`${BUTTON_CLASS} w-full justify-center bg-green-600 hover:bg-green-700 shadow-md disabled:opacity-50`}>
                                    {signing ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                    Finish & Sign
                                </button>
                                <button onClick={() => setFile(null)} className="w-full text-red-500 text-sm mt-4 hover:underline text-center">
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-200/50 rounded-xl p-8 h-full flex justify-center overflow-auto relative border border-gray-300 shadow-inner">
                            <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="shadow-2xl"
                                loading={<div className="text-center p-4">Loading PDF...</div>}
                            >
                                {numPages && Array.from(new Array(numPages), (el, index) => {
                                    const dims = pageDimensions[index];
                                    return (
                                        <div key={`page_${index + 1}`} className="relative mb-8 bg-white shadow-md">
                                            <Page
                                                pageNumber={index + 1}
                                                width={800}
                                                onLoadSuccess={(page) => onPageLoadSuccess(page, index)}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                            {dims && (
                                                <div className="absolute inset-0">
                                                    {signatures.filter(s => s.pageIndex === index).map(sig => (
                                                        <DraggableSignature
                                                            key={sig.id}
                                                            sig={sig}
                                                            containerDimensions={dims}
                                                            onUpdate={handleUpdateSignature}
                                                            onRemove={removeSignature}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </Document>
                        </div>
                    </div>
                )}

                {isModalOpen && (
                    <SignatureModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleAddSignature}
                    />
                )}
            </div>
        </div>
    );
}

const SignatureModal = ({ onClose, onSave }) => {
    const canvasRef = useRef(null);
    const [fullName, setFullName] = useState('');
    const [initials, setInitials] = useState('');
    const [activeTab, setActiveTab] = useState('signature');
    const [mode, setMode] = useState('type');
    const [selectedFont, setSelectedFont] = useState('Dancing Script');
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const fonts = [
        { name: 'Dancing Script', label: 'Dancing Script' },
        { name: 'Great Vibes', label: 'Great Vibes' },
        { name: 'Sacramento', label: 'Sacramento' },
        { name: 'Parisienne', label: 'Parisienne' },
        { name: 'Allura', label: 'Allura' },
    ];

    const colors = ['#000000', '#EF4444', '#3B82F6', '#22C55E'];

    const startDrawing = (e) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.strokeStyle = selectedColor;
        setIsDrawing(true);
    };
    const draw = (e) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };
    const stopDrawing = () => setIsDrawing(false);

    const handleApply = () => {
        if (mode === 'type') {
            const textToRender = activeTab === 'initials' ? initials : fullName;
            if (!textToRender.trim()) return alert("Please enter a name");
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            ctx.font = `60px "${selectedFont}"`;
            const measure = ctx.measureText(textToRender);
            tempCanvas.width = Math.max(measure.width + 40, 200);
            tempCanvas.height = 120;
            ctx.font = `60px "${selectedFont}"`;
            ctx.fillStyle = selectedColor;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(textToRender, tempCanvas.width / 2, tempCanvas.height / 2);
            onSave(tempCanvas.toDataURL());
        } else if (mode === 'draw') {
            onSave(canvasRef.current.toDataURL());
        } else if (mode === 'upload' && uploadedImage) {
            onSave(uploadedImage);
        }
    };

    const renderPreview = (fontName) => (
        <div
            key={fontName}
            onClick={() => setSelectedFont(fontName)}
            className={`p-4 border rounded-lg flex items-center gap-4 cursor-pointer transition hover:bg-gray-50 ${selectedFont === fontName ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200'}`}
        >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFont === fontName ? 'border-blue-500' : 'border-gray-300'}`}>
                {selectedFont === fontName && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
            </div>
            <span style={{ fontFamily: fontName, color: selectedColor, fontSize: '2rem' }}>
                {(activeTab === 'initials' ? initials : fullName) || 'Sample'}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Set your signature details</h2>
                    <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6 bg-gray-50 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full name:</label>
                        <input type="text" className="w-full p-2 border rounded-md" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Type name" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Initials:</label>
                        <input type="text" className="w-full p-2 border rounded-md" value={initials} onChange={e => setInitials(e.target.value)} placeholder="Type initials" />
                    </div>
                </div>
                <div className="flex border-b px-6 pt-2 gap-4">
                    <button onClick={() => { setActiveTab('signature'); setMode('type'); }} className={`pb-2 border-b-2 flex gap-2 items-center ${activeTab === 'signature' ? 'border-red-500 text-black' : 'border-transparent text-gray-500'}`}><PenTool size={16} /> Signature</button>
                    <button onClick={() => { setActiveTab('initials'); setMode('type'); }} className={`pb-2 border-b-2 flex gap-2 items-center ${activeTab === 'initials' ? 'border-red-500 text-black' : 'border-transparent text-gray-500'}`}><Type size={16} /> Initials</button>
                    <button onClick={() => { setActiveTab('stamp'); setMode('upload'); }} className={`pb-2 border-b-2 flex gap-2 items-center ${activeTab === 'stamp' ? 'border-red-500 text-black' : 'border-transparent text-gray-500'}`}>Company Stamp</button>
                </div>
                <div className="flex flex-1 min-h-[350px]">
                    <div className="w-16 border-r flex flex-col items-center py-4 gap-4 bg-gray-50">
                        <button onClick={() => setMode('type')} className={`p-2 rounded ${mode === 'type' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><Type /></button>
                        <button onClick={() => setMode('draw')} className={`p-2 rounded ${mode === 'draw' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><PenTool /></button>
                        <button onClick={() => setMode('upload')} className={`p-2 rounded ${mode === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><UploadCloud /></button>
                    </div>
                    <div className="flex-1 p-8 flex flex-col">
                        <div className="flex-1 overflow-auto">
                            {mode === 'type' && <div className="space-y-4">{fonts.map(f => renderPreview(f.name))}</div>}
                            {mode === 'draw' && (
                                <div className="border-2 border-dashed h-64 rounded-lg relative bg-white">
                                    <canvas ref={canvasRef} width={600} height={250} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                                    <button onClick={() => canvasRef.current.getContext('2d').clearRect(0, 0, 600, 250)} className="absolute top-2 right-2 text-xs bg-gray-100 border px-2 py-1 rounded">Clear</button>
                                </div>
                            )}
                            {mode === 'upload' && (
                                <div className="border-2 border-dashed h-64 rounded-lg flex flex-col items-center justify-center relative bg-white">
                                    {!uploadedImage ? <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded">Select Image <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target.result); r.readAsDataURL(f); } }} /></label> : <><img src={uploadedImage} className="max-h-full max-w-full object-contain" /><button onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X size={16} /></button></>}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center gap-4">
                            <span>Color:</span>
                            {colors.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full ${selectedColor === c ? 'ring-2 ring-blue-500 scale-110' : ''}`} style={{ backgroundColor: c }} />)}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end">
                    <button onClick={handleApply} className="bg-red-600 text-white px-8 py-2 rounded hover:bg-red-700">Apply</button>
                </div>
            </div>
        </div>
    );
};
