import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { Plus, Trash2, Download, Loader2, Building2, User, Receipt, PlusCircle, AlertCircle, X, Save, Edit, RefreshCcw, Eye, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceHistory from '../components/InvoiceHistory';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { API_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProcessingOverlay from '../components/ProcessingOverlay';

const InvoiceGenerator = () => {
    const { isLoggedIn, user, loading: authLoading, setShowAuthModal } = useAuth();
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const [invoice, setInvoice] = useState({
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'INR',
        notes: '',
        tax: '',
        discount: '',
        paymentMode: '',
        business: {
            name: '',
            address: '',
            email: '',
            phone: ''
        },
        client: {
            name: '',
            address: '',
            email: '',
            phone: ''
        },
        items: [],
        templateId: 'classic' // Default template
    });

    const [totals, setTotals] = useState({
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        grandTotal: 0
    });

    const [showBusinessModal, setShowBusinessModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [businessSaved, setBusinessSaved] = useState(false);

    const dataURLtoFile = (dataurl, filename) => {
        if (!dataurl || !dataurl.includes(',')) return null;
        try {
            let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
        } catch (e) {
            console.error("Error converting logo:", e);
            return null;
        }
    };

    useEffect(() => {
        if (authLoading) return;

        const userSuffix = isLoggedIn && user?.id ? user.id : 'guest';
        const businessKey = `invoice_business_info_${userSuffix}`;
        const skipKey = `invoice_setup_skipped_${userSuffix}`;

        const savedData = localStorage.getItem(businessKey);
        const setupSkipped = localStorage.getItem(skipKey);

        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setInvoice(prev => ({
                ...prev,
                business: {
                    name: parsedData.name || '',
                    address: parsedData.address || '',
                    email: parsedData.email || '',
                    phone: parsedData.phone || '',
                    logo: parsedData.logo || null
                }
            }));
            if (parsedData.logo) {
                setLogoPreview(parsedData.logo);
                const logoFile = dataURLtoFile(parsedData.logo, 'business-logo.png');
                if (logoFile) setLogo(logoFile);
            } else {
                setLogoPreview(null);
                setLogo(null);
            }
            setBusinessSaved(true);
            setShowBusinessModal(false);
        } else {
            // ALWAYS clear on logout or if no data found
            setInvoice({
                invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                currency: 'INR',
                notes: '',
                tax: '',
                discount: '',
                paymentMode: '',
                business: { name: '', address: '', email: '', phone: '' },
                client: { name: '', address: '', email: '', phone: '' },
                items: [],
                templateId: 'classic'
            });
            setLogoPreview(null);
            setLogo(null);
            setBusinessSaved(false);

            if (isLoggedIn && !setupSkipped) {
                setShowBusinessModal(true);
            }
        }
    }, [isLoggedIn, user?.id, authLoading]);


    useEffect(() => {
        calculateTotals();
    }, [invoice.items, invoice.tax, invoice.discount]);

    const saveBusinessPermanently = (data) => {
        const userSuffix = isLoggedIn && user?.id ? user.id : 'guest';
        const businessKey = `invoice_business_info_${userSuffix}`;
        localStorage.setItem(businessKey, JSON.stringify(data));
        setInvoice(prev => ({
            ...prev,
            business: {
                name: data.name,
                address: data.address,
                email: data.email,
                phone: data.phone,
                logo: data.logo
            }
        }));
        if (data.logo) {
            setLogoPreview(data.logo);
            const logoFile = dataURLtoFile(data.logo, 'business-logo.png');
            if (logoFile) setLogo(logoFile);
        }
        setBusinessSaved(true);
        setShowBusinessModal(false);
    };

    const skipBusinessSetup = () => {
        const userSuffix = isLoggedIn && user?.id ? user.id : 'guest';
        const skipKey = `invoice_setup_skipped_${userSuffix}`;
        localStorage.setItem(skipKey, 'true');
        setShowBusinessModal(false);
    };

    const handleResetBusiness = () => {
        if (!window.confirm("Are you sure? This will permanently delete your saved business name, address, and logo from this device.")) return;

        const userSuffix = isLoggedIn && user?.id ? user.id : 'guest';
        const businessKey = `invoice_business_info_${userSuffix}`;
        const skipKey = `invoice_setup_skipped_${userSuffix}`;

        localStorage.removeItem(businessKey);
        localStorage.removeItem(skipKey);

        // Reset state
        setInvoice(prev => ({
            ...prev,
            business: { name: '', address: '', email: '', phone: '' }
        }));
        setLogoPreview(null);
        setLogo(null);
        setBusinessSaved(false);

        alert("Business profile has been reset. You can now set it up again.");
        setShowBusinessModal(true);
    };


    const calculateTotals = () => {
        const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const taxAmount = subtotal * (invoice.tax / 100);
        const discountAmount = subtotal * (invoice.discount / 100);
        const grandTotal = subtotal + taxAmount - discountAmount;

        setTotals({
            subtotal,
            taxAmount,
            discountAmount,
            grandTotal
        });
    };

    const handleInputChange = (section, field, value) => {
        if (section) {
            setInvoice(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        } else {
            setInvoice(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleItemChange = (id, field, value) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const addItemToList = (itemData) => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, { ...itemData, id: Date.now() }]
        }));
        setShowItemModal(false);
    };

    const removeItem = (id) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const clearClientInfo = () => {
        setInvoice(prev => ({
            ...prev,
            client: {
                name: '',
                address: '',
                email: '',
                phone: ''
            }
        }));
    };

    const [imageToCrop, setImageToCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropShape, setCropShape] = useState('rect');

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result);
                setCropShape('rect'); // Default to rect
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedDataUrl) => {
        setLogoPreview(croppedDataUrl);
        const file = dataURLtoFile(croppedDataUrl, 'business-logo.png');
        setLogo(file);
        setShowCropModal(false);
    };


    const checkValidation = () => {
        if (!invoice.client.name || !invoice.client.address || !invoice.client.phone) {
            alert('Please fill in all mandatory client details: Name, Address, and Phone Number.');
            return false;
        }
        if (invoice.items.length === 0 || (invoice.items.length === 1 && !invoice.items[0].description)) {
            alert('Please add at least one product with a name.');
            return false;
        }
        return true;
    };

    const generateInvoice = async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        if (!checkValidation()) return;

        setLoading(true);
        const formData = new FormData();
        if (logo) formData.append('logo', logo);

        // Optimize: Don't send large base64 logo in the JSON data if we are sending it as a file
        const invoiceToUpload = {
            ...invoice,
            business: { ...invoice.business, logo: logo ? undefined : invoice.business.logo }
        };
        formData.append('data', JSON.stringify(invoiceToUpload));

        try {
            const response = await axios.post(`${API_URL}/invoice/generate`, formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Download triggered, no reload needed as it interrupts process on mobile
            alert('Invoice generated successfully! Your download should start automatically.');
        } catch (error) {
            console.error('Error generating invoice:', error);
            if (error.response?.status === 401) {
                setShowAuthModal(true);
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
                alert(`Failed to generate invoice: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        if (!checkValidation()) return;

        setPreviewLoading(true);
        const formData = new FormData();
        if (logo) formData.append('logo', logo);

        // Optimize: Don't send large base64 logo in the JSON data
        const invoiceToUpload = {
            ...invoice,
            business: { ...invoice.business, logo: logo ? undefined : invoice.business.logo }
        };
        formData.append('data', JSON.stringify(invoiceToUpload));

        try {
            const response = await axios.post(`${API_URL}/invoice/generate`, formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            setPreviewUrl(url);
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error previewing invoice:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to generate preview: ${errorMessage}`);
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 md:px-6 py-8 md:py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Invoice Generator</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-slate-500">Create professional PDF invoices in seconds.</p>
                            <button
                                onClick={handleResetBusiness}
                                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                                title="Delete saved business profile"
                            >
                                <RefreshCcw size={10} />
                                Reset Profile
                            </button>
                            <button
                                onClick={() => setShowTemplateModal(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                                title="Change Invoice Design"
                            >
                                <Palette size={10} />
                                Change Template
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <button
                            onClick={handlePreview}
                            disabled={previewLoading || loading}
                            className="flex-1 md:flex-none px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl border-2 border-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {previewLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <Eye size={20} className="group-hover:scale-110 transition-transform" />
                            )}
                            <span>{previewLoading ? 'Loading...' : 'Preview'}</span>
                        </button>

                        <button
                            onClick={generateInvoice}
                            disabled={loading || previewLoading}
                            className="flex-1 md:flex-none px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <Download size={20} className="group-hover:scale-110 transition-transform" />
                            )}
                            <span>{loading ? 'Generating...' : 'Download'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Section */}
                        <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wider">Business Logo</span>
                                        <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-3xl p-3 md:p-4 transition-all hover:bg-slate-50 hover:border-blue-400">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                            {logoPreview ? (
                                                <div className="relative h-24 flex items-center justify-center">
                                                    <img src={logoPreview} className="max-h-full rounded-lg" alt="Logo preview" />
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); setLogo(null); setLogoPreview(null); }}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-24 flex flex-col items-center justify-center text-slate-400">
                                                    <PlusCircle size={24} className="mb-2" />
                                                    <span className="text-xs font-medium">Click to upload logo</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-1 block">Invoice Number</label>
                                            <input
                                                type="text"
                                                value={invoice.invoiceNumber}
                                                onChange={(e) => handleInputChange(null, 'invoiceNumber', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 mb-1 block">Issue Date</label>
                                                <input
                                                    type="date"
                                                    value={invoice.issueDate}
                                                    onChange={(e) => handleInputChange(null, 'issueDate', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 mb-1 block">Due Date</label>
                                                <input
                                                    type="date"
                                                    value={invoice.dueDate}
                                                    onChange={(e) => handleInputChange(null, 'dueDate', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Building2 size={24} />
                                        <h3 className="text-lg font-black tracking-tight uppercase">Your Business</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowBusinessModal(true)}
                                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Edit Business Info"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Business Name"
                                        value={invoice.business.name}
                                        onChange={(e) => handleInputChange('business', 'name', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-normal"
                                    />
                                    <textarea
                                        placeholder="Address"
                                        rows="3"
                                        value={invoice.business.address}
                                        onChange={(e) => handleInputChange('business', 'address', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:font-normal"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={invoice.business.email}
                                            onChange={(e) => handleInputChange('business', 'email', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:font-normal"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Phone"
                                            value={invoice.business.phone}
                                            onChange={(e) => handleInputChange('business', 'phone', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:font-normal"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <User size={24} />
                                        <h3 className="text-lg font-black tracking-tight uppercase">Bill To</h3>
                                    </div>
                                    <button
                                        onClick={clearClientInfo}
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Clear Client Info"
                                    >
                                        <RefreshCcw size={18} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Client Name *"
                                        value={invoice.client.name}
                                        onChange={(e) => handleInputChange('client', 'name', e.target.value)}
                                        autoComplete="off"
                                        className={`w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:font-normal ${!invoice.client.name ? 'border-l-4 border-red-400' : ''}`}
                                    />
                                    <textarea
                                        placeholder="Client Address *"
                                        rows="3"
                                        value={invoice.client.address}
                                        onChange={(e) => handleInputChange('client', 'address', e.target.value)}
                                        autoComplete="off"
                                        className={`w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:font-normal ${!invoice.client.address ? 'border-l-4 border-red-400' : ''}`}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="email"
                                            placeholder="Client Email"
                                            value={invoice.client.email}
                                            onChange={(e) => handleInputChange('client', 'email', e.target.value)}
                                            autoComplete="off"
                                            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:font-normal"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Phone *"
                                            value={invoice.client.phone}
                                            onChange={(e) => handleInputChange('client', 'phone', e.target.value)}
                                            autoComplete="off"
                                            className={`w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:font-normal ${!invoice.client.phone ? 'border-l-4 border-red-400' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                            <div className="p-4 md:p-8 border-b border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Receipt size={24} />
                                    <h3 className="text-lg font-black tracking-tight uppercase">Line Items</h3>
                                </div>
                                <button
                                    onClick={() => setShowItemModal(true)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            <div className="p-4 md:p-8 space-y-4">
                                <AnimatePresence initial={false}>
                                    {invoice.items.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <p className="text-sm font-medium mb-2">No items added yet</p>
                                            <p className="text-xs">Click "Add Item" to start building your invoice</p>
                                        </div>
                                    ) : (
                                        invoice.items.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="group p-4 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all"
                                            >
                                                <div className="flex flex-col gap-4">
                                                    {/* First Line: Product Name and Delete Button */}
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Product Name</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter product name"
                                                                value={item.description}
                                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                                className="w-full p-0 bg-transparent border-0 focus:ring-0 text-lg font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Second Line: Qty, Price, Total */}
                                                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Quantity</label>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                placeholder="1"
                                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                                className="w-full bg-white px-3 py-2 rounded-xl border-0 font-bold text-slate-700 outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.unitPrice}
                                                                    placeholder="0"
                                                                    onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                                    className="w-full bg-white pl-7 pr-3 py-2 rounded-xl border-0 font-bold text-slate-700 outline-none text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total</label>
                                                            <div className="py-2 text-lg font-black text-blue-600">
                                                                ₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Payment Mode */}
                        <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-slate-700 block uppercase tracking-wider">Payment Mode</label>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Optional</span>
                            </div>
                            <div className="relative">
                                <select
                                    value={invoice.paymentMode}
                                    onChange={(e) => handleInputChange(null, 'paymentMode', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium appearance-none cursor-pointer"
                                >
                                    <option value="">Select Payment Mode</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wider">Notes / Payment Terms</label>
                            <textarea
                                rows="3"
                                value={invoice.notes}
                                onChange={(e) => handleInputChange(null, 'notes', e.target.value)}
                                placeholder="Thank you for your business. Please make payment within 7 days."
                                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                            />
                        </div>
                        {/* Invoice history will be rendered below the main grid */}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 text-white p-4 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl shadow-blue-100 sticky top-12">
                            <h3 className="text-lg font-black mb-8 uppercase tracking-widest text-slate-400">Total Summary</h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-slate-400">
                                    <span className="font-bold">Subtotal</span>
                                    <span className="font-black text-white">₹{totals.subtotal.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="font-bold flex items-center gap-1">Tax (%)</span>
                                        <div className="flex items-center gap-2 bg-white rounded-lg px-2 shadow-sm">
                                            <input
                                                type="number"
                                                value={invoice.tax}
                                                placeholder="0"
                                                onChange={(e) => handleInputChange(null, 'tax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                className="w-12 bg-transparent text-slate-900 text-right font-black py-1 outline-none"
                                            />
                                            <span className="text-slate-400 text-xs font-black">%</span>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-slate-500 font-bold">
                                        + ₹{totals.taxAmount.toFixed(2)}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="font-bold flex items-center gap-1">Discount (%)</span>
                                        <div className="flex items-center gap-2 bg-white rounded-lg px-2 shadow-sm">
                                            <input
                                                type="number"
                                                value={invoice.discount}
                                                placeholder="0"
                                                onChange={(e) => handleInputChange(null, 'discount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                className="w-12 bg-transparent text-slate-900 text-right font-black py-1 outline-none"
                                            />
                                            <span className="text-slate-400 text-xs font-black">%</span>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-slate-500 font-bold">
                                        - ₹{totals.discountAmount.toFixed(2)}
                                    </div>
                                </div>



                                <div className="pt-8 border-t border-slate-800">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Grand Total</p>
                                            <p className="text-4xl font-black text-white">₹ {totals.grandTotal.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                            {invoice.currency}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Action Buttons */}
                                <div className="mt-8 flex flex-col gap-3 md:hidden">
                                    <button
                                        onClick={handlePreview}
                                        disabled={previewLoading || loading}
                                        className="group block bg-white hover:bg-blue-600 p-4 md:p-5 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200 flex items-center justify-between"
                                    >
                                        {previewLoading ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />}
                                        Preview
                                    </button>
                                    <button
                                        onClick={generateInvoice}
                                        disabled={loading || previewLoading}
                                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                        Download PDF
                                    </button>
                                </div>
                            </div>

                            <div className="mt-12 flex items-start gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                    Calculations are strictly validated on the backend. No storage fees.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full-width Invoice History Section */}
                <div className="mt-12">
                    <InvoiceHistory />
                </div>
            </div>

            <ProcessingOverlay
                isOpen={loading || previewLoading}
                message={loading ? "Generating Safe PDF..." : "Preparing Live Preview..."}
                submessage="Our engine is compiling your invoice data"
            />

            <BusinessModal
                isOpen={showBusinessModal}
                onClose={() => setShowBusinessModal(false)}
                onSave={saveBusinessPermanently}
                onSkip={skipBusinessSetup}
                initialData={invoice.business}
                initialLogo={logoPreview}
            />

            <ItemModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onAdd={addItemToList}
            />

            <TemplateModal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                currentTemplate={invoice.templateId}
                onSelect={(id) => {
                    handleInputChange(null, 'templateId', id);
                    setShowTemplateModal(false);
                }}
                invoice={invoice}
            />

            <PreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                url={previewUrl}
            />

            <CropModal
                isOpen={showCropModal}
                image={imageToCrop}
                shape={cropShape}
                onClose={() => setShowCropModal(false)}
                onCropComplete={handleCropComplete}
                onShapeChange={setCropShape}
            />
        </div>
    );
};

const PreviewModal = ({ isOpen, onClose, url }) => {
    const [numPages, setNumPages] = useState(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }

        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    if (!isOpen) return null;

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-5xl h-full md:h-full md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invoice Preview</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Check all details before downloading</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 bg-slate-100 p-2 md:p-8 overflow-auto flex justify-center custom-scrollbar" ref={containerRef}>
                        <div className="w-full max-w-4xl">
                            <Document
                                file={url}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <Loader2 className="animate-spin mb-4" size={40} />
                                        <p className="font-black uppercase tracking-widest text-xs">Loading Invoice Preview...</p>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center justify-center py-20 text-red-400">
                                        <AlertCircle className="mb-4" size={40} />
                                        <p className="font-black uppercase tracking-widest text-xs text-center px-6">
                                            Failed to load preview.<br />
                                            <button onClick={() => window.open(url, '_blank')} className="mt-4 text-blue-600 underline">Open in New Tab</button>
                                        </p>
                                    </div>
                                }
                            >
                                {Array.from(new Array(numPages), (el, index) => (
                                    <div key={`page_${index + 1}`} className="mb-4 shadow-xl flex justify-center">
                                        <Page
                                            pageNumber={index + 1}
                                            width={containerWidth ? containerWidth - (window.innerWidth < 768 ? 20 : 64) : 800}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="rounded-xl overflow-hidden"
                                        />
                                    </div>
                                ))}
                            </Document>
                        </div>
                    </div>
                    <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-sm uppercase tracking-widest"
                        >
                            Close Preview
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ItemModal = ({ isOpen, onClose, onAdd }) => {
    const [itemData, setItemData] = useState({
        description: '',
        quantity: '',
        unitPrice: ''
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900">Add New Product</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter product name"
                                    autoFocus
                                    value={itemData.description}
                                    onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={itemData.quantity}
                                        placeholder="1"
                                        onChange={(e) => setItemData({ ...itemData, quantity: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Price per Unit</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={itemData.unitPrice}
                                            placeholder="0"
                                            onChange={(e) => setItemData({ ...itemData, unitPrice: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            className="w-full px-5 py-3.5 pl-8 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl">
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Total Price</span>
                                    <span className="text-xl font-black text-blue-700">₹{(itemData.quantity * itemData.unitPrice).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                            >
                                Skip
                            </button>
                            <button
                                onClick={() => onAdd(itemData)}
                                className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus size={18} />
                                Add to Invoice
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const BusinessModal = ({ isOpen, onClose, onSave, onSkip, initialData, initialLogo }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        address: '',
        email: '',
        phone: ''
    });
    const [logo, setLogo] = useState(initialLogo || null);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropShape, setCropShape] = useState('rect');

    useEffect(() => {
        // ALWAYS update state when props change, especially for resets/logouts
        setFormData(initialData || { name: '', address: '', email: '', phone: '' });
        setLogo(initialLogo);
    }, [initialData, initialLogo, isOpen]);

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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Business Details</h2>
                                <p className="text-slate-500 text-sm">Set up your business info for all invoices.</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center">
                                <label className="relative group cursor-pointer">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition-all">
                                        {logo ? (
                                            <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <div className="text-center">
                                                <PlusCircle size={24} className="mx-auto text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">Logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={16} />
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acme Corp"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Full business address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="contact@acme.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                        <input
                                            type="text"
                                            placeholder="+1 234 567 890"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={onSkip}
                                className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={() => onSave({ ...formData, logo })}
                                className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all"
                            >
                                <Save size={18} />
                                Save Business Info
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <CropModal
                isOpen={showCropModal}
                image={imageToCrop}
                shape={cropShape}
                onClose={() => setShowCropModal(false)}
                onCropComplete={(croppedData) => {
                    setLogo(croppedData);
                    setShowCropModal(false);
                }}
                onShapeChange={setCropShape}
            />
        </AnimatePresence>
    );
};

const CropModal = ({ isOpen, image, shape, onClose, onCropComplete, onShapeChange }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => setCrop(crop);
    const onZoomChange = (zoom) => setZoom(zoom);

    const onCropCompleteInternal = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

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

const TemplateModal = ({ isOpen, onClose, currentTemplate, onSelect, invoice }) => {
    // Helper to get logo or placeholder
    const renderLogo = (x, y, size = 40) => {
        if (invoice?.business?.logo) {
            return (
                <image
                    x={x}
                    y={y}
                    width={size}
                    height={size}
                    href={invoice.business.logo}
                    preserveAspectRatio="xMidYMid meet"
                />
            );
        }
        return (
            <g transform={`translate(${x}, ${y})`}>
                <rect width={size} height={size} fill="#e2e8f0" rx="4" />
                <text x={size / 2} y={size / 2 + 2} fontSize="8" fill="#64748b" textAnchor="middle" fontWeight="bold">LOGO</text>
            </g>
        );
    };

    const businessName = invoice?.business?.name || "Your Business";
    const clientName = invoice?.client?.name || "Client Name";

    const templates = [
        {
            id: 'classic',
            name: 'Classic',
            preview: (
                <svg viewBox="0 0 210 297" className="w-full h-full shadow-md bg-white" fill="none">
                    <rect width="210" height="297" fill="white" />

                    {/* Header */}
                    {renderLogo(20, 20, 30)}

                    <text x="190" y="30" fontSize="14" fill="#1e293b" fontWeight="bold" textAnchor="end">INVOICE</text>
                    <text x="190" y="40" fontSize="6" fill="#64748b" textAnchor="end">#INV-001</text>

                    {/* Addresses */}
                    <text x="20" y="70" fontSize="6" fill="#94a3b8" fontWeight="bold" textTransform="uppercase">From</text>
                    <text x="20" y="78" fontSize="7" fill="#334155" fontWeight="bold">{businessName}</text>
                    <text x="20" y="86" fontSize="5" fill="#64748b">123 Business Rd</text>

                    <text x="120" y="70" fontSize="6" fill="#94a3b8" fontWeight="bold" textTransform="uppercase">Bill To</text>
                    <text x="120" y="78" fontSize="7" fill="#334155" fontWeight="bold">{clientName}</text>
                    <text x="120" y="86" fontSize="5" fill="#64748b">456 Client St</text>

                    {/* Table */}
                    <rect x="20" y="110" width="170" height="12" fill="#f8fafc" />
                    <text x="25" y="118" fontSize="5" fill="#64748b" fontWeight="bold">ITEM DESCRIPTION</text>
                    <text x="170" y="118" fontSize="5" fill="#64748b" fontWeight="bold" textAnchor="end">AMOUNT</text>

                    <line x1="20" y1="122" x2="190" y2="122" stroke="#e2e8f0" strokeWidth="0.5" />

                    {/* Rows */}
                    <text x="25" y="132" fontSize="6" fill="#334155">Web Development</text>
                    <text x="170" y="132" fontSize="6" fill="#334155" textAnchor="end">$1,000.00</text>
                    <line x1="20" y1="138" x2="190" y2="138" stroke="#f1f5f9" strokeWidth="0.5" />

                    <text x="25" y="146" fontSize="6" fill="#334155">Design Services</text>
                    <text x="170" y="146" fontSize="6" fill="#334155" textAnchor="end">$500.00</text>
                    <line x1="20" y1="152" x2="190" y2="152" stroke="#f1f5f9" strokeWidth="0.5" />

                    {/* Totals */}
                    <rect x="110" y="180" width="80" height="25" fill="#f8fafc" rx="2" />
                    <text x="120" y="190" fontSize="6" fill="#64748b">Total Due:</text>
                    <text x="180" y="196" fontSize="10" fill="#0f172a" fontWeight="bold" textAnchor="end">$1,500.00</text>
                </svg>
            )
        },
        {
            id: 'modern',
            name: 'Modern Blue',
            preview: (
                <svg viewBox="0 0 210 297" className="w-full h-full shadow-md bg-white" fill="none">
                    <rect width="210" height="297" fill="white" />
                    {/* Blue Header */}
                    <path d="M0 0h210v60H0z" fill="#2563eb" />
                    {renderLogo(20, 15, 30)}

                    <text x="190" y="38" fontSize="16" fill="white" fontWeight="bold" textAnchor="end">INVOICE</text>

                    {/* Cards */}
                    <rect x="20" y="80" width="80" height="35" fill="#eff6ff" rx="4" />
                    <text x="30" y="92" fontSize="5" fill="#3b82f6" fontWeight="bold" textTransform="uppercase">From</text>
                    <text x="30" y="102" fontSize="7" fill="#1e3a8a" fontWeight="bold">{businessName}</text>

                    <rect x="110" y="80" width="80" height="35" fill="#eff6ff" rx="4" />
                    <text x="120" y="92" fontSize="5" fill="#3b82f6" fontWeight="bold" textTransform="uppercase">Bill To</text>
                    <text x="120" y="102" fontSize="7" fill="#1e3a8a" fontWeight="bold">{clientName}</text>

                    {/* Table */}
                    <rect x="20" y="135" width="170" height="14" fill="#bfdbfe" rx="2" />
                    <text x="30" y="144" fontSize="5" fill="#1e40af" fontWeight="bold">DESCRIPTION</text>
                    <text x="180" y="144" fontSize="5" fill="#1e40af" fontWeight="bold" textAnchor="end">TOTAL</text>

                    <rect x="20" y="155" width="170" height="12" fill="white" />
                    <text x="30" y="164" fontSize="6" fill="#334155">Project A</text>
                    <text x="180" y="164" fontSize="6" fill="#334155" textAnchor="end">$1,000.00</text>

                    <rect x="20" y="167" width="170" height="12" fill="#f8fafc" />
                    <text x="30" y="176" fontSize="6" fill="#334155">Service B</text>
                    <text x="180" y="176" fontSize="6" fill="#334155" textAnchor="end">$500.00</text>

                    {/* Total */}
                    <rect x="120" y="220" width="70" height="24" fill="#eff6ff" rx="4" stroke="#bfdbfe" />
                    <text x="130" y="230" fontSize="5" fill="#3b82f6" fontWeight="bold">GRAND TOTAL</text>
                    <text x="180" y="238" fontSize="10" fill="#1d4ed8" fontWeight="bold" textAnchor="end">$1,500</text>
                </svg>
            )
        },
        {
            id: 'minimal',
            name: 'Minimalist',
            preview: (
                <svg viewBox="0 0 210 297" className="w-full h-full shadow-md bg-white" fill="none">
                    <rect width="210" height="297" fill="white" />

                    {/* Header */}
                    <text x="20" y="40" fontSize="20" fill="black" fontFamily="serif" fontWeight="bold">INVOICE</text>
                    <line x1="20" y1="50" x2="190" y2="50" stroke="black" strokeWidth="2" />

                    {/* Addresses Grid */}
                    <text x="20" y="70" fontSize="6" fill="black" fontFamily="monospace" fontWeight="bold">FROM:</text>
                    <text x="20" y="80" fontSize="7" fill="black" fontFamily="monospace">{businessName}</text>
                    {renderLogo(20, 90, 20)}

                    <text x="120" y="70" fontSize="6" fill="black" fontFamily="monospace" fontWeight="bold">TO:</text>
                    <text x="120" y="80" fontSize="7" fill="black" fontFamily="monospace">{clientName}</text>

                    <line x1="105" y1="65" x2="105" y2="100" stroke="#e5e7eb" />

                    {/* Table */}
                    <line x1="20" y1="120" x2="190" y2="120" stroke="black" strokeWidth="1" />
                    <text x="20" y="128" fontSize="6" fill="black" fontFamily="monospace" fontWeight="bold">ITEM</text>
                    <text x="190" y="128" fontSize="6" fill="black" fontFamily="monospace" fontWeight="bold" textAnchor="end">PRICE</text>
                    <line x1="20" y1="132" x2="190" y2="132" stroke="black" strokeWidth="1" />

                    <text x="20" y="144" fontSize="7" fill="black" fontFamily="monospace">Consulting</text>
                    <text x="190" y="144" fontSize="7" fill="black" fontFamily="monospace" textAnchor="end">1,000.00</text>
                    <line x1="20" y1="150" x2="190" y2="150" stroke="#e5e7eb" />

                    <text x="20" y="160" fontSize="7" fill="black" fontFamily="monospace">Development</text>
                    <text x="190" y="160" fontSize="7" fill="black" fontFamily="monospace" textAnchor="end">500.00</text>
                    <line x1="20" y1="166" x2="190" y2="166" stroke="#e5e7eb" />

                    {/* Total Box */}
                    <rect x="110" y="210" width="80" height="30" fill="white" stroke="black" strokeWidth="2" />
                    <text x="120" y="222" fontSize="6" fill="black" fontFamily="monospace" fontWeight="bold">TOTAL</text>
                    <text x="180" y="232" fontSize="12" fill="black" fontFamily="monospace" fontWeight="bold" textAnchor="end">$1,500</text>
                </svg>
            )
        },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Choose a Template</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">Select a professional design for your invoice.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => onSelect(template.id)}
                                    className={`group relative flex flex-col items-center transition-all duration-200 outline-none`}
                                >
                                    <div className={`relative w-full aspect-[1/1.4] rounded-2xl overflow-hidden border-4 transition-all shadow-lg ${currentTemplate === template.id ? 'border-blue-600 ring-4 ring-blue-100 scale-[1.02]' : 'border-white group-hover:border-blue-300 group-hover:-translate-y-1'}`}>
                                        {template.preview}

                                        {/* Overlay for selected state */}
                                        {currentTemplate === template.id && (
                                            <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                                <div className="bg-blue-600 text-white p-3 rounded-full shadow-xl scale-110">
                                                    <Check size={24} strokeWidth={3} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 text-center">
                                        <h3 className={`font-bold text-lg ${currentTemplate === template.id ? 'text-blue-600' : 'text-slate-700'}`}>{template.name}</h3>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InvoiceGenerator;
