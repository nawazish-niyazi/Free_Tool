import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { useAdmin } from '../context/AdminContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Briefcase, FileText,
    Activity, LogOut, ChevronRight, TrendingUp,
    ShieldCheck, AlertTriangle, Database, Trash2, Edit3, Search, Calendar, Phone, Mail, Clock, UserPlus, CheckCircle, XCircle, Gift, Ticket, Plus, Image, Upload, Landmark
} from 'lucide-react';
import api from '../api/axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const parseExperience = (expStr) => {
    if (!expStr) return [];

    // Fallback for old simple strings
    if (!expStr.includes('(')) {
        return [{
            skill: 'Overall Experience',
            years: expStr.toLowerCase().includes('year') ? expStr : `${expStr} Years`,
            price: null
        }];
    }

    const parts = expStr.split(', ');
    return parts.map(part => {
        const match = part.match(/^(.*)\s*\(([^)]+)\)$/);
        if (match) {
            const skill = match[1].trim();
            const detail = match[2].trim();
            let years = 'N/A';
            let price = null;

            if (detail.includes('@ ₹')) {
                const subParts = detail.split('@ ₹');
                years = subParts[0].trim() || 'N/A';
                price = subParts[1].trim();
            } else {
                years = detail;
            }

            if (years !== 'N/A' && !years.toLowerCase().includes('year')) {
                years += ' Years';
            }
            return { skill, years, price };
        }
        return { skill: part.trim(), years: 'N/A', price: null };
    });
};

