import { useState, useEffect } from 'react'
import { clientService } from '../../services/clientService'
import { Client } from '../../types'
import { format } from 'date-fns'

export default function CustomersPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true)
            try {
                const fetchedClients = await clientService.getAll()
                setClients(fetchedClients)
            } catch (error) {
                console.error("Error fetching clients:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchClients()
    }, [])

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Client <span className="text-primary tracking-widest uppercase text-2xl">Directory</span></h2>
                    <p className="text-slate-500 font-medium">Manage your customer relationships and contact information.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all">
                        Add New Client
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Client Name</th>
                                <th className="px-8 py-5">Contact Details</th>
                                <th className="px-8 py-5">Billing Address</th>
                                <th className="px-8 py-5">Lifetime Value</th>
                                <th className="px-8 py-5">Joined</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-6 text-center text-slate-500">Loading clients...</td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-6 text-center text-slate-500">No clients found.</td>
                                </tr>
                            ) : (
                                clients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 bg-ocean-deep/10 dark:bg-white/10 rounded-full flex items-center justify-center text-ocean-deep dark:text-white text-xs font-black">
                                                    {client.contactName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-sm font-bold text-ocean-deep dark:text-white">{client.contactName}</span>
                                                    {client.businessName && <span className="text-[10px] text-primary font-black uppercase tracking-widest">{client.businessName}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <span className="text-sm font-medium text-slate-600 dark:text-white/70 block">{client.email}</span>
                                                <span className="text-xs text-slate-400 block">{client.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs text-slate-500 max-w-[200px] block truncate" title={client.billingAddress}>
                                                {client.billingAddress || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-emerald-600">${(client.lifetimeValue || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                            {format(new Date(client.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-8 py-6 text-right space-x-2">
                                            <button className="px-4 py-2 bg-slate-100 text-ocean-deep hover:bg-ocean-deep hover:text-white rounded-lg text-xs font-bold transition-colors">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
