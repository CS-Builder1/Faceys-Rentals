import { useState, useEffect, type ReactNode } from 'react'
import { clientService } from '../../services/clientService'
import { Client } from '../../types'
import { format } from 'date-fns'
import { Trash2, Edit3, UserPlus, Search, Briefcase } from 'lucide-react'
import AddClientModal from '../../components/AddClientModal'
import CustomerDetailDrawer from '../../components/CustomerDetailDrawer'

export default function CustomersPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    const fetchClients = async () => {
        setIsLoading(true)
        try {
            const fetchedClients = await clientService.getAll()
            setClients(fetchedClients)
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void fetchClients()
    }, [])

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete client "${name}"? This will remove all their records.`)) return
        try {
            await clientService.remove(id)
            await fetchClients()
        } catch (err) {
            console.error(err)
            alert('Failed to delete client.')
        }
    }

    const filteredClients = clients.filter((client) =>
        client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalClients = clients.length
    const totalLTV = clients.reduce((acc, curr) => acc + (curr.lifetimeValue || 0), 0)
    const newThisMonth = clients.filter((client) => {
        if (!client.createdAt) return false
        const createdAt = new Date(client.createdAt)
        const now = new Date()
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    }).length

    useEffect(() => {
        if (selectedClient) {
            const updated = clients.find((client) => client.id === selectedClient.id)
            if (updated) setSelectedClient(updated)
        }
    }, [clients, selectedClient])

    return (
        <div className="page-shell page-stack">
            <div className="page-header">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">
                        Client <span className="text-2xl uppercase tracking-widest text-primary">Directory</span>
                    </h2>
                    <p className="font-medium text-slate-500">Manage your customer relationships and contact information.</p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <div className="group relative w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-primary dark:border-white/10 dark:bg-white/5"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add New Client
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                <StatCard label="Total Clients" value={totalClients.toString()} tone="primary" icon={<UserPlus className="h-6 w-6" />} />
                <StatCard
                    label="Lifetime Revenue"
                    value={`$${totalLTV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    tone="emerald"
                    icon={<Briefcase className="h-6 w-6" />}
                />
                <StatCard label="New This Month" value={newThisMonth.toString()} tone="blue" icon={<UserPlus className="h-6 w-6" />} />
            </div>

            <div className="panel-card-strong overflow-hidden">
                <div className="data-table-shell">
                    <table className="data-table">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-white/5">
                            <tr>
                                <th>Client Name</th>
                                <th>Contact Details</th>
                                <th>Billing Address</th>
                                <th>Lifetime Value</th>
                                <th>Joined</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                            <span>Loading clients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center italic text-slate-500">
                                        {searchTerm ? `No results found for "${searchTerm}"` : 'No clients found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        onClick={() => setSelectedClient(client)}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                                    >
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-ocean-deep/10 text-xs font-black text-ocean-deep dark:bg-white/10 dark:text-white">
                                                    {client.contactName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-sm font-bold text-ocean-deep dark:text-white">{client.contactName}</span>
                                                    {client.businessName && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{client.businessName}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <span className="block text-sm font-medium text-slate-600 dark:text-white/70">{client.email}</span>
                                                <span className="block text-xs text-slate-400">{client.phone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="block max-w-[220px] truncate text-xs text-slate-500" title={client.billingAddress}>
                                                {client.billingAddress || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm font-bold text-emerald-600">
                                                ${(client.lifetimeValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="text-xs font-medium text-slate-500">
                                            {client.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedClient(client)
                                                    }}
                                                    className="rounded-xl bg-slate-100 p-2.5 text-ocean-deep shadow-sm transition-all hover:bg-primary hover:text-white dark:bg-white/5 dark:text-white"
                                                    title="Edit Client"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        void handleDelete(client.id, client.contactName)
                                                    }}
                                                    className="rounded-xl bg-red-50 p-2.5 text-red-600 shadow-sm transition-all hover:bg-red-600 hover:text-white dark:bg-red-500/10"
                                                    title="Delete Client"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            <CustomerDetailDrawer
                isOpen={!!selectedClient}
                customer={selectedClient}
                onClose={() => setSelectedClient(null)}
                onUpdate={fetchClients}
            />
        </div>
    )
}

function StatCard({
    label,
    value,
    tone,
    icon,
}: {
    label: string
    value: string
    tone: 'primary' | 'emerald' | 'blue'
    icon: ReactNode
}) {
    const toneClasses = {
        primary: 'border-primary/20 bg-primary/5 text-primary',
        emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600',
        blue: 'border-blue-500/20 bg-blue-500/5 text-blue-500',
    }[tone]

    return (
        <div className="panel-card flex items-center justify-between gap-4 p-6">
            <div>
                <p className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <h3 className="text-3xl font-black text-ocean-deep dark:text-white">{value}</h3>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${toneClasses}`}>
                {icon}
            </div>
        </div>
    )
}
