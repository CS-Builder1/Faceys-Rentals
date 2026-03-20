import { useState, useEffect } from 'react'
import { clientService } from '../../services/clientService'
import { Client } from '../../types'
import { format } from 'date-fns'
import { Trash2, Edit3, UserPlus, Search } from 'lucide-react'
import AddClientModal from '../../components/AddClientModal'

export default function CustomersPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

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

    useEffect(() => {
        fetchClients()
    }, [])

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete client "${name}"? This will remove all their records.`)) return
        try {
            await clientService.remove(id)
            fetchClients()
        } catch (err) {
            console.error(err)
            alert('Failed to delete client.')
        }
    }

    const filteredClients = clients.filter(c => 
        c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Client <span className="text-primary tracking-widest uppercase text-2xl">Directory</span></h2>
                    <p className="text-slate-500 font-medium">Manage your customer relationships and contact information.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-primary transition-all w-64 shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add New Client
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-medium">
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
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading clients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 italic">
                                        {searchTerm ? `No results found for "${searchTerm}"` : 'No clients found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map(client => (
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
                                            <span className="text-sm font-bold text-emerald-600">${(client.lifetimeValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                            {format(new Date(client.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    className="p-2.5 bg-slate-100 dark:bg-white/5 text-ocean-deep dark:text-white hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm"
                                                    title="Edit Client"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(client.id, client.contactName)}
                                                    className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    title="Delete Client"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddClientModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={fetchClients} 
            />
        </div>
    )
}