const AdminDashboard = () => {
    const { admin, adminToken, adminLogout } = useAdmin();
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState([]);
    const [usage3d, setUsage3d] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data lists
    const [dataList, setDataList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingWorkersCount, setPendingWorkersCount] = useState(0);
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Reward/Coupon Management
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [couponFormData, setCouponFormData] = useState({
        title: '',
        description: '',
        image: '',
        code: '',
        keyPoints: '',
        imagePreview: null
    });

    const [helpFormData, setHelpFormData] = useState({ name: '', services: '' });
    const [editingHelpId, setEditingHelpId] = useState(null);
    const [isManagingHelp, setIsManagingHelp] = useState(false);
    const [isManagingSkills, setIsManagingSkills] = useState(false);
    const [pendingSkillsList, setPendingSkillsList] = useState([]);

    // New state for Financial Aids & Events
    const [isManagingEvent, setIsManagingEvent] = useState(false);
    const [eventFormData, setEventFormData] = useState({
        title: '',
        description: '',
        image: '',
        date: '',
        location: '',
        organizer: '',
        link: '',
        imageFile: null
    });
    const [editingEventId, setEditingEventId] = useState(null);

    const [lastSeenCounts, setLastSeenCounts] = useState(() => {
        const saved = localStorage.getItem('adminLastSeenCounts');
        return saved ? JSON.parse(saved) : {};
    });

    const [imageToCrop, setImageToCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropShape, setCropShape] = useState('rect');

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
            console.error("Error converting image:", e);
            return null;
        }
    };

    const getCroppedImg = async (imageSrc, pixelCrop, isRound) => {
        const image = await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
                img.crossOrigin = 'anonymous';
            }
            img.src = imageSrc;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Set canvas size to the exact pixel dimensions of the crop
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        if (isRound) {
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
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

    useEffect(() => {
        fetchStats();
        fetchPendingWorkers();
    }, []);

    useEffect(() => {
        if (activeTab !== 'overview') {
            fetchListData();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/dashboard');

            if (res.data.success) {
                setStats(res.data.stats);
                setUsage(res.data.toolUsage);
                setUsage3d(res.data.usageLast3Days || []);
                setRecentLogs(res.data.recentActivity);
                if (res.data.stats.pendingWorkers !== undefined) {
                    setPendingWorkersCount(res.data.stats.pendingWorkers);
                }
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchListData = async () => {
        setListLoading(true);
        setDataList([]);
        try {
            const endpointMap = {
                'users': 'admin/users',
                'professionals': 'admin/professionals',
                'invoices': 'admin/invoices',
                'logs': 'admin/logs',
                'local-help': 'admin/local-help/categories',
                'financial-aid': 'admin/financial-aid',
                'events': 'admin/events',
                'coupons': 'admin/rewards/coupons',
                'referrals': 'admin/rewards/referrals'
            };
            const endpoint = endpointMap[activeTab];
            const res = await api.get(`/${endpoint}`);

            if (res.data.success) {
                setDataList(res.data.data);
            }
        } catch (err) {
            console.error('List fetch error:', err);
        } finally {
            setListLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);

            fetchListData();
        } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
    };

    const handleDeleteProfessional = async (id) => {
        if (!window.confirm('Are you sure you want to delete this professional?')) return;
        try {
            await api.delete(`/admin/professionals/${id}`);
            fetchListData();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const fetchPendingWorkers = async () => {
        try {
            const res = await api.get('/admin/pending-workers');
            if (res.data.success) {
                setPendingWorkersCount(res.data.data.length);
            }
        } catch (err) {
            console.error('Pending count error:', err);
        }
    };

    const fetchPendingSkills = async () => {
        try {
            const res = await api.get('/admin/pending-skills');
            if (res.data.success) {
                setPendingSkillsList(res.data.data);
            }
        } catch (err) {
            console.error('Fetch pending skills error:', err);
        }
    };

    const handleApproveSkill = async (proId, skill) => {
        try {
            const res = await api.put(`/admin/professionals/${proId}/approve-skill`, { skill });
            if (res.data.success) {
                fetchPendingSkills();
                if (activeTab === 'professionals') fetchListData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleRejectSkill = async (proId, skill) => {
        if (!window.confirm('Are you sure you want to reject this skill suggestion?')) return;
        try {
            const res = await api.put(`/admin/professionals/${proId}/reject-skill`, { skill });
            if (res.data.success) {
                fetchPendingSkills();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };


    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = couponFormData.image;

            // Handle image upload if a file is selected
            if (couponFormData.imageFile) {
                const formData = new FormData();
                formData.append('image', couponFormData.imageFile);
                const uploadRes = await api.post('/image/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success) {
                    finalImageUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}/temp/${uploadRes.data.filename}`;
                }
            }

            const data = {
                ...couponFormData,
                image: finalImageUrl,
                keyPoints: couponFormData.keyPoints.split(',').map(p => p.trim())
            };
            const res = await api.post('/admin/rewards/coupons', data);
            if (res.data.success) {
                setIsAddingCoupon(false);
                setCouponFormData({ title: '', description: '', image: '', code: '', keyPoints: '', imageFile: null });
                fetchListData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Use static URL for the file to avoid long data strings
            const objectUrl = URL.createObjectURL(file);
            setImageToCrop(objectUrl);
            setCropShape('rect');
            setShowCropModal(true);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await api.delete(`/admin/rewards/coupons/${id}`);
            fetchListData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleWorkerStatus = async (id, status) => {
        const action = status === 'approved' ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${action} this worker?`)) return;

        try {
            await api.put(`/admin/workers/${id}/status`, { status });

            fetchListData();
            fetchPendingWorkers(); // Update count
        } catch (err) {
            alert(err.response?.data?.message || 'Status update failed');
        }
    };

    const handleCategoryAction = async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: helpFormData.name,
                services: helpFormData.services.split(',').map(s => s.trim()).filter(s => s !== '')
            };
            if (editingHelpId) {
                await api.put(`/admin/local-help/categories/${editingHelpId}`, data);
            } else {
                await api.post('/admin/local-help/categories', data);
            }
            setIsManagingHelp(false);
            setHelpFormData({ name: '', services: '' });
            setEditingHelpId(null);
            fetchListData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    // Financial Aid Actions
    const handleAidStatus = async (id, isApproved) => {
        try {
            await api.put(`/admin/financial-aid/${id}/status`, { isApproved });
            fetchListData();
        } catch (err) {
            alert('Status update failed');
        }
    };

    const handleDeleteAid = async (id) => {
        if (!window.confirm('Delete this provider?')) return;
        try {
            await api.delete(`/admin/financial-aid/${id}`);
            fetchListData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    // Event Actions
    const handleEventAction = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = eventFormData.image;
            if (eventFormData.imageFile) {
                const formData = new FormData();
                formData.append('image', eventFormData.imageFile);
                const uploadRes = await api.post('/image/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success) {
                    finalImageUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}/temp/${uploadRes.data.filename}`;
                }
            }

            const data = { ...eventFormData, image: finalImageUrl };
            delete data.imageFile;

            if (editingEventId) {
                await api.put(`/admin/events/${editingEventId}`, data);
            } else {
                await api.post('/admin/events', data);
            }

            setIsManagingEvent(false);
            setEventFormData({ title: '', description: '', image: '', date: '', location: '', organizer: '', link: '', imageFile: null });
            setEditingEventId(null);
            fetchListData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await api.delete(`/admin/events/${id}`);
            fetchListData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await api.delete(`/admin/local-help/categories/${id}`);
            fetchListData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const filteredData = dataList.filter(item => {
        const search = searchTerm.toLowerCase();
        if (activeTab === 'users') return item.name?.toLowerCase().includes(search) || item.phone?.includes(search) || item.email?.toLowerCase().includes(search);
        if (activeTab === 'professionals') {
            const inName = item.name?.toLowerCase().includes(search);
            const inCategory = item.category?.toLowerCase().includes(search);
            const inService = item.service?.toLowerCase().includes(search);
            const inServicesList = item.services?.some(s => s.toLowerCase().includes(search));
            return inName || inCategory || inService || inServicesList;
        }
        if (activeTab === 'local-help') {
            const inName = item.name?.toLowerCase().includes(search);
            const inServices = item.services?.some(s => s.toLowerCase().includes(search));
            return inName || inServices;
        }
        if (activeTab === 'invoices') return (item.invoiceNumber || '').toLowerCase().includes(search) || (item.client?.name || '').toLowerCase().includes(search);
        if (activeTab === 'logs') return item.tool?.toLowerCase().includes(search) || item.month?.toLowerCase().includes(search);
        if (activeTab === 'coupons') return item.title?.toLowerCase().includes(search) || item.code?.toLowerCase().includes(search);
        if (activeTab === 'referrals') return item.name?.toLowerCase().includes(search) || item.service?.toLowerCase().includes(search);
        if (activeTab === 'financial-aid') return item.name?.toLowerCase().includes(search) || item.type?.toLowerCase().includes(search) || item.location?.toLowerCase().includes(search);
        if (activeTab === 'events') return item.title?.toLowerCase().includes(search) || item.location?.toLowerCase().includes(search);
        return true;
    });

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Activity className="animate-spin text-blue-600" size={48} /></div>;

    const SidebarContent = () => (
        <>
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8 md:mb-10">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <span className="text-white font-black text-xl tracking-tight uppercase">Admin <span className="text-blue-500">Panel</span></span>
                </div>

                <nav className="space-y-2">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'users', label: 'Users', icon: Users, badge: stats?.newUsers },
                        { id: 'professionals', label: 'Professional Users', icon: Briefcase },
                        { id: 'local-help', label: 'Local Help', icon: Activity },
                        { id: 'financial-aid', label: 'Financial Aids', icon: Landmark },
                        { id: 'events', label: 'Local Events', icon: Calendar },
                        { id: 'invoices', label: 'Invoices', icon: FileText },
                        { id: 'coupons', label: 'Rewards/Coupons', icon: Ticket },
                        { id: 'referrals', label: 'Referrals', icon: Gift, badge: stats?.pendingReferrals },
                        { id: 'logs', label: 'Usage Metrics', icon: Database },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSearchTerm('');
                                setIsSidebarOpen(false);
                                // Mark as seen
                                if (item.badge !== undefined) {
                                    const newCounts = { ...lastSeenCounts, [item.id]: item.badge };
                                    setLastSeenCounts(newCounts);
                                    localStorage.setItem('adminLastSeenCounts', JSON.stringify(newCounts));
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all relative ${activeTab === item.id
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                            {item.badge > 0 && item.badge > (lastSeenCounts[item.id] || 0) && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/40 animate-pulse"
                                >
                                    {item.badge}
                                </motion.span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 md:p-8 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 font-black">
                        {admin?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">{admin?.name}</p>
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{admin?.role}</p>
                    </div>
                </div>
                <button onClick={adminLogout} className="w-full flex items-center gap-4 px-6 py-4 text-red-400 font-bold hover:bg-red-500/10 rounded-2xl transition-all"><LogOut size={20} /> Sign Out</button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden bg-slate-900 p-4 flex justify-between items-center z-[60] border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="text-white" size={18} />
                    </div>
                    <span className="text-white font-black text-sm uppercase tracking-tight">Admin <span className="text-blue-500">Panel</span></span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    {isSidebarOpen ? <XCircle size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Admin Sidebar - Desktop */}
            <div className="hidden lg:flex w-72 bg-slate-900 shrink-0 flex-col">
                <SidebarContent />
            </div>

            {/* Admin Sidebar - Mobile Modal */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-[100] lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            className="absolute inset-y-0 left-0 w-72 bg-slate-900 flex flex-col shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 h-[calc(100vh-64px)] lg:h-screen overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-10">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8 md:mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {activeTab === 'overview' ? 'Command' : activeTab} <span className="text-blue-600">{activeTab === 'overview' ? 'Center' : 'Records'}</span>
                        </h2>
                        <p className="text-slate-500 font-bold text-xs md:text-sm mt-1">Real-time system oversight and analytics</p>
                    </div>
                    {activeTab !== 'overview' && (
                        <div className="flex w-full md:w-auto">
                            <div className="relative w-full flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search data..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-full md:w-64"
                                    />
                                </div>
                                {activeTab === 'coupons' && (
                                    <button
                                        onClick={() => setIsAddingCoupon(true)}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <Plus size={18} strokeWidth={3} /> Add Coupons
                                    </button>
                                )}
                                {activeTab === 'local-help' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                fetchPendingSkills();
                                                setIsManagingSkills(true);
                                            }}
                                            className="px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-50 hover:bg-blue-50 hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
                                        >
                                            <Sparkles size={18} className="text-blue-500" /> Skill Suggestions
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingHelpId(null);
                                                setHelpFormData({ name: '', services: '' });
                                                setIsManagingHelp(true);
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
                                        >
                                            <Plus size={18} strokeWidth={3} /> Add Category
                                        </button>
                                    </div>
                                )}
                                {activeTab === 'events' && (
                                    <button
                                        onClick={() => {
                                            setEditingEventId(null);
                                            setEventFormData({ title: '', description: '', image: '', date: '', location: '', organizer: '', link: '', imageFile: null });
                                            setIsManagingEvent(true);
                                        }}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <Plus size={18} strokeWidth={3} /> Add Event
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-10">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { id: 'users', label: 'Total Members', value: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { id: 'professionals', label: 'Active Pros', value: stats?.totalProfessionals, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { id: 'invoices', label: 'Invoices Issued', value: stats?.totalInvoices, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
                            ].map((stat, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(stat.id)}
                                    className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 hover:-translate-y-2 transition-all text-left group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-500 font-black text-xs uppercase tracking-widest">
                                            <TrendingUp size={16} /> Healthy
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-5xl font-black text-slate-900 tracking-tight">{stat.value || 0}</h4>
                                        <ChevronRight className="text-slate-300 group-hover:translate-x-2 group-hover:text-blue-600 transition-all" size={32} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Usage & Integrity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5">
                                <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Recent Activity <span className="text-blue-600">(Last 3 Days)</span></h3>
                                <div className="space-y-6">
                                    {usage3d.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between mb-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item._id.replace(/_/g, ' ')}</span><span className="text-xs font-black text-slate-900">{item.count}</span></div>
                                            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (item.count / 10) * 100)}%` }} /></div>
                                        </div>
                                    ))}
                                    {usage3d.length === 0 && <p className="text-slate-400 font-bold italic text-sm">No activity recorded in the last 72 hours.</p>}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5">
                                <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">System <span className="text-blue-600">Integrity</span></h3>
                                <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6"><div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center"><Activity size={24} /></div><div><p className="text-white font-bold text-sm">Main API Cluster</p><p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Active • Stable</p></div></div>
                                    <div className="space-y-4">
                                        {['DB Primary', 'AI Worker', 'Task Queue'].map(s => (
                                            <div key={s} className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s}</span><span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">Connected</span></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Live <span className="text-blue-600">Activity Stream</span></h3>
                            <div className="space-y-4">
                                {recentLogs.map((log, i) => (
                                    <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Activity size={20} /></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.event.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-slate-500 font-bold">{log.userId?.name || 'Guest User'} • {log.userId?.phone || 'IP Trace'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Views (Users, Professionals, Invoices, Logs) */}
                {activeTab !== 'overview' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
                        {listLoading ? (
                            <div className="py-32 flex flex-col items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-4" size={40} /><p className="font-black uppercase tracking-widest text-xs">Decrypting Records...</p></div>
                        ) : activeTab === 'logs' ? (
                            // GRAPHICAL VIEW FOR USAGE METRICS
                            <div className="p-10 space-y-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Usage Analytics <span className="text-blue-600">Dashboard</span></h3>
                                        <p className="text-xs md:text-sm text-slate-500 font-bold mt-1">Visual representation of tool usage metrics</p>
                                    </div>
                                    <div className="w-fit px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest">
                                        {filteredData.length} Records
                                    </div>
                                </div>

                                {/* Charts Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Bar Chart - Tool Usage Comparison */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-lg">
                                        <h4 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                                <Database className="text-white" size={20} />
                                            </div>
                                            Tool Usage Comparison
                                        </h4>
                                        <div className="h-64 md:h-80">
                                            <Bar
                                                data={{
                                                    labels: filteredData.map(item => item.tool.replace(/_/g, ' ').toUpperCase()),
                                                    datasets: [{
                                                        label: 'Total Hits',
                                                        data: filteredData.map(item => item.usage),
                                                        backgroundColor: 'rgba(37, 99, 235, 0.8)',
                                                        borderColor: 'rgba(37, 99, 235, 1)',
                                                        borderWidth: 2,
                                                        borderRadius: 8,
                                                        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                            titleColor: '#fff',
                                                            bodyColor: '#fff',
                                                            padding: 12,
                                                            cornerRadius: 12,
                                                            titleFont: { size: 14, weight: 'bold' },
                                                            bodyFont: { size: 13 }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: {
                                                                color: 'rgba(148, 163, 184, 0.1)',
                                                            },
                                                            ticks: {
                                                                font: { size: 11, weight: 'bold' },
                                                                color: '#64748b'
                                                            }
                                                        },
                                                        x: {
                                                            grid: {
                                                                display: false
                                                            },
                                                            ticks: {
                                                                font: { size: 10, weight: 'bold' },
                                                                color: '#64748b'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Doughnut Chart - Usage Distribution */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-lg">
                                        <h4 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                                                <Activity className="text-white" size={20} />
                                            </div>
                                            Usage Distribution
                                        </h4>
                                        <div className="h-64 md:h-80">
                                            <Doughnut
                                                data={{
                                                    labels: filteredData.map(item => item.tool.replace(/_/g, ' ').toUpperCase()),
                                                    datasets: [{
                                                        label: 'Usage Share',
                                                        data: filteredData.map(item => item.usage),
                                                        backgroundColor: [
                                                            'rgba(37, 99, 235, 0.8)',
                                                            'rgba(16, 185, 129, 0.8)',
                                                            'rgba(245, 158, 11, 0.8)',
                                                            'rgba(239, 68, 68, 0.8)',
                                                            'rgba(139, 92, 246, 0.8)',
                                                            'rgba(236, 72, 153, 0.8)',
                                                        ],
                                                        borderColor: [
                                                            'rgba(37, 99, 235, 1)',
                                                            'rgba(16, 185, 129, 1)',
                                                            'rgba(245, 158, 11, 1)',
                                                            'rgba(239, 68, 68, 1)',
                                                            'rgba(139, 92, 246, 1)',
                                                            'rgba(236, 72, 153, 1)',
                                                        ],
                                                        borderWidth: 3,
                                                        hoverOffset: 15
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                            labels: {
                                                                padding: 15,
                                                                font: { size: 11, weight: 'bold' },
                                                                color: '#64748b',
                                                                usePointStyle: true,
                                                                pointStyle: 'circle'
                                                            }
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                            titleColor: '#fff',
                                                            bodyColor: '#fff',
                                                            padding: 12,
                                                            cornerRadius: 12,
                                                            titleFont: { size: 14, weight: 'bold' },
                                                            bodyFont: { size: 13 }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Line Chart - Usage Trend */}
                                        <div className="bg-gradient-to-br from-slate-50 to-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-lg lg:col-span-2">
                                            <h4 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                                                    <TrendingUp className="text-white" size={20} />
                                                </div>
                                                Usage Trend Analysis
                                            </h4>
                                            <div className="h-64 md:h-80">
                                                <Line
                                                    data={{
                                                        labels: filteredData.map(item => item.tool.replace(/_/g, ' ').toUpperCase()),
                                                        datasets: [{
                                                            label: 'Total Hits',
                                                            data: filteredData.map(item => item.usage),
                                                            borderColor: 'rgba(139, 92, 246, 1)',
                                                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                            borderWidth: 3,
                                                            fill: true,
                                                            tension: 0.4,
                                                            pointRadius: 6,
                                                            pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                                                            pointBorderColor: '#fff',
                                                            pointBorderWidth: 3,
                                                            pointHoverRadius: 8,
                                                            pointHoverBackgroundColor: 'rgba(139, 92, 246, 1)',
                                                            pointHoverBorderColor: '#fff',
                                                            pointHoverBorderWidth: 3,
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                display: false
                                                            },
                                                            tooltip: {
                                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                                titleColor: '#fff',
                                                                bodyColor: '#fff',
                                                                padding: 12,
                                                                cornerRadius: 12,
                                                                titleFont: { size: 14, weight: 'bold' },
                                                                bodyFont: { size: 13 }
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                grid: {
                                                                    color: 'rgba(148, 163, 184, 0.1)',
                                                                },
                                                                ticks: {
                                                                    font: { size: 11, weight: 'bold' },
                                                                    color: '#64748b'
                                                                }
                                                            },
                                                            x: {
                                                                grid: {
                                                                    color: 'rgba(148, 163, 184, 0.1)',
                                                                },
                                                                ticks: {
                                                                    font: { size: 10, weight: 'bold' },
                                                                    color: '#64748b'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Table - Compact View */}
                                <div className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-[2rem] border border-slate-100 shadow-lg">
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                                            <FileText className="text-white" size={20} />
                                        </div>
                                        Detailed Records
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-100 rounded-xl">
                                                <tr>
                                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-tl-xl">Tool Name</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing/Usage Month</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Hits</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-tr-xl">Growth</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredData.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">API</div>
                                                                <span className="font-black text-slate-900 uppercase tracking-tight text-xs">{item.tool}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-sm font-black text-slate-900">{item.month.split(' ')[0]}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.month.split(' ')[1]}</p>
                                                        </td>
                                                        <td className="p-4 text-sm font-black text-blue-600">{item.usage}</td>
                                                        <td className="p-4"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">Verified</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {activeTab === 'users' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Details</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined On</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                            {activeTab === 'professionals' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Professional</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expertise</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Social Score</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                            {activeTab === 'invoices' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Ref</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Issued To</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th></>)}
                                            {activeTab === 'local-help' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category Name</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Types</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                            {activeTab === 'coupons' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Coupon</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Code</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                            {activeTab === 'referrals' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Referrer</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Number</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Area</th></>)}
                                            {activeTab === 'financial-aid' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Provider</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                            {activeTab === 'events' && (<><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Event</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Organizer</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th></>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">

                                        {filteredData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                                                {activeTab === 'users' && (<>
                                                    <td className="p-6">
                                                        <button
                                                            onClick={() => setSelectedUser(item)}
                                                            className="flex items-center gap-4 text-left hover:opacity-80 transition-all group/user"
                                                        >
                                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black group-hover/user:bg-blue-600 group-hover/user:text-white transition-all">
                                                                {item.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 group-hover/user:text-blue-600 transition-colors">{item.name}</p>
                                                                <p className="text-xs text-slate-500">{item.email}</p>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="p-6 text-sm font-bold text-slate-600">{item.phone}</td>
                                                    <td className="p-6 text-xs font-bold text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-6"><button onClick={() => handleDeleteUser(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>
                                                </>)}
                                                {activeTab === 'professionals' && (<>
                                                    <td className="p-6">
                                                        <button
                                                            onClick={() => setSelectedProfessional(item)}
                                                            className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity group"
                                                        >
                                                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black group-hover:bg-emerald-100 transition-colors">
                                                                {item.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                                                                <p className="text-xs text-slate-500">{item.number}</p>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {parseExperience(item.experience).map((exp, i) => (
                                                                    <div key={i} className="flex flex-col px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{exp.skill}</span>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-xs font-black text-blue-600 leading-none">{exp.years}</span>
                                                                            {exp.price && (
                                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                                                                    ₹{exp.price}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {item.pendingServices?.length > 0 && (
                                                                    <div className="flex flex-col px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                                            <Activity size={10} className="text-amber-500" />
                                                                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-tight">Pending Approval</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {item.pendingServices.map((ps, i) => (
                                                                                <span key={i} className="text-[10px] font-bold text-amber-800 bg-white/50 px-1.5 rounded-md border border-amber-100 italic">
                                                                                    {ps}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col gap-1">
                                                            {(() => {
                                                                const locs = item.locations || (item.location ? [item.location] : []);
                                                                if (locs.length === 0) return <span className="text-slate-300 italic text-xs">Not Set</span>;
                                                                return locs.map((loc, i) => (
                                                                    <span key={i} className="text-sm font-bold text-slate-600 capitalize">{loc}</span>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <button
                                                                onClick={() => setSelectedProfessional(item)}
                                                                className="flex items-center gap-1 text-amber-500 font-black hover:scale-110 transition-transform"
                                                            >
                                                                <Star size={14} className="fill-current" /> {item.rating || '0.0'}
                                                            </button>
                                                            <p className="text-[9px] text-slate-400 font-black uppercase">Social Score</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <button
                                                            onClick={() => handleDeleteProfessional(item._id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Delete Professional Record"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </>)}
                                                {activeTab === 'invoices' && (<>
                                                    <td className="p-6">
                                                        <button
                                                            onClick={() => setSelectedInvoice(item)}
                                                            className="text-left hover:opacity-80 transition-opacity"
                                                        >
                                                            <p className="font-black text-slate-900 uppercase tracking-tight hover:text-blue-600 transition-colors">{item.invoiceNumber}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                        </button>
                                                    </td>
                                                    <td className="p-6"><p className="font-bold text-slate-900">{item.client?.name}</p><p className="text-xs text-slate-500">{item.client?.phone}</p></td>
                                                    <td className="p-6 font-black text-slate-900 text-sm">₹{item.totals?.grandTotal}</td>
                                                    <td className="p-6"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Generated</span></td>
                                                </>)}
                                                {activeTab === 'local-help' && (<>
                                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">{item.name?.charAt(0)}</div><div><p className="font-bold text-slate-900">{item.name}</p></div></div></td>
                                                    <td className="p-6">
                                                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                                                            {item.services?.map((s, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-slate-100 text-[10px] font-bold text-slate-700 rounded-lg border border-slate-200">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                            {(!item.services || item.services.length === 0) && (
                                                                <span className="text-slate-300 italic text-xs">No Services Listed</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-sm font-bold text-slate-600 capitalize">Dynamic</td>
                                                    <td className="p-6">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingHelpId(item._id);
                                                                    setHelpFormData({ name: item.name, services: item.services.join(', ') });
                                                                    setIsManagingHelp(true);
                                                                }}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(item._id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>)}
                                                {activeTab === 'coupons' && (<>
                                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-8 bg-slate-100 rounded-lg overflow-hidden border border-slate-200"><img src={item.image} className="w-full h-full object-cover" /></div><div><p className="font-bold text-slate-900 line-clamp-1">{item.title}</p></div></div></td>
                                                    <td className="p-6 text-sm font-black text-blue-600 uppercase tracking-widest">{item.code}</td>
                                                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{item.active ? 'Active' : 'Draft'}</span></td>
                                                    <td className="p-6"><button onClick={() => handleDeleteCoupon(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>
                                                </>)}
                                                {activeTab === 'referrals' && (<>
                                                    <td className="p-6"><div className="flex flex-col"><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-blue-600 font-black uppercase tracking-widest">{item.service}</p></div></td>
                                                    <td className="p-6"><div className="flex flex-col"><p className="font-bold text-slate-900">{item.referrer?.name}</p><p className="text-xs text-slate-500">{item.referrer?.phone}</p></div></td>
                                                    <td className="p-6 text-sm font-bold text-slate-600">{item.number}</td>
                                                    <td className="p-6 text-sm font-bold text-slate-600 capitalize">{item.area}</td>
                                                </>)}
                                                {activeTab === 'financial-aid' && (<>
                                                    <td className="p-6"><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.location}</p></td>
                                                    <td className="p-6"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">{item.type}</span></td>
                                                    <td className="p-6 text-sm font-bold text-slate-600">{item.phone}</td>
                                                    <td className="p-6">
                                                        {item.isApproved ? (
                                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">Approved</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAidStatus(item._id, true)}
                                                                className="px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="p-6"><button onClick={() => handleDeleteAid(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>
                                                </>)}
                                                {activeTab === 'events' && (<>
                                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-10 h-8 bg-slate-100 rounded-lg overflow-hidden"><img src={item.image} className="w-full h-full object-cover" /></div><p className="font-bold text-slate-900 line-clamp-1">{item.title}</p></div></td>
                                                    <td className="p-6 text-xs font-bold text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                                                    <td className="p-6 text-sm font-bold text-slate-600">{item.location}</td>
                                                    <td className="p-6 text-sm font-bold text-slate-600">{item.organizer}</td>
                                                    <td className="p-6">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingEventId(item._id);
                                                                    setEventFormData({
                                                                        title: item.title,
                                                                        description: item.description,
                                                                        image: item.image,
                                                                        date: item.date.split('T')[0],
                                                                        location: item.location,
                                                                        organizer: item.organizer,
                                                                        link: item.link
                                                                    });
                                                                    setIsManagingEvent(true);
                                                                }}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button onClick={() => handleDeleteEvent(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Review Inspector Modal */}
            {selectedProfessional && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedProfessional(null)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedProfessional.name}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedProfessional.service} • {selectedProfessional.location}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedProfessional(null)}
                                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Client Testimonials</h4>
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                                    <Star size={18} className="text-amber-500 fill-current" />
                                    <span className="text-lg font-black text-amber-600">{selectedProfessional.rating}</span>
                                    <span className="text-xs text-amber-400 font-bold">Avg Rating</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedProfessional.reviews && selectedProfessional.reviews.length > 0 ? (
                                    selectedProfessional.reviews.map((rev, i) => (
                                        <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                                                        {rev.user?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{rev.user || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                            {new Date(rev.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star
                                                            key={idx}
                                                            size={12}
                                                            className={idx < rev.rating ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed italic font-medium">"{rev.comment}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-slate-400 font-bold italic">No reviews recorded yet for this professional.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900 flex justify-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Verified Records Internal Access Only</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Coupon Modal */}
            <AnimatePresence>
                {isAddingCoupon && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingCoupon(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <Ticket size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Create Coupon</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Add new deal to rewards page</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddingCoupon(false)}
                                    className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCoupon} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        required
                                        value={couponFormData.title}
                                        onChange={e => setCouponFormData({ ...couponFormData, title: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                    />
                                    <textarea
                                        placeholder="Description"
                                        required
                                        value={couponFormData.description}
                                        onChange={e => setCouponFormData({ ...couponFormData, description: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 h-28"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Image Setup</p>
                                            <div className="relative group overflow-hidden bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all">
                                                {couponFormData.imagePreview || couponFormData.image ? (
                                                    <>
                                                        <img src={couponFormData.imagePreview || couponFormData.image} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Upload size={24} className="text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={24} className="text-slate-300 mb-2" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Click to upload<br />coupon image</p>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4 flex flex-col justify-end">
                                            <input
                                                type="text"
                                                placeholder="Coupon Code"
                                                required
                                                value={couponFormData.code}
                                                onChange={e => setCouponFormData({ ...couponFormData, code: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Or Image URL"
                                                value={couponFormData.image}
                                                onChange={e => setCouponFormData({ ...couponFormData, image: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Key Points (comma separated)"
                                        required
                                        value={couponFormData.keyPoints}
                                        onChange={e => setCouponFormData({ ...couponFormData, keyPoints: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Save Coupon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCoupon(false)}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all font-black"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)} />
                    <div className="relative bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <button onClick={() => setSelectedInvoice(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><XCircle size={24} /></button>
                        <div className="space-y-6">
                            <div className="border-b border-slate-200 pb-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center"><FileText className="text-white" size={24} /></div><div><h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedInvoice.invoiceNumber}</h3><p className="text-xs md:text-sm text-slate-500 font-bold">Invoice Details</p></div></div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-slate-50 p-4 md:p-6 rounded-2xl"><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">From</h4><p className="font-black text-slate-900 text-lg mb-1">{selectedInvoice.business?.name}</p><p className="text-sm text-slate-600">{selectedInvoice.business?.address}</p><p className="text-sm text-slate-600 mt-2">{selectedInvoice.business?.phone}</p><p className="text-sm text-slate-600">{selectedInvoice.business?.email}</p></div><div className="bg-blue-50 p-4 md:p-6 rounded-2xl"><h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Billed To</h4><p className="font-black text-slate-900 text-lg mb-1">{selectedInvoice.client?.name}</p><p className="text-sm text-slate-600">{selectedInvoice.client?.address}</p><p className="text-sm text-slate-600 mt-2">{selectedInvoice.client?.phone}</p><p className="text-sm text-slate-600">{selectedInvoice.client?.email}</p></div></div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Issue Date</p><p className="font-bold text-slate-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p></div><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Due Date</p><p className="font-bold text-slate-900">{selectedInvoice.dueDate || 'N/A'}</p></div><div className="col-span-2 md:col-span-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p><span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Generated</span></div></div>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden"><table className="w-full"><thead className="bg-slate-900 text-white"><tr><th className="p-3 md:p-4 text-left text-[10px] font-black uppercase tracking-widest">Item</th><th className="p-3 md:p-4 text-center text-[10px] font-black uppercase tracking-widest">Qty</th><th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Rate</th><th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{selectedInvoice.items?.map((item, idx) => (<tr key={idx} className="hover:bg-slate-50"><td className="p-3 md:p-4"><p className="font-bold text-slate-900 text-sm">{item.description}</p></td><td className="p-3 md:p-4 text-center font-bold text-slate-600">{item.quantity}</td><td className="p-3 md:p-4 text-right font-bold text-slate-600">₹{item.unitPrice}</td><td className="p-3 md:p-4 text-right font-black text-slate-900">₹{item.total}</td></tr>))}</tbody><tfoot className="bg-slate-50"><tr><td colSpan="3" className="p-4 text-right font-black text-slate-900 uppercase tracking-tight">Total Amount</td><td className="p-4 text-right font-black text-blue-600 text-xl">₹{selectedInvoice.totals?.grandTotal}</td></tr></tfoot></table></div>
                            {selectedInvoice.notes && (<div className="bg-amber-50 p-4 md:p-6 rounded-2xl border border-amber-200"><h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Notes</h4><p className="text-sm text-slate-700">{selectedInvoice.notes}</p></div>)}
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] p-6 md:p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                <XCircle size={24} />
                            </button>

                            <div className="space-y-8">
                                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-200 overflow-hidden">
                                        {selectedUser.profilePicture ? (
                                            <img src={selectedUser.profilePicture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            selectedUser.name?.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedUser.name}</h3>
                                        <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                                            <Clock size={14} className="text-blue-500" /> Joined {new Date(selectedUser.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</p>
                                        <p className="font-bold text-slate-900 flex items-center gap-2 truncate"><Mail size={16} className="text-blue-500 shrink-0" /> {selectedUser.email || 'No email provided'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</p>
                                        <p className="font-bold text-slate-900 flex items-center gap-2"><Phone size={16} className="text-blue-500" /> {selectedUser.phone}</p>
                                    </div>
                                </div>

                                {selectedUser.businessProfile && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                            <Briefcase size={14} /> Business Profile Informative
                                        </h4>
                                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Company Name</p>
                                                        <h5 className="text-2xl font-black text-white">{selectedUser.businessProfile.name || 'Not Named'}</h5>
                                                    </div>
                                                    {selectedUser.businessProfile.logoData && (
                                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-white/20">
                                                            <img src={selectedUser.businessProfile.logoData} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Business Contact</p>
                                                        <p className="font-bold text-sm">{selectedUser.businessProfile.phone || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Business Email</p>
                                                        <p className="font-bold text-sm truncate">{selectedUser.businessProfile.email || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Office Address</p>
                                                        <p className="font-bold text-sm leading-relaxed">{selectedUser.businessProfile.address || 'No address provided'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Abstract background shapes */}
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-50">
                                    <button
                                        onClick={() => {
                                            handleDeleteUser(selectedUser._id);
                                            setSelectedUser(null);
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all group"
                                    >
                                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                        Delete User Account
                                    </button>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Internal System ID: {selectedUser._id}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Local Help Category Modal */}
            <AnimatePresence>
                {isManagingHelp && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsManagingHelp(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                            {editingHelpId ? 'Edit Category' : 'Add Category'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Configure local help categories</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsManagingHelp(false)}
                                    className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCategoryAction} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. House Needs"
                                            required
                                            value={helpFormData.name}
                                            onChange={e => setHelpFormData({ ...helpFormData, name: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Service Types (Comma Separated)</label>
                                        <textarea
                                            placeholder="e.g. Electrician, Plumber, Painter"
                                            required
                                            value={helpFormData.services}
                                            onChange={e => setHelpFormData({ ...helpFormData, services: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 h-32"
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold italic ml-2 mt-1">Separate each service with a comma.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        {editingHelpId ? 'Update Category' : 'Create Category'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsManagingHelp(false)}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all font-black"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Management Modal */}
            <AnimatePresence>
                {isManagingEvent && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsManagingEvent(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                            {editingEventId ? 'Edit Event' : 'Add New Event'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Local community happenings</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsManagingEvent(false)}
                                    className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleEventAction} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Event Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={eventFormData.title}
                                                onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                                                placeholder="Summer Music Fest"
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Location</label>
                                            <input
                                                type="text"
                                                required
                                                value={eventFormData.location}
                                                onChange={e => setEventFormData({ ...eventFormData, location: e.target.value })}
                                                placeholder="Central Park, NY"
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={eventFormData.date}
                                                onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Organizer</label>
                                            <input
                                                type="text"
                                                value={eventFormData.organizer}
                                                onChange={e => setEventFormData({ ...eventFormData, organizer: e.target.value })}
                                                placeholder="Community Club"
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Image Setup</label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative group w-full md:w-1/2 aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-orange-500 transition-all">
                                            {eventFormData.imagePreview || eventFormData.image ? (
                                                <img src={eventFormData.imagePreview || eventFormData.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <Upload size={24} className="text-slate-300 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload image</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const objectUrl = URL.createObjectURL(file);
                                                        setImageToCrop(objectUrl);
                                                        setCropShape('rect');
                                                        setShowCropModal(true);
                                                        window._croppingTarget = 'event';
                                                    }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Or External Image URL"
                                                value={eventFormData.image}
                                                onChange={e => setEventFormData({ ...eventFormData, image: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-sm text-slate-800"
                                            />
                                            <p className="text-[9px] text-slate-400 font-bold italic ml-2">Landscape images (16:9) work best for events.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                                    <textarea
                                        required
                                        rows="3"
                                        value={eventFormData.description}
                                        onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })}
                                        placeholder="Tell us more about the event..."
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-slate-800 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">External Link (Optional)</label>
                                    <input
                                        type="url"
                                        value={eventFormData.link}
                                        onChange={e => setEventFormData({ ...eventFormData, link: e.target.value })}
                                        placeholder="https://event-website.com"
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                    />
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-100 hover:bg-orange-700 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        {editingEventId ? 'Update Event Record' : 'Publish Event'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsManagingEvent(false)}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all font-black"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Skill Suggestions Modal */}
            <SkillSuggestionsModal
                isOpen={isManagingSkills}
                onClose={() => setIsManagingSkills(false)}
                pendingSkills={pendingSkillsList}
                onApprove={handleApproveSkill}
                onReject={handleRejectSkill}
            />

            {/* Crop Modal */}
            <CropModal
                isOpen={showCropModal}
                image={imageToCrop}
                shape={cropShape}
                onClose={() => {
                    setShowCropModal(false);
                    if (imageToCrop.startsWith('blob:')) URL.revokeObjectURL(imageToCrop);
                }}
                onCropComplete={(croppedData) => {
                    if (window._croppingTarget === 'event') {
                        setEventFormData({
                            ...eventFormData,
                            imageFile: dataURLtoFile(croppedData, 'event.png'),
                            imagePreview: croppedData
                        });
                        delete window._croppingTarget;
                    } else {
                        setCouponFormData({
                            ...couponFormData,
                            imageFile: dataURLtoFile(croppedData, 'coupon.png'),
                            imagePreview: croppedData
                        });
                    }
                    setShowCropModal(false);
                    if (imageToCrop.startsWith('blob:')) URL.revokeObjectURL(imageToCrop);
                }}
                onShapeChange={setCropShape}
                getCroppedImg={getCroppedImg}
            />

        </div>
    );
};

const CropModal = ({ isOpen, image, shape, onClose, onCropComplete, onShapeChange, getCroppedImg }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropCompleteInternal = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleSave = async () => {
        if (!image || !croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, shape === 'round');
            onCropComplete(croppedImage);
        } catch (e) {
            console.error('Crop Error:', e);
            alert('Failed to crop image. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 uppercase">Crop Image</h2>
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
                            aspect={shape === 'round' ? 1 : 360 / 176}
                            cropShape={shape === 'round' ? 'round' : 'rect'}
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropCompleteInternal}
                        />
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zoom</span>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 accent-blue-600"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                            >
                                Apply Crop
                            </button>
                            <button
                                onClick={onClose}
                                className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const SkillSuggestionsModal = ({ isOpen, onClose, pendingSkills, onApprove, onReject }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Sparkles className="text-blue-600" size={24} /> Skill <span className="text-blue-600">Suggestions</span>
                            </h2>
                            <p className="text-slate-500 font-bold text-xs mt-1">Review and approve custom skills from professionals</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition-all"
                        >
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {pendingSkills.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900">No Pending Suggestions</h3>
                                <p className="text-slate-500 font-medium">Everything is up to date!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {pendingSkills.map((pro) => (
                                    <div key={pro._id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900">{pro.name}</h4>
                                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{pro.number}</p>
                                            </div>
                                            <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                {pro.pendingServices.length} New Skill{pro.pendingServices.length > 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4">
                                            {pro.pendingServices.map((skill, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex-1 min-w-[280px]"
                                                >
                                                    <div className="flex-1 font-black text-slate-800 uppercase tracking-tight text-sm">
                                                        {skill}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => onApprove(pro._id, skill)}
                                                            className="w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl flex items-center justify-center transition-all group"
                                                            title="Approve Skill"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => onReject(pro._id, skill)}
                                                            className="w-10 h-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                                                            title="Reject Skill"
                                                        >
                                                            <Plus size={20} className="rotate-45" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const MessageSquare = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const Sparkles = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>;
const Star = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const Loader2 = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
const Menu = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;

export default AdminDashboard;
