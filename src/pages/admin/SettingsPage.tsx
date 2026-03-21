import { useState, useEffect } from 'react'
import { BusinessSettings, settingsService, defaultSettings } from '../../services/settingsService'
import { Building2, CreditCard, Receipt, Users, Bell, Blocks, ShieldCheck, Loader2, Save, Check, X, User as UserIcon, Trash2, FileText } from 'lucide-react'
import { type Employee, UserRole, type User as UserProfile } from '../../types'
import { employeeService } from '../../services/employeeService'
import { doc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import UserProfileModal from '../../components/UserProfileModal'
import PayStubsModal from '../../components/PayStubsModal'
import { useAuth } from '../../contexts/AuthContext'

// Tab definitions
const TABS = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'financial', label: 'Financial & Tax', icon: CreditCard },
    { id: 'invoicing', label: 'Quote & Invoicing', icon: Receipt },
    { id: 'team', label: 'Team & Access', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'security', label: 'Security', icon: ShieldCheck },
] as const

type TabId = typeof TABS[number]['id']

export default function SettingsPage() {
    const { userProfile } = useAuth()
    const isAdminOrOwner = userProfile?.role === UserRole.Admin || userProfile?.role === UserRole.Owner

    const [activeTab, setActiveTab] = useState<TabId>('profile')
    const [settings, setSettings] = useState<BusinessSettings>(defaultSettings)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Staff Management State
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false)
    const [savingStaff, setSavingStaff] = useState(false)
    const [staffFormData, setStaffFormData] = useState({
        email: '', password: '', fullName: '', phone: '', role: UserRole.Staff, hourlyRate: 15
    })
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [stubsEmployeeId, setStubsEmployeeId] = useState<string | null>(null)
    const [stubsEmployeeName, setStubsEmployeeName] = useState('')
    const [isStubsModalOpen, setIsStubsModalOpen] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const [data, emps] = await Promise.all([
                settingsService.getSettings(),
                employeeService.getAllEmployees()
            ])
            setSettings(data)
            setEmployees(emps)
        } catch (error) {
            console.error("Failed to load settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: keyof BusinessSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSaveSuccess(false)
        try {
            await settingsService.saveSettings(settings)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (error) {
            console.error("Failed to save settings:", error)
            alert("Failed to save settings. Check console for details.")
        } finally {
            setSaving(false)
        }
    }

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingStaff(true)
        try {
            await employeeService.createStaffAccount(staffFormData)
            setIsAddStaffModalOpen(false)
            setStaffFormData({ email: '', password: '', fullName: '', phone: '', role: UserRole.Staff, hourlyRate: 15 })
            loadSettings()
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to create employee.')
        } finally {
            setSavingStaff(false)
        }
    }

    const handleDeleteStaff = async (emp: Employee) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${emp.fullName}'s account? This cannot be undone.`)) return
        try {
            await deleteDoc(doc(db, 'users', emp.id)).catch(() => {})
            await deleteDoc(doc(db, 'employees', emp.id)).catch(() => {})
            await deleteDoc(doc(db, 'customers', emp.id)).catch(() => {})
            await loadSettings()
        } catch (err: any) {
            console.error(err)
            alert('Failed to delete user: ' + err.message)
        }
    }

    const handleResetPassword = async () => {
        if (!userProfile?.email) return
        try {
            await sendPasswordResetEmail(auth, userProfile.email)
            alert("Password reset email sent. Please check your inbox.")
        } catch (error: any) {
            console.error("Error sending password reset email:", error)
            alert("Failed to send password reset email: " + error.message)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Settings...</p>
            </div>
        )
    }

    return (
        <div className="p-8 md:p-12 animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Admin <span className="text-primary tracking-widest uppercase text-2xl">Settings</span></h2>
                <p className="text-slate-500 font-medium mt-2">Manage your business profile, team access, and system configurations.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 shrink-0">
                    <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-4 lg:pb-0 hide-scrollbar">
                        {TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                        isActive 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-ocean-deep border border-transparent hover:border-slate-200'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="flex-1">
                    {activeTab !== 'team' && activeTab !== 'security' ? (
                        <form onSubmit={handleSave} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                            
                            {/* Panel Header */}
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-bold text-ocean-deep">{TABS.find(t => t.id === activeTab)?.label}</h3>
                                <p className="text-sm text-slate-500 mt-1">Update your configuration below.</p>
                            </div>

                            {/* Panel Body */}
                            <div className="p-8 flex-1 space-y-8">
                                {activeTab === 'profile' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                                            <input type="text" value={settings.companyName} onChange={e => handleChange('companyName', e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Tagline</label>
                                            <input type="text" value={settings.tagline} onChange={e => handleChange('tagline', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Email</label>
                                            <input type="email" value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone</label>
                                            <input type="tel" value={settings.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Street Address</label>
                                            <input type="text" value={settings.addressStreet} onChange={e => handleChange('addressStreet', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                                            <input type="text" value={settings.addressCity} onChange={e => handleChange('addressCity', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">State/Prov</label>
                                                <input type="text" value={settings.addressState} onChange={e => handleChange('addressState', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">ZIP/Postal</label>
                                                <input type="text" value={settings.addressZip} onChange={e => handleChange('addressZip', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'financial' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs border-b pb-2">Tax Settings</h4>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Default Tax Rate (%)</label>
                                                <input type="number" step="0.01" value={settings.defaultTaxRate} onChange={e => handleChange('defaultTaxRate', parseFloat(e.target.value))} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Fiscal Year Start</label>
                                                <select value={settings.fiscalYearStart} onChange={e => handleChange('fiscalYearStart', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white">
                                                    <option value="January">January</option>
                                                    <option value="April">April</option>
                                                    <option value="July">July</option>
                                                    <option value="October">October</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs border-b pb-2">Deposit Policies</h4>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Deposit Type</label>
                                                <select value={settings.depositType} onChange={e => handleChange('depositType', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white">
                                                    <option value="none">No Deposit Required</option>
                                                    <option value="fixed">Fixed Amount</option>
                                                    <option value="percentage">Percentage (%)</option>
                                                </select>
                                            </div>
                                            {settings.depositType !== 'none' && (
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Default Deposit {settings.depositType === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}</label>
                                                    <input type="number" step={settings.depositType === 'percentage' ? "1" : "0.01"} value={settings.defaultDepositAmount} onChange={e => handleChange('defaultDepositAmount', parseFloat(e.target.value))} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'invoicing' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                         <div className="space-y-6">
                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs border-b pb-2">Quote Defaults</h4>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Quote Validity (Days)</label>
                                                <input type="number" value={settings.quoteValidityDays} onChange={e => handleChange('quoteValidityDays', parseInt(e.target.value, 10))} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Warning (Days Before)</label>
                                                <input type="number" value={settings.quoteExpiryWarningDays} onChange={e => handleChange('quoteExpiryWarningDays', parseInt(e.target.value, 10))} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs border-b pb-2">Invoice Defaults</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Invoice Prefix</label>
                                                    <input type="text" value={settings.invoicePrefix} onChange={e => handleChange('invoicePrefix', e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Next Number</label>
                                                    <input type="number" value={settings.nextInvoiceNumber} onChange={e => handleChange('nextInvoiceNumber', parseInt(e.target.value, 10))} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Default Due Date (Days from creation)</label>
                                                <input type="number" value={settings.defaultInvoiceDueDays} onChange={e => handleChange('defaultInvoiceDueDays', parseInt(e.target.value, 10))} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Standard Payment Terms (Appears on PDFs)</label>
                                                <textarea value={settings.defaultPaymentTerms} onChange={e => handleChange('defaultPaymentTerms', e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6 max-w-xl">
                                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                                            <div>
                                                <p className="font-bold text-ocean-deep -mb-1">New Quote Requests</p>
                                                <p className="text-xs text-slate-500">Receive an email when a customer submits a request online.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={settings.emailOnQuoteRequest} onChange={e => handleChange('emailOnQuoteRequest', e.target.checked)} />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                                            <div>
                                                <p className="font-bold text-ocean-deep -mb-1">Overdue Invoices</p>
                                                <p className="text-xs text-slate-500">Receive a daily digest of overdue invoices.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={settings.emailOnInvoiceOverdue} onChange={e => handleChange('emailOnInvoiceOverdue', e.target.checked)} />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Notification Email Override</label>
                                            <p className="text-xs text-slate-500 mb-2">Leave blank to use the main contact email.</p>
                                            <input type="email" value={settings.notificationEmailOverride || ''} onChange={e => handleChange('notificationEmailOverride', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. alerts@company.com" />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'integrations' && (
                                    <div className="space-y-6 max-w-2xl">
                                        <div className="p-6 border border-slate-200 rounded-2xl flex items-start gap-4">
                                            <div className="size-12 bg-[#0077C5] rounded-xl shrink-0 flex items-center justify-center text-white font-black text-xl">qb</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-ocean-deep uppercase tracking-widest text-xs mb-1">QuickBooks Online</h4>
                                                        <p className="text-sm text-slate-500 font-medium max-w-md">Sync invoices, customers, and payments directly to QuickBooks automatically.</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">Not Connected</span>
                                                </div>
                                                <button type="button" className="mt-4 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Connect to QuickBooks</button>
                                            </div>
                                        </div>
                                        <div className="p-6 border border-slate-200 rounded-2xl flex items-start gap-4">
                                            <div className="size-12 bg-[#635BFF] rounded-xl shrink-0 flex items-center justify-center text-white font-black text-xl">S</div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-ocean-deep uppercase tracking-widest text-xs mb-1">Stripe Payments</h4>
                                                        <p className="text-sm text-slate-500 font-medium max-w-md">Accept credit cards and ACH payments via Stripe. Enter your publishable key below.</p>
                                                    </div>
                                                </div>
                                                <input type="text" value={settings.stripePublishableKey || ''} onChange={e => handleChange('stripePublishableKey', e.target.value)} placeholder="pk_test_..." className="w-full px-4 py-2 rounded-lg border border-slate-200 font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>
                                        <div className="p-6 border border-slate-200 rounded-2xl flex items-start gap-4">
                                            <div className="size-12 bg-[#E37400] rounded-xl shrink-0 flex items-center justify-center text-white font-black text-xl">
                                                <span className="material-symbols-outlined">analytics</span>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-ocean-deep uppercase tracking-widest text-xs mb-1">Google Analytics</h4>
                                                        <p className="text-sm text-slate-500 font-medium max-w-md">Track visitors on your public site. Enter your Measurement ID (G-XXXXXXX).</p>
                                                    </div>
                                                </div>
                                                <input type="text" value={settings.googleAnalyticsId || ''} onChange={e => handleChange('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" className="w-full px-4 py-2 rounded-lg border border-slate-200 font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Panel Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                {saveSuccess ? (
                                    <span className="text-emerald-500 text-sm font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Settings updated successfully
                                    </span>
                                ) : <span />}
                                
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : activeTab === 'team' ? (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                             {/* Panel Header */}
                             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-ocean-deep">Team & Access</h3>
                                    <p className="text-sm text-slate-500 mt-1">Manage staff accounts, roles, and payroll information.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddStaffModalOpen(true)}
                                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
                                >
                                    + Add Staff Member
                                </button>
                            </div>
                            <div className="p-8 flex-1 bg-slate-50/30">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {employees.map(emp => (
                                        <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-ocean-deep flex items-center gap-2">
                                                        {emp.fullName}
                                                        {emp.role === UserRole.Admin && <span className="bg-purple-100 text-purple-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Admin</span>}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 capitalize flex items-center gap-1 mt-1">
                                                        {emp.role}
                                                    </p>
                                                </div>
                                                <span className={`w-3 h-3 rounded-full mt-1 ${emp.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-red-500 shadow-sm shadow-red-500/50'}`} title={emp.isActive ? "Active" : "Inactive"}></span>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 mt-4 text-sm font-medium border border-slate-100">
                                                <p className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-ocean-deep">{emp.phone || 'Not provided'}</span></p>
                                                <p className="flex justify-between"><span className="text-slate-500">Hourly Rate:</span> <span className="text-ocean-deep">${emp.hourlyRate.toFixed(2)}/hr</span></p>
                                            </div>

                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser({
                                                            id: emp.id,
                                                            name: emp.fullName,
                                                            email: emp.email || '',
                                                            phone: emp.phone || '',
                                                            role: emp.role as UserRole || UserRole.Staff,
                                                            status: 'active',
                                                            createdAt: new Date(),
                                                            hourlyRate: emp.hourlyRate
                                                        })
                                                        setIsProfileModalOpen(true)
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 p-2.5 text-sm font-bold text-slate-600 hover:text-ocean-deep hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                                                >
                                                    <UserIcon className="w-4 h-4" /> Profile
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setStubsEmployeeId(emp.id);
                                                        setStubsEmployeeName(emp.fullName);
                                                        setIsStubsModalOpen(true);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 p-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors"
                                                >
                                                    <FileText className="w-4 h-4" /> Paystubs
                                                </button>
                                                {isAdminOrOwner && (
                                                    <button
                                                        onClick={() => handleDeleteStaff(emp)}
                                                        className="flex items-center justify-center gap-1 p-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-700 border border-red-200 rounded-xl transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {employees.length === 0 && (
                                        <div className="col-span-full bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <h3 className="text-lg font-bold text-ocean-deep">No Staff found</h3>
                                            <p className="text-slate-500 mt-1">Add an employee to get started with time tracking and payroll.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                            {/* Panel Header */}
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-bold text-ocean-deep">Security</h3>
                                <p className="text-sm text-slate-500 mt-1">Manage your account security and 2FA settings.</p>
                            </div>
                            <div className="p-8 flex-1 space-y-6 max-w-xl">
                                <div className="p-6 border border-slate-200 rounded-2xl space-y-4">
                                    <h4 className="font-bold text-ocean-deep">Change Password</h4>
                                    <p className="text-sm text-slate-500 font-medium">Send a password reset email to your current email address to update your password securely.</p>
                                    <button onClick={handleResetPassword} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-ocean-deep text-sm font-bold rounded-xl transition-colors">
                                        Send Reset Email
                                    </button>
                                </div>

                                <div className="p-6 border border-slate-200 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-ocean-deep mb-1">Require Two-Factor Auth</h4>
                                        <p className="text-sm text-slate-500 font-medium max-w-sm">Force all admin and staff accounts to use 2FA when signing in.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={settings.requireTwoFactorAuth} onChange={e => handleChange('requireTwoFactorAuth', e.target.checked)} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Add Staff Modal */}
            {isAddStaffModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-ocean-deep">Add New Staff Member</h2>
                            <button onClick={() => setIsAddStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddStaff} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                <input required type="text" value={staffFormData.fullName} onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address <span className="font-normal text-slate-400 ml-1">(Used for portal login)</span></label>
                                <input required type="email" autoComplete="off" value={staffFormData.email} onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="jane@example.com" />
                            </div>
                            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/50">
                                <label className="block text-sm font-bold text-amber-900 mb-2">Temporary Password</label>
                                <input required type="password" autoComplete="new-password" minLength={6} value={staffFormData.password} onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white" placeholder="••••••••" />
                                <p className="text-xs text-amber-700/80 mt-2 font-medium">Staff will use this password to log in to the timeclock.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                    <input type="tel" value={staffFormData.phone} onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="(555) 123-4567" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Hourly Rate ($)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-500 font-medium sm:text-sm">$</span>
                                        </div>
                                        <input required type="number" min="0" step="0.50" value={staffFormData.hourlyRate} onChange={(e) => setStaffFormData({ ...staffFormData, hourlyRate: parseFloat(e.target.value) })} className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">System Role</label>
                                <select value={staffFormData.role} onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as UserRole })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all capitalize bg-white">
                                    {Object.values(UserRole).map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white -mx-6 px-6 pb-2">
                                <button type="button" onClick={() => setIsAddStaffModalOpen(false)} className="px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors">Cancel</button>
                                <button type="submit" disabled={savingStaff} className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {savingStaff ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    {savingStaff ? 'Creating...' : 'Create Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedUser && (
                <UserProfileModal 
                    isOpen={isProfileModalOpen}
                    onClose={() => {
                        setIsProfileModalOpen(false)
                        setSelectedUser(null)
                    }}
                    onUpdate={() => {
                        loadSettings()
                        setIsProfileModalOpen(false)
                        setSelectedUser(null)
                    }}
                    user={selectedUser}
                    allowRoleEdit={true}
                />
            )}

            {stubsEmployeeId && (
                <PayStubsModal
                    isOpen={isStubsModalOpen}
                    onClose={() => setIsStubsModalOpen(false)}
                    employeeId={stubsEmployeeId}
                    employeeName={stubsEmployeeName}
                />
            )}
        </div>
    )
}
