import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, History, Calendar, User, CreditCard, ExternalLink, Loader2, AlertCircle, FileText, UserCircle, X, Building2, Receipt, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const InvoiceHistory = () => {
    const { isLoggedIn, setShowAuthModal } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        if (isLoggedIn) {
            fetchRecentInvoices();
        } else {
            setInvoices([]);
        }
    }, [isLoggedIn]);

    const fetchRecentInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Fetching recent invoices from: ${import.meta.env.VITE_API_URL}/invoice/recent`);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoice/recent`);
            console.log('Recent invoices response:', response.data);

            if (response.data && response.data.success) {
                setInvoices(response.data.invoices || []);
                if ((response.data.invoices || []).length === 0) {
                    console.warn('API returned success but 0 invoices.');
                }
            } else {
                throw new Error(response.data?.message || 'Failed to fetch history');
            }
        } catch (err) {
            console.error('Fetch error details:', err);
            setError(`Error: ${err.message}. Make sure the backend is running on port 5000.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length === 0) {
            fetchRecentInvoices();
            return;
        }

        if (query.length < 2) return;

        setLoading(true);
        try {
            console.log(`Searching for: ${query}`);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoice/search?query=${query}`);
            console.log('Search response:', response.data);

            if (response.data && response.data.success) {
                setInvoices(response.data.invoices || []);
            }
        } catch (err) {
            console.error('Search error details:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mt-12 overflow-hidden transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-3 text-slate-900 mb-2">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <History size={28} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-900">Invoice History</h3>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Keep track of your recently generated invoices. Click any row to view details.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={fetchRecentInvoices}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                        title="Refresh History"
                    >
                        <Loader2 className={`transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} size={20} />
                    </button>
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search #number or client..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500/20 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold placeholder:font-medium placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {loading && invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                    <p className="text-slate-500 font-bold animate-pulse">Fetching your history...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 bg-red-50/50 rounded-3xl border border-red-100">
                    <AlertCircle className="text-red-500 mb-4" size={40} />
                    <p className="text-red-600 font-bold">{error}</p>
                    <button
                        onClick={fetchRecentInvoices}
                        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : invoices.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:-mx-8">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100">
                                <th className="px-4 sm:px-8 py-5 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Invoice #</th>
                                <th className="px-4 sm:px-8 py-5 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Client</th>
                                <th className="hidden md:table-cell px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date Issued</th>
                                <th className="px-4 sm:px-8 py-5 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Grand Total</th>
                                <th className="hidden sm:table-cell px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.map((inv) => (
                                <motion.tr
                                    key={inv._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="hover:bg-blue-50/50 transition-all group cursor-pointer"
                                >
                                    <td className="px-4 sm:px-8 py-6">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="shrink-0 p-1.5 sm:p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">#{inv.invoiceNumber}</div>
                                                <div className="hidden sm:block text-[10px] text-slate-400 mt-1 font-mono uppercase font-bold tracking-tight">ID: {inv.invoiceID.split('-')[0]}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-8 py-6">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="hidden sm:flex w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center text-indigo-600 shadow-sm">
                                                <UserCircle size={22} className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-sm font-black text-slate-800">{inv.client.name}</div>
                                                <div className="hidden md:block text-xs text-slate-500 font-medium">{inv.client.email || 'No email provided'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                                            <Calendar size={14} className="text-slate-400" />
                                            {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-lg font-black text-slate-900 flex items-center justify-end gap-1">
                                            <span className="text-xs text-slate-400 font-bold">{inv.currency === 'INR' ? '₹' : '$'}</span>
                                            {inv.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {inv.status}
                                            </span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : !isLoggedIn ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100 group hover:border-blue-100 transition-colors">
                    <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-blue-500">
                        <History size={32} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">History is Locked</h4>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">Login to your account to securely store and view your generated invoices.</p>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Sign In to View History
                    </button>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border-4 border-dashed border-slate-100">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                        <History size={32} className="text-slate-300" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">No History Yet</h4>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto">Generate your first invoice to see it appear here in the history log.</p>
                </div>
            )}

            {/* Invoice Details Modal */}
            <AnimatePresence>
                {selectedInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedInvoice(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Invoice #{selectedInvoice.invoiceNumber}</h2>
                                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">ID: {selectedInvoice.invoiceID}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Top Info: Business & Client */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Building2 size={20} />
                                            <h4 className="text-sm font-black uppercase tracking-widest">From</h4>
                                        </div>
                                        <div>
                                            {selectedInvoice.business.logoData && (
                                                <img
                                                    src={selectedInvoice.business.logoData}
                                                    alt="Logo"
                                                    className="max-w-[120px] max-h-[60px] object-contain mb-4 rounded-lg"
                                                />
                                            )}
                                            <p className="text-xl font-black text-slate-900 mb-2">{selectedInvoice.business.name}</p>
                                            <p className="text-slate-500 text-sm font-medium leading-relaxed whitespace-pre-line">{selectedInvoice.business.address}</p>
                                            <div className="mt-4 space-y-1 text-sm font-bold text-slate-700">
                                                <p>{selectedInvoice.business.email}</p>
                                                <p>{selectedInvoice.business.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-indigo-600">
                                            <User size={20} />
                                            <h4 className="text-sm font-black uppercase tracking-widest">Bill To</h4>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-slate-900 mb-2">{selectedInvoice.client.name}</p>
                                            <p className="text-slate-500 text-sm font-medium leading-relaxed whitespace-pre-line">{selectedInvoice.client.address}</p>
                                            <div className="mt-4 text-sm font-bold text-slate-700">
                                                <p>{selectedInvoice.client.email}</p>
                                                {selectedInvoice.client.phone && <p>{selectedInvoice.client.phone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates & Status */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                                        <p className="text-sm font-black text-slate-900">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                        <p className="text-sm font-black text-slate-900">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency</p>
                                        <p className="text-sm font-black text-slate-900">{selectedInvoice.currency}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-md">{selectedInvoice.status}</span>
                                    </div>
                                    {selectedInvoice.paymentMode && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Mode</p>
                                            <p className="text-sm font-black text-slate-900">{selectedInvoice.paymentMode}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Items Table */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Receipt size={20} className="text-slate-400" />
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Line Items</h4>
                                    </div>
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(selectedInvoice.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.description}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">{item.quantity}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">{formatINR(item.unitPrice)}</td>
                                                        <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{formatINR(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary & Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Notes</h4>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                                            {selectedInvoice.notes || "No notes provided for this invoice."}
                                        </p>
                                    </div>
                                    <div className="space-y-4 bg-slate-900 p-8 rounded-[32px] text-white">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                                            <span className="font-bold">{formatINR(selectedInvoice.totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="text-xs font-black uppercase tracking-widest">Tax ({selectedInvoice.totals.tax}%)</span>
                                            <span className="font-bold">+ {formatINR(selectedInvoice.totals.taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="text-xs font-black uppercase tracking-widest">Discount ({selectedInvoice.totals.discount}%)</span>
                                            <span className="font-bold">- {formatINR(selectedInvoice.totals.discountAmount)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                            <span className="text-lg font-black uppercase tracking-tighter">Grand Total</span>
                                            <span className="text-2xl font-black">{formatINR(selectedInvoice.totals.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InvoiceHistory;
