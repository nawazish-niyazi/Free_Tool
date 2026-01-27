import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Draggable from 'react-draggable';
import { useDropzone } from 'react-dropzone';
import { Settings, PenTool, Download, X, UploadCloud, Type, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import ProcessingOverlay from '../components/ProcessingOverlay';

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
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/esign/upload`, formData);
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

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/esign/sign`, payload);
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
            const response = await axios.get(`${import.meta.env.VITE_API_URL.replace('/api', '')}${downloadUrl}`, {
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
            <div className="p-8 flex flex-col items-center flex-1 w-full relative">
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
                            <h3 className="font-semibold text-gray-800 border-b pb-2 text-sm uppercase tracking-wider">Tools</h3>
                            <button onClick={() => setIsModalOpen(true)} className={`${BUTTON_CLASS} w-full justify-center shadow-md py-3 rounded-xl`}>
                                <PenTool size={18} /> Add Signature
                            </button>

                            <div className="flex-1 mt-4 border-t pt-4 overflow-auto custom-scrollbar">
                                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wider">Signatures</h3>
                                {signatures.length === 0 && <p className="text-xs text-gray-400 italic">No signatures added yet.</p>}
                                {signatures.map((sig, i) => (
                                    <div key={sig.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg mb-2 border border-gray-200">
                                        <span className="font-bold">Sig #{i + 1}</span>
                                        <button onClick={() => removeSignature(sig.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 mt-auto space-y-4">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Pages</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">{numPages || '-'}</span>
                                </div>
                                <button onClick={handleFinish} disabled={signing} className={`${BUTTON_CLASS} w-full justify-center bg-green-600 hover:bg-green-700 shadow-md disabled:opacity-50 py-3 rounded-xl`}>
                                    {signing ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                    Finish & Sign
                                </button>
                                <button onClick={() => setFile(null)} className="w-full text-red-500 text-sm hover:underline text-center font-bold">
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-200/50 rounded-xl p-8 h-full flex justify-center overflow-auto relative border border-gray-300 shadow-inner custom-scrollbar">
                            <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="shadow-2xl"
                                loading={
                                    <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                                        <Loader2 className="animate-spin mb-4" size={40} />
                                        <p className="font-bold uppercase tracking-widest text-xs">Loading PDF View...</p>
                                    </div>
                                }
                            >
                                {numPages && Array.from(new Array(numPages), (el, index) => {
                                    const dims = pageDimensions[index];
                                    return (
                                        <div key={`page_${index + 1}`} className="relative mb-8 bg-white shadow-md rounded-sm overflow-hidden">
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

            <ProcessingOverlay
                isOpen={signing}
                message="Applying Signatures..."
                submessage="Embedding digital identity and rebuilding PDF structure"
            />
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
                {(activeTab === 'initials' ? initials : fullName) || 'Sample Signature'}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Set Signature Details</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Choose how you want to represent yourself</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                </div>

                <div className="p-8 bg-slate-100/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input type="text" className="w-full px-5 py-3.5 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-normal placeholder:text-slate-300" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Type name..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initials</label>
                        <input type="text" className="w-full px-5 py-3.5 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-normal placeholder:text-slate-300" value={initials} onChange={e => setInitials(e.target.value)} placeholder="Initials..." />
                    </div>
                </div>

                <div className="flex border-b px-8 bg-white gap-8 pt-4">
                    <button onClick={() => { setActiveTab('signature'); setMode('type'); }} className={`pb-4 border-b-4 flex gap-2 items-center text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'signature' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><PenTool size={16} /> Signature</button>
                    <button onClick={() => { setActiveTab('initials'); setMode('type'); }} className={`pb-4 border-b-4 flex gap-2 items-center text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'initials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><Type size={16} /> Initials</button>
                    <button onClick={() => { setActiveTab('stamp'); setMode('upload'); }} className={`pb-4 border-b-4 flex gap-2 items-center text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stamp' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Company Stamp</button>
                </div>

                <div className="flex flex-1 min-h-[400px]">
                    <div className="w-20 border-r flex flex-col items-center py-6 gap-6 bg-slate-50/50">
                        <button onClick={() => setMode('type')} title="Type" className={`p-3 rounded-2xl transition-all ${mode === 'type' ? 'bg-white shadow-xl text-blue-600 scale-110' : 'text-slate-400 hover:text-blue-400'}`}><Type size={24} /></button>
                        <button onClick={() => setMode('draw')} title="Draw" className={`p-3 rounded-2xl transition-all ${mode === 'draw' ? 'bg-white shadow-xl text-blue-600 scale-110' : 'text-slate-400 hover:text-blue-400'}`}><PenTool size={24} /></button>
                        <button onClick={() => setMode('upload')} title="Upload" className={`p-3 rounded-2xl transition-all ${mode === 'upload' ? 'bg-white shadow-xl text-blue-600 scale-110' : 'text-slate-400 hover:text-blue-400'}`}><UploadCloud size={24} /></button>
                    </div>

                    <div className="flex-1 p-10 flex flex-col bg-slate-50/30">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {mode === 'type' && <div className="space-y-4 pr-4">{fonts.map(f => renderPreview(f.name))}</div>}
                            {mode === 'draw' && (
                                <div className="bg-white border-2 border-dashed border-slate-200 h-72 rounded-[32px] relative group overflow-hidden shadow-inner">
                                    <canvas ref={canvasRef} width={600} height={280} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                                    <button onClick={() => canvasRef.current.getContext('2d').clearRect(0, 0, 600, 280)} className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-xl transition-all">Clear Board</button>
                                </div>
                            )}
                            {mode === 'upload' && (
                                <div className="bg-white border-2 border-dashed border-slate-200 h-72 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                                    {!uploadedImage ? (
                                        <label className="cursor-pointer group flex flex-col items-center">
                                            <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl mb-4 group-hover:scale-110 transition-transform"><UploadCloud size={32} /></div>
                                            <span className="text-sm font-bold text-slate-500">Select Image Signature</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target.result); r.readAsDataURL(f); } }} />
                                        </label>
                                    ) : (
                                        <>
                                            <img src={uploadedImage} className="max-h-full max-w-full object-contain p-8" alt="Signature preview" />
                                            <button onClick={() => setUploadedImage(null)} className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"><X size={18} /></button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ink Color</span>
                                <div className="flex gap-3">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedColor(c)}
                                            className={`w-8 h-8 rounded-full border-4 border-white shadow-md transition-all ${selectedColor === c ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleApply}
                                className="px-12 py-4 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all uppercase tracking-widest text-sm"
                            >
                                Apply Signature
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
