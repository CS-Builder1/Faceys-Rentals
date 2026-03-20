import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Trash2, Save, Loader2, DollarSign, Key, LogOut } from 'lucide-react';
import { UserRole, type User as UserProfile } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdate?: () => void;
  allowRoleEdit?: boolean;
}

export default function UserProfileModal({ isOpen, onClose, user, onUpdate, allowRoleEdit = false }: UserProfileModalProps) {
  const { logout, userProfile: currentUser } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isOwnProfile = currentUser?.id === user.id;

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
      
      // If client, also update customers collection
      if (user.role === UserRole.Client) {
        const customerRef = doc(db, 'customers', user.id);
        await updateDoc(customerRef, {
          contactName: formData.name,
          phone: formData.phone,
          updatedAt: new Date().toISOString(),
        });
      }

      // If staff-like role, also update employees collection
      if ([UserRole.Staff, UserRole.Admin, UserRole.Owner].includes(user.role)) {
        const employeeRef = doc(db, 'employees', user.id);
        await updateDoc(employeeRef, {
          fullName: formData.name,
          phone: formData.phone,
          role: formData.role,
          hourlyRate: Number(formData.hourlyRate),
        }).catch(err => console.warn("Optional employee doc update failed:", err));
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-8 border-b dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <div>
            <h2 className="text-2xl font-black text-ocean-deep dark:text-white uppercase tracking-tight">User <span className="text-primary italic">Profile</span></h2>
            <p className="text-slate-500 text-sm font-medium">View and manage account information.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors shadow-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-2xl font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm rounded-2xl font-medium">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-ocean-deep dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-ocean-deep dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
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
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-ocean-deep dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hourly Rate ($)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-ocean-deep dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              className="w-full px-6 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-blue-100 dark:border-blue-500/20"
            >
              {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Send Password Reset Email
            </button>

            {isOwnProfile && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-white/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t dark:border-white/10">
            {!isOwnProfile && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  className="w-full sm:w-auto px-6 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-red-100 dark:border-red-500/20 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete account
                </button>
            )}
            
            <div className="flex w-full sm:w-auto gap-3 ml-auto">
               <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
