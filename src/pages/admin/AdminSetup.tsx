import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import { inventoryService } from '../../services/inventoryService'
import { ItemCategory, PricingModel, UserRole } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { ShieldCheck, Loader2 } from 'lucide-react'

const mockProducts = [
    {
        name: "Majestic High-Peak Tent",
        category: ItemCategory.Tent,
        price: 450.00,
        desc: "40' x 60' Professional Series",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCC3WLReLQpP0CqrJ5IhV3Rmt4lDb3Xmljh6jA0N36zI7N73jy7JJ0gtgyD7znUdpqdeQXmoArut1iJ6-qQnnmTPHqwWCOca9XKIejbt0lX3iIo3TNDPS0Qsqf1Wl_ugsJ6aI7yiStcVHneM2iqAenUMnBAcUgojl1WKdM3f1LT5lQ7KzfVUhgNf6QD2scU5kpQfj7gxA0EokrFAmFVIS8GQq7kwPeqE6VexW8qvWtius3pE1gUiZJIgPvgv7REgNAXTiwx0L58BOk",
        tag: "Hot Item"
    },
    {
        name: "Infinity Clear Resin Chair",
        category: ItemCategory.Chair,
        price: 8.50,
        desc: "Modern elegance for weddings",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDk3hcpZKxAfHyHwoycfOqwDSA_Ho1q2ZFRTvpCcyQRDqVPBCutvU7hgy7stJD7RAnVncwBJ-bXFyGw3Do_8U6ApmtIpZfKtJpa4oUTmSfHVID5bFp-FIGp0kBXjkXArTKCQscyP0bgcGhIwQnTjCV4JP7hTZbLGgqLdctjpDCjGtHBhYzjN3BcqXKqIjwoqmQQq7wbC8VipLXb0MbFFp0W-MhY3-XIez0j-yq5njMGu5TaR2ngekhtViAfSrrHuHpFGECKXLhM-w",
        tag: "New"
    },
    {
        name: "Rustic Farmhouse Table",
        category: ItemCategory.Table,
        price: 65.00,
        desc: "Handcrafted 8ft solid wood",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIppcNS-clX--WhoneoeFrnJ1FuM-4qRQqHIy3hOXNJ1cqo0Nu6r9JR7ql5A8yGOVmPlBIhrMt_zGbtkYUskzo0P53xfW0LI-DVHnAjNLx-df3P5PYTuRtAsuM-eTBYjAVcLilzrkzHpDgeYykpR-aTkQinXasvrryp1_6uFOtIsQdw5VMcURfNBcZwnkM2cmz3jHjwn1VYGGaGKI2h__YSmsH8x7IfySJViQEHpyZCYtiu_bliIQFFqfaBgf8jUVNpu2IpXzrmbY",
        tag: ""
    }
]

export default function AdminSetup() {
    const { userProfile, loading: authLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState([{ msg: 'Ready to setup admin and seed data.', type: 'info' }])
    const [isLoading, setIsLoading] = useState(false)

    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setStatus(prev => [...prev, { msg, type }])
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        )
    }

    if (!userProfile || (userProfile.role !== UserRole.Owner && userProfile.role !== UserRole.Admin)) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-background-dark">
                <div className="max-w-md w-full bg-white dark:bg-white/5 p-8 rounded-[2.5rem] shadow-xl border border-red-100 dark:border-white/10 text-center space-y-4">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Access Denied</h1>
                    <p className="text-slate-500 font-medium">The setup process is locked. Only existing Owners or Admins can access the seeding utilities.</p>
                </div>
            </div>
        )
    }

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        addLog('WARNING: Due to updated security rules, creating an admin from the client requires Firebase Console intervention to bypass rules.', 'error')
        try {
            addLog('Creating auth user...', 'info')
            const cred = await createUserWithEmailAndPassword(auth, email, password)

            addLog('Setting up user document (This may fail due to security rules)...', 'info')
            await setDoc(doc(db, 'users', cred.user.uid), {
                email: cred.user.email,
                name: 'Patrick Facey',
                role: UserRole.Admin,
                status: 'active',
                createdAt: new Date()
            })

            addLog('Setting up employee document for admin...', 'info')
            await setDoc(doc(db, 'employees', cred.user.uid), {
                fullName: 'Patrick Facey',
                role: UserRole.Admin,
                phone: '555-0100',
                hourlyRate: 0,
                isActive: true
            })

            addLog('Admin user and employee profile created!', 'success')
        } catch (err: any) {
            addLog(`Error: ${err.message}`, 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSeedData = async () => {
        setIsLoading(true)
        try {
            addLog('Seeding inventory items...', 'info')
            const existingItems = await inventoryService.getAll()
            const existingNames = new Set(existingItems.map(item => item.name))

            for (const p of mockProducts) {
                if (existingNames.has(p.name)) {
                    addLog(`Skipping ${p.name} (already exists)`, 'info')
                    continue
                }

                await inventoryService.create({
                    name: p.name,
                    category: p.category,
                    description: p.desc,
                    images: [p.image],
                    totalQuantity: 100,
                    internalCost: p.price * 0.3,
                    rentalPrice: p.price,
                    pricingModel: PricingModel.PerDay,
                    status: 'active',
                    allowOverbooking: false,
                    notes: p.tag
                })
                addLog(`Added ${p.name}`, 'success')
            }
            addLog('Inventory seeding complete!', 'success')
        } catch (err: any) {
            addLog(`Seeding Error: ${err.message}`, 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen py-24 bg-slate-50 dark:bg-background-dark p-6">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-white/10 space-y-6">
                    <h1 className="text-2xl font-black text-ocean-deep dark:text-white">Admin Setup & Seeding</h1>

                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm font-bold flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                            Note: Creating admins via this page is likely blocked by Firestore security rules. Use this page primarily for seeding inventory.
                        </p>
                    </div>

                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Email</label>
                            <input
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                            <input
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all">
                            1. Create Admin User
                        </button>
                    </form>

                    <div className="pt-6 border-t border-slate-100">
                        <button onClick={handleSeedData} disabled={isLoading} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all">
                            2. Seed Database
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] font-mono text-sm max-h-64 overflow-y-auto space-y-2">
                    {status.map((s, i) => (
                        <div key={i} className={s.type === 'error' ? 'text-red-400' : s.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                            &gt; {s.msg}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}

