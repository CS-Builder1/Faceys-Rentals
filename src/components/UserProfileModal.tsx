import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom'
import { 
  X, 
  User, 
  History, 
  Settings, 
  Shield, 
  ShieldCheck,
  LogOut, 
  Trash2, 
  Key, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  MessageSquare,
  Sun,
  Moon,
  Bell,
  DollarSign
} from 'lucide-react';
import { UserRole, type User as UserProfile, type Event, type Quote } from '../types';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/eventService';
import { quoteService } from '../services/quoteService';
import { format } from 'date-fns';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdate?: () => void;
  allowRoleEdit?: boolean;
}

type TabType = 'profile' | 'history' | 'settings' | 'security';

function UserProfileModal({ isOpen, onClose, user, onUpdate, allowRoleEdit = false }: UserProfileModalProps) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // History data
  const [events, setEvents] = useState<Event[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        hourlyRate: user.hourlyRate || 0,
      });
      setError(null);
      setSuccessMessage(null);
      setActiveTab('profile');
      
      if (user.role === UserRole.Client) {
        fetchHistory(user.id, user.email);
      }
    }
  }, [user]);

  const fetchHistory = async (userId: string, email: string) => {
    setIsLoadingHistory(true);
    try {
      const [userEvents] = await Promise.all([
        eventService.getByClient(userId),
      ]);
      setEvents(userEvents);
      // For now, quotes are indexed by eventId, but we might want all booking requests by email
      const allQuotes = await quoteService.getAll();
      const filteredQuotes = allQuotes.filter(q => q.customerEmail === email);
      setQuotes(filteredQuotes);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userRef = doc(db, 'users', user.id);
      const updates: any = {
        name: formData.name,
        phone: formData.phone,
        updatedAt: new Date().toISOString(),
      };

      if (allowRoleEdit) {
        updates.role = formData.role;
        updates.hourlyRate = Number(formData.hourlyRate);
      }

      await updateDoc(userRef, updates);
      
      const finalRole = (allowRoleEdit ? formData.role : user.role) as UserRole;
      const staffRoles = [UserRole.Staff, UserRole.Admin, UserRole.Owner, UserRole.Marketing, UserRole.Accountant];
      const isStaffRole = staffRoles.includes(finalRole);
      const isClientRole = finalRole === UserRole.Client;

      if (isClientRole) {
        // Upsert customer record
        const customerRef = doc(db, 'customers', user.id);
        const createdAt = user.createdAt
          ? ((user.createdAt as any).toDate ? (user.createdAt as any).toDate().toISOString() : new Date(user.createdAt).toISOString())
          : new Date().toISOString();
        await setDoc(customerRef, {
          contactName: formData.name,
          email: user.email,
          phone: formData.phone || '',
          status: 'active',
          updatedAt: new Date().toISOString(),
          createdAt: createdAt,
        }, { merge: true });

        // Always purge stale employee record when role is Client
        if (allowRoleEdit) {
          try {
            await deleteDoc(doc(db, 'employees', user.id));
          } catch (cleanupError) {
            console.warn('Unable to delete stale employee record:', cleanupError);
          }
        }
      } else if (isStaffRole) {
        // Upsert employee record
        const employeeRef = doc(db, 'employees', user.id);
        await setDoc(employeeRef, {
          fullName: formData.name,
          email: user.email,
          phone: formData.phone || '',
          role: finalRole,
          hourlyRate: Number(formData.hourlyRate || 0),
        }, { merge: true });

        // Always purge stale customer record when role is a staff role
        if (allowRoleEdit) {
          try {
            await deleteDoc(doc(db, 'customers', user.id));
          } catch (cleanupError) {
            console.warn('Unable to delete stale customer record:', cleanupError);
          }
        }
      }

      setSuccessMessage('Profile updated successfully!');
      onUpdate?.();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setIsResettingPassword(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccessMessage(`Password reset email sent to ${user.email}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the profile for ${user.name}? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'users', user.id));
      
      if (user.role === UserRole.Client) {
        await deleteDoc(doc(db, 'customers', user.id));
      }

      if ([UserRole.Staff, UserRole.Admin, UserRole.Owner].includes(user.role)) {
        await deleteDoc(doc(db, 'employees', user.id)).catch(() => {});
      }

      onUpdate?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Account <span className="text-primary">Settings</span>
              </h2>
              <p className="text-slate-500 text-xs font-medium">Manage your profile and preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
          </button>
        </div>

        <div className="flex flex-col h-[550px]">
          {/* Top Tabs Navigation */}
          <div className="flex px-4 border-b dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-x-auto scrollbar-hide">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              ...(user.role === UserRole.Client ? [{ id: 'history', label: 'History', icon: History }] : []),
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'security', label: 'Security', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50/30 dark:bg-transparent">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all underline-none outline-none shadow-sm"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email (Read-only)</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="email"
                        value={formData.email || ''}
                        disabled
                        className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-400 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all underline-none outline-none shadow-sm"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  {allowRoleEdit && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Role</label>
                        <div className="relative group">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none shadow-sm cursor-pointer"
                          >
                            {Object.values(UserRole).map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {formData.role !== UserRole.Client && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hourly Rate ($)</label>
                          <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                              type="number"
                              value={formData.hourlyRate || 0}
                              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none shadow-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Booking History
                  </h3>
                  <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-tighter">
                    {events.length + quotes.length} Records
                  </span>
                </div>

                {isLoadingHistory ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Fetching history...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {events.length === 0 && quotes.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] bg-white/50 dark:bg-slate-800/10">
                        <History className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No previous record found.</p>
                        <button 
                          onClick={onClose}
                          className="mt-4 text-primary font-black text-xs uppercase tracking-widest hover:underline"
                        >
                          Explore Rentals →
                        </button>
                      </div>
                    ) : (
                      <>
                        {events.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Confirmed Rentals</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {events.map((event) => (
                                <div key={event.id} className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 hover:border-primary/30 transition-all group relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
                                  <div className="flex justify-between items-start mb-4 relative z-10">
                                      <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-base">
                                          {event.eventType ? event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1) : 'Rental'} Event at {event.venueAddress}
                                        </h5>
                                        <p className="text-xs text-slate-500 font-medium mt-1">{format(new Date(event.eventDate), 'PPP')}</p>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        event.status === 'confirmed' 
                                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' 
                                          : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
                                      }`}>
                                        {event.status}
                                      </span>
                                    </div>
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 relative z-10 flex-wrap gap-2">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">Confirmed Status</span>
                                    <div className="flex items-center gap-3">
                                      <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Download Invoice</button>
                                      <Link 
                                        to="/catalog" 
                                        onClick={onClose}
                                        className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                      >
                                        Book Again
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {quotes.length > 0 && (
                          <div className="space-y-4 pt-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Quotes & Inquiries</h4>
                            <div className="grid grid-cols-1 gap-3">
                              {quotes.map((quote) => (
                                <div key={quote.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/30 flex items-center justify-between group hover:border-blue-400/30 transition-all flex-wrap gap-3">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                                      <MessageSquare className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {quote.eventType ? quote.eventType.charAt(0).toUpperCase() + quote.eventType.slice(1) : 'Rental'} Quote
                                      </h5>
                                      <p className="text-[10px] text-slate-500 font-medium">{format(new Date(quote.createdAt), 'PP')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-auto">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                      {quote.status}
                                    </span>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Revive Quote</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-5 rounded-[1.5rem] border-2 border-primary bg-primary/5 flex flex-col items-center gap-3 transition-all">
                      <Sun className="w-6 h-6 text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-primary">Light</span>
                    </button>
                    <button className="p-5 rounded-[1.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 flex flex-col items-center gap-3 hover:border-primary/50 transition-all group">
                      <Moon className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary">Dark</span>
                    </button>
                    <button className="p-5 rounded-[1.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 flex flex-col items-center gap-3 hover:border-primary/50 transition-all group">
                      <Settings className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary">System</span>
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'email', label: 'Email Alerts', desc: 'Get booking & payout updates via email', icon: Mail, color: 'blue', active: true },
                      { id: 'sms', label: 'SMS Alerts', desc: 'Urgent task and booking reminders', icon: Bell, color: 'emerald', active: false }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-white/10 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 bg-${item.color}-50 dark:bg-${item.color}-500/10 rounded-xl`}>
                            <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.label}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${item.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${item.active ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access & Recovery</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] border border-blue-100 dark:border-blue-500/10 bg-blue-50/30 dark:bg-blue-500/5 space-y-4">
                      <div className="p-3 bg-blue-500 text-white w-fit rounded-2xl shadow-lg shadow-blue-500/20">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Key Management</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Reset credentials via secure email</p>
                      </div>
                      <button
                        onClick={handlePasswordReset}
                        disabled={isResettingPassword}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Reset Password
                      </button>
                    </div>

                    <div className="p-6 rounded-[2rem] border border-orange-100 dark:border-orange-500/10 bg-orange-50/30 dark:bg-orange-500/5 space-y-4">
                      <div className="p-3 bg-orange-500 text-white w-fit rounded-2xl shadow-lg shadow-orange-500/20">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Session Termination</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Securely sign out of this device</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                      >
                        Terminate Session
                      </button>
                    </div>
                  </div>
                </section>

                <section className="pt-8 border-t border-red-100 dark:border-red-900/20">
                  <div className="p-6 rounded-[2rem] bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20">
                    <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
                      <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-full h-fit border-4 border-white dark:border-slate-900 shadow-md">
                        <Trash2 className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-black text-red-600 uppercase tracking-widest text-sm">Account Deletion</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          Permanently remove your account and all associated booking history. This action cannot be undone.
                        </p>
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="mt-3 inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.1em] hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:translate-y-0.5 disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        {/* Global Notifications inside Modal */}
        {error && (
          <div className="mx-8 mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <Shield className="w-5 h-5" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mx-8 mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-100/20 text-emerald-600 text-sm font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <ShieldCheck className="w-5 h-5" />
            {successMessage}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default UserProfileModal;
