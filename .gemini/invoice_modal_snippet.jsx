// Invoice Detail Modal Component - Add this before the closing </div> tag in AdminDashboard.jsx
// Insert this code at line 781, right after the closing brace for the professional review modal

{/* Invoice Detail Modal */ }
<AnimatePresence>
    {selectedInvoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedInvoice(null)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
                <button
                    onClick={() => setSelectedInvoice(null)}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                    <XCircle size={24} />
                </button>

                <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-slate-200 pb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                <FileText className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedInvoice.invoiceNumber}</h3>
                                <p className="text-xs md:text-sm text-slate-500 font-bold">Invoice Details</p>
                            </div>
                        </div>
                    </div>

                    {/* Business & Client Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 md:p-6 rounded-2xl">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">From</h4>
                            <p className="font-black text-slate-900 text-lg mb-1">{selectedInvoice.businessName}</p>
                            <p className="text-sm text-slate-600">{selectedInvoice.businessAddress}</p>
                            <p className="text-sm text-slate-600 mt-2">{selectedInvoice.businessPhone}</p>
                            <p className="text-sm text-slate-600">{selectedInvoice.businessEmail}</p>
                        </div>
                        <div className="bg-blue-50 p-4 md:p-6 rounded-2xl">
                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Billed To</h4>
                            <p className="font-black text-slate-900 text-lg mb-1">{selectedInvoice.clientName}</p>
                            <p className="text-sm text-slate-600">{selectedInvoice.clientAddress}</p>
                            <p className="text-sm text-slate-600 mt-2">{selectedInvoice.clientPhone}</p>
                            <p className="text-sm text-slate-600">{selectedInvoice.clientEmail}</p>
                        </div>
                    </div>

                    {/* Invoice Meta */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Issue Date</p>
                            <p className="font-bold text-slate-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Due Date</p>
                            <p className="font-bold text-slate-900">{selectedInvoice.dueDate || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Generated</span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="p-3 md:p-4 text-left text-[10px] font-black uppercase tracking-widest">Item</th>
                                    <th className="p-3 md:p-4 text-center text-[10px] font-black uppercase tracking-widest">Qty</th>
                                    <th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Rate</th>
                                    <th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedInvoice.items?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-3 md:p-4">
                                            <p className="font-bold text-slate-900 text-sm">{item.description}</p>
                                        </td>
                                        <td className="p-3 md:p-4 text-center font-bold text-slate-600">{item.quantity}</td>
                                        <td className="p-3 md:p-4 text-right font-bold text-slate-600">₹{item.rate}</td>
                                        <td className="p-3 md:p-4 text-right font-black text-slate-900">₹{item.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan="3" className="p-4 text-right font-black text-slate-900 uppercase tracking-tight">Total Amount</td>
                                    <td className="p-4 text-right font-black text-blue-600 text-xl">₹{selectedInvoice.totalAmount}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes */}
                    {selectedInvoice.notes && (
                        <div className="bg-amber-50 p-4 md:p-6 rounded-2xl border border-amber-200">
                            <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Notes</h4>
                            <p className="text-sm text-slate-700">{selectedInvoice.notes}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )}
</AnimatePresence>
