import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Plus, Trash2, Download, Loader2, Building2, User, Receipt, PlusCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceHistory from '../components/InvoiceHistory';
import { useAuth } from '../context/AuthContext';

const InvoiceGenerator = () => {
    const [loading, setLoading] = useState(false);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const [invoice, setInvoice] = useState({
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'INR',
        notes: '',
        tax: 0,
        discount: 0,
        business: {
            name: '',
            address: '',
            email: '',
            phone: ''
        },
        client: {
            name: '',
            address: '',
            email: ''
        },
        items: [
            { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }
        ]
    });

    const [totals, setTotals] = useState({
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        grandTotal: 0
    });

    useEffect(() => {
        calculateTotals();
    }, [invoice.items, invoice.tax, invoice.discount]);

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

    const addItem = () => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]
        }));
    };

    const removeItem = (id) => {
        if (invoice.items.length === 1) return;
        setInvoice(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const { isLoggedIn, setShowAuthModal } = useAuth();

    const generateInvoice = async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        setLoading(true);
        const formData = new FormData();
        if (logo) formData.append('logo', logo);
        formData.append('data', JSON.stringify(invoice));

        try {
            const response = await axios.post('http://localhost:5000/api/invoice/generate', formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Refresh page after download to show updated history and clear form
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error generating invoice:', error);
            if (error.response?.status === 401) {
                setShowAuthModal(true);
            } else {
                alert('Failed to generate invoice. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Invoice Generator</h1>
                        <p className="text-slate-500 mt-1">Create professional PDF invoices in seconds.</p>
                    </div>

                    <button
                        onClick={generateInvoice}
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Download size={20} className="group-hover:scale-110 transition-transform" />
                        )}
                        <span>{loading ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Section */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wider">Business Logo</span>
                                        <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-3xl p-4 transition-all hover:bg-slate-50 hover:border-blue-400">
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
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-6 text-blue-600">
                                    <Building2 size={24} />
                                    <h3 className="text-lg font-black tracking-tight uppercase">Your Business</h3>
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

                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-6 text-indigo-600">
                                    <User size={24} />
                                    <h3 className="text-lg font-black tracking-tight uppercase">Bill To</h3>
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Client Name"
                                        value={invoice.client.name}
                                        onChange={(e) => handleInputChange('client', 'name', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:font-normal"
                                    />
                                    <textarea
                                        placeholder="Client Address"
                                        rows="3"
                                        value={invoice.client.address}
                                        onChange={(e) => handleInputChange('client', 'address', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:font-normal"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Client Email"
                                        value={invoice.client.email}
                                        onChange={(e) => handleInputChange('client', 'email', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:font-normal"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Receipt size={24} />
                                    <h3 className="text-lg font-black tracking-tight uppercase">Line Items</h3>
                                </div>
                                <button
                                    onClick={addItem}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                                            <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right" width="120">Qty</th>
                                            <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right" width="150">Price</th>
                                            <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right" width="150">Total</th>
                                            <th className="px-8 py-4" width="80"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence initial={false}>
                                            {invoice.items.map((item) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="group"
                                                >
                                                    <td className="px-8 py-4">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Graphic Design Services"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                            className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-500 transition-all font-medium outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                                                            className="w-full p-2 bg-slate-50 border-0 rounded-lg text-right font-bold text-slate-700 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                                                                className="w-full p-2 pl-6 bg-slate-50 border-0 rounded-lg text-right font-bold text-slate-700 outline-none"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-black text-slate-900">
                                                        ₹{(item.quantity * item.unitPrice).toFixed(2)}
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
                        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl shadow-blue-100 sticky top-12">
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
                                                onChange={(e) => handleInputChange(null, 'tax', parseFloat(e.target.value))}
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
                                                onChange={(e) => handleInputChange(null, 'discount', parseFloat(e.target.value))}
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
        </div>
    );
};

export default InvoiceGenerator;
