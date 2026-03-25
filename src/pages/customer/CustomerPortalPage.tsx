import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Event, Quote, UserRole, Client, Invoice } from '../../types';
import { eventService } from '../../services/eventService';
import { quoteService } from '../../services/quoteService';
import { clientService } from '../../services/clientService';
import { invoiceService } from '../../services/invoiceService';
import { User, ShieldCheck, Mail, Phone, Lock, LogOut, Save, Loader2, MessageSquare, Briefcase, Calendar, MapPin, CheckCircle2, AlertCircle, Building2, CreditCard, FileText } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { format, isBefore, startOfToday } from 'date-fns';

export default function CustomerPortalPage() {
    const { userProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'quotes' | 'security'>('bookings');
    
    // Data states
    const [clientData, setClientData] = useState<Client | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [invoices, setInvoices] = useState<Record<string, Invoice[]>>({});
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        businessName: '',
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingZip: '',
        preferredContact: 'email',
        referralSource: '',
        specialNotes: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const fetchData = useCallback(async () => {
        if (!userProfile) return;
        setIsLoading(true);
        try {
            // Fetch comprehensive client profile
            const clientDoc = await clientService.getById(userProfile.id);
            if (clientDoc) {
                setClientData(clientDoc);
                setFormData({
                    name: clientDoc.contactName || userProfile.name || '',
                    phone: clientDoc.phone || userProfile.phone || '',
                    businessName: clientDoc.businessName || '',
                    billingAddress: clientDoc.billingAddress || '',
                    billingCity: clientDoc.billingCity || '',
                    billingState: clientDoc.billingState || '',
                    billingZip: clientDoc.billingZip || '',
                    preferredContact: clientDoc.preferredContact || 'email',
                    referralSource: clientDoc.referralSource || '',
                    specialNotes: clientDoc.specialNotes || ''
                });
            } else {
                // Fallback for missing customer doc
                setFormData(prev => ({ ...prev, name: userProfile.name || '', phone: userProfile.phone || '' }));
            }

            // Fetch Events
            const userEvents = await eventService.getByClient(userProfile.id);
            setEvents(userEvents);

            // Fetch Invoices for those Events
            const invoicesMap: Record<string, Invoice[]> = {};
            await Promise.all(
                userEvents.map(async (ev) => {
                    const evInvoices = await invoiceService.getByEvent(ev.id);
                    invoicesMap[ev.id] = evInvoices;
                })
            );
            setInvoices(invoicesMap);
            
            // Fetch Quotes (Try by clientId first, fallback to email if necessary)
            // Using resilient approach: get by clientId, if none, maybe by email
            let userQuotes = await quoteService.getByClient(userProfile.id);
            if (userQuotes.length === 0 && userProfile.email) {
                 const allQuotes = await quoteService.getAll();
                 userQuotes = allQuotes.filter(q => q.customerEmail === userProfile.email);
            }
            setQuotes(userQuotes);
        } catch (err) {
            console.error("Error fetching data:", err);
            setMsg({ text: 'Failed to load your history.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        if (userProfile && userProfile.role === UserRole.Client) {
            fetchData();
        }
    }, [userProfile, fetchData]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;
        setIsSaving(true);
        setMsg({ text: '', type: '' });

        try {
            // Update User Doc
            await updateDoc(doc(db, 'users', userProfile.id), {
                name: formData.name,
                phone: formData.phone,
                updatedAt: new Date().toISOString()
            });

            // Update or Create Customer Doc
            if (clientData) {
                await updateDoc(doc(db, 'customers', userProfile.id), {
                    contactName: formData.name,
                    phone: formData.phone,
                    businessName: formData.businessName,
                    billingAddress: formData.billingAddress,
                    billingCity: formData.billingCity,
                    billingState: formData.billingState,
                    billingZip: formData.billingZip,
                    preferredContact: formData.preferredContact,
                    referralSource: formData.referralSource,
                    specialNotes: formData.specialNotes,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Should exist but just in case
                console.warn("Client doc not found during save, might need manual creation if rule blocks.");
            }

            setMsg({ text: 'Profile updated successfully!', type: 'success' });
        } catch (err: any) {
            console.error(err);
            setMsg({ text: err.message || 'Failed to update profile.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!userProfile?.email) return;
        try {
            await sendPasswordResetEmail(auth, userProfile.email);
            setMsg({ text: 'Password reset link sent to your email.', type: 'success' });
        } catch (err: any) {
            setMsg({ text: err.message || 'Failed to send reset email.', type: 'error' });
        }
    };

    if (!userProfile || userProfile.role !== UserRole.Client) {
        return (
            <div className="min-h-screen py-32 bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    const today = startOfToday();
    const upcomingEvents = events.filter(e => !isBefore(new Date(e.eventDate), today));
    const pastEvents = events.filter(e => isBefore(new Date(e.eventDate), today));

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': case 'completed': case 'paid': case 'accepted':
                return 'bg-emerald-100 text-emerald-700';
            case 'inquiry': case 'quoted': case 'sent': case 'unpaid':
                return 'bg-amber-100 text-amber-700';
            case 'cancelled': case 'expired': case 'overdue':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-200 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen py-24 bg-slate-50 dark:bg-background-dark p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-ocean-deep text-white rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-lg shadow-ocean-deep/20">
                            {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                    Welcome back, <span className="text-primary">{userProfile.name?.split(' ')[0] || 'Guest'}</span>
                                </h1>
                                {auth.currentUser?.emailVerified && (
                                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Verified
                                    </div>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium">Manage your rentals, quotes, and account details.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center min-w-[120px]">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Bookings</p>
                            <p className="text-2xl font-black text-ocean-deep">{events.length}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center min-w-[120px]">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Quotes</p>
                            <p className="text-2xl font-black text-ocean-deep">{quotes.length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="space-y-2">
                        {[
                            { id: 'bookings', label: 'My Bookings', icon: Briefcase },
                            { id: 'quotes', label: 'My Quotes', icon: MessageSquare },
                            { id: 'profile', label: 'Profile Settings', icon: User },
                            { id: 'security', label: 'Security & Access', icon: ShieldCheck },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100'
                                        : 'bg-white dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10'
                                }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-primary'}`} />
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all mt-4 border border-red-100"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="col-span-1 md:col-span-3">
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-white/10 min-h-[500px]">
                            
                            {msg.text && (
                                <div className={`mb-6 p-4 rounded-2xl text-sm font-bold border ${msg.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                    {msg.text}
                                </div>
                            )}

                            {isLoading ? (
                                <div className="h-full flex items-center justify-center min-h-[400px]">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'bookings' && (
                                        <div className="space-y-8">
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Bookings</h2>
                                            
                                            {/* Upcoming Events */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Upcoming</h3>
                                                {upcomingEvents.length === 0 ? (
                                                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                        <p className="text-slate-500 font-medium">No upcoming bookings.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-4">
                                                        {upcomingEvents.map((event) => (
                                                            <BookingCard key={event.id} event={event} invoices={invoices[event.id]} getStatusColor={getStatusColor} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Past Events */}
                                            {pastEvents.length > 0 && (
                                                <div className="space-y-4 pt-8 border-t border-slate-100">
                                                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Past History</h3>
                                                    <div className="grid gap-4">
                                                        {pastEvents.map((event) => (
                                                            <BookingCard key={event.id} event={event} invoices={invoices[event.id]} getStatusColor={getStatusColor} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'quotes' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Quotes</h2>
                                            {quotes.length === 0 ? (
                                                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                    <p className="text-slate-500 font-medium">No quotes found.</p>
                                                    <p className="text-slate-400 text-sm mt-2">Ready for an event? Reach out to start a new quote.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-6">
                                                    {quotes.map((quote) => (
                                                        <QuoteCard key={quote.id} quote={quote} getStatusColor={getStatusColor} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'profile' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Profile Settings</h2>
                                            <form onSubmit={handleSaveProfile} className="space-y-8">
                                                
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
                                                        <div className="relative group">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Jane Doe" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Business/Company (Optional)</label>
                                                        <div className="relative group">
                                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="text" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Acme Corp" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                                                        <div className="relative group">
                                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="(555) 123-4567" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Preferred Contact</label>
                                                        <div className="relative group">
                                                            <select value={formData.preferredContact} onChange={(e) => setFormData({...formData, preferredContact: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none">
                                                                <option value="email">Email</option>
                                                                <option value="phone">Phone Call</option>
                                                                <option value="text">Text Message (SMS)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                                    <h3 className="text-lg font-bold text-slate-900">Billing Information</h3>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Street Address</label>
                                                        <div className="relative group">
                                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="text" value={formData.billingAddress} onChange={(e) => setFormData({...formData, billingAddress: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="123 Event Way" />
                                                        </div>
                                                    </div>
                                                    <div className="grid md:grid-cols-3 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">City</label>
                                                            <input type="text" value={formData.billingCity} onChange={(e) => setFormData({...formData, billingCity: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="City" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">State / Province</label>
                                                            <input type="text" value={formData.billingState} onChange={(e) => setFormData({...formData, billingState: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="State" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Postal Code</label>
                                                            <input type="text" value={formData.billingZip} onChange={(e) => setFormData({...formData, billingZip: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="12345" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                                    <h3 className="text-lg font-bold text-slate-900">Additional Details</h3>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">How did you hear about us?</label>
                                                        <select value={formData.referralSource} onChange={(e) => setFormData({...formData, referralSource: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none">
                                                            <option value="">Select an option</option>
                                                            <option value="google">Google Search</option>
                                                            <option value="social">Social Media</option>
                                                            <option value="friend">Friend / Referral</option>
                                                            <option value="event">Attended an Event</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Special Notes / Dietary Preferences</label>
                                                        <textarea value={formData.specialNotes} onChange={(e) => setFormData({...formData, specialNotes: e.target.value})} rows={3} className="w-full px-4 py-4 bg-slate-50 border rounded-2xl text-ocean-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Any standing requirements for your events..." />
                                                    </div>
                                                </div>

                                                <button type="submit" disabled={isSaving} className="px-8 py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center w-full md:w-auto gap-2 hover:bg-primary/90 transition-all">
                                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                    Save Changes
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {activeTab === 'security' && (
                                        <div className="space-y-8 max-w-xl">
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Security & Access</h2>
                                            
                                            <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50 space-y-6">
                                                
                                                <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-slate-200 rounded-2xl text-slate-600">
                                                            <Mail className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-ocean-deep">Email Address</h3>
                                                            <p className="text-sm font-medium text-slate-500">{userProfile.email}</p>
                                                        </div>
                                                    </div>
                                                    {auth.currentUser?.emailVerified ? (
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3"/> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3"/> Unverified
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                                                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                                                        <Lock className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-ocean-deep">Password</h3>
                                                        <p className="text-sm text-slate-500 mb-3">Update your password via a secure email link.</p>
                                                        <button onClick={handleResetPassword} className="w-full py-3 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-blue-600 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                                            Send Reset Link
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                     <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-ocean-deep">Member Since</h3>
                                                        <p className="text-sm font-medium text-slate-500">
                                                            {userProfile.createdAt ? format((userProfile.createdAt as any).toDate ? (userProfile.createdAt as any).toDate() : new Date(userProfile.createdAt), 'MMMM do, yyyy') : 'Recently joined'}
                                                        </p>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BookingCard({ event, invoices, getStatusColor }: { event: Event, invoices?: Invoice[], getStatusColor: (s:string)=>string }) {
    const mainInvoice = invoices && invoices.length > 0 ? invoices[0] : null;

    return (
        <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-start">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                        <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-ocean-deep text-lg capitalize">{event.eventType} Booking</h3>
                        <p className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                            {format(new Date(event.eventDate), 'PPP')} <span className="text-slate-300">•</span> {event.startTime} - {event.endTime}
                        </p>
                    </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(event.status)}`}>
                    {event.status}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                    <p className="text-sm text-slate-600">{event.venueAddress || 'No venue provided'}</p>
                </div>
                {mainInvoice && (
                    <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400 mt-1" />
                        <p className="text-sm text-slate-600">Total: <strong>${mainInvoice.total.toFixed(2)}</strong> <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(mainInvoice.status)}`}>{mainInvoice.status}</span></p>
                    </div>
                )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end">
                <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                     View Complete Details
                </button>
            </div>
        </div>
    );
}

function QuoteCard({ quote, getStatusColor }: { quote: Quote, getStatusColor: (s:string)=>string }) {
    return (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-ocean-deep text-lg flex items-center gap-2">
                            {quote.eventType ? quote.eventType.charAt(0).toUpperCase() + quote.eventType.slice(1) : 'Rental'} Request
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(quote.status)}`}>
                                {quote.status}
                            </span>
                        </h3>
                        <p className="text-slate-400 text-sm mt-1 font-medium">Requested on {format(new Date(quote.createdAt), 'PPP')}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {quote.eventDate && (
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Event Date</p>
                                    <p className="text-sm font-semibold text-slate-700">{format(new Date(quote.eventDate), 'PPP')}</p>
                                </div>
                            )}
                            {quote.guestCount && (
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Guests</p>
                                    <p className="text-sm font-semibold text-slate-700">{quote.guestCount}</p>
                                </div>
                            )}
                            {quote.venue && (
                                <div className="space-y-1 col-span-2">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Location</p>
                                    <p className="text-sm font-semibold text-slate-700">{quote.venue}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end justify-between h-full min-h-[120px]">
                    <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 inline-block min-w-[140px]">
                         <p className="text-xs text-slate-400 uppercase font-bold mb-1 border-b border-slate-200 pb-1">Quote Total</p>
                         <p className="text-2xl font-black text-ocean-deep">
                             {quote.total > 0 ? `$${quote.total.toFixed(2)}` : 'Pending'}
                         </p>
                    </div>
                    
                    {quote.pdfUrl && (
                        <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline mt-4 inline-block">
                            Download PDF Version
                        </a>
                    )}
                </div>
            </div>
            
            {quote.items && quote.items.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Requested Items:</p>
                    <div className="flex flex-wrap gap-2">
                        {quote.items.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                                {item.quantity}x {item.name || 'Item'}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
