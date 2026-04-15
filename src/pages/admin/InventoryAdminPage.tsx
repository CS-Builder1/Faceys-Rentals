import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { inventoryService } from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import InventoryItemModal from '../../components/admin/InventoryItemModal'

export default function InventoryAdminPage() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

    const fetchInventory = async () => {
        setIsLoading(true)
        try {
            const fetchedItems = await inventoryService.getAll()
            setItems(fetchedItems)
        } catch (error) {
            console.error('Error fetching inventory:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void fetchInventory()
    }, [])

    const handleSaveItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => {
        if (editingItem) {
            await inventoryService.update(editingItem.id, itemData)
        } else {
            await inventoryService.create(itemData)
        }

        await fetchInventory()
    }

    const handleOpenModal = (item?: InventoryItem) => {
        setEditingItem(item || null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await inventoryService.remove(id)
            await fetchInventory()
        }
    }

    const handleExportCSV = () => {
        if (items.length === 0) {
            toast.error('No inventory items to export.')
            return
        }

        try {
            const csvData = items.map((item) => ({
                id: item.id || '',
                name: item.name || '',
                category: item.category || '',
                description: item.description || '',
                totalQuantity: item.totalQuantity || 0,
                internalCost: item.internalCost || 0,
                rentalPrice: item.rentalPrice || 0,
                cateringPrice: item.cateringPrice || '',
                pricingModel: item.pricingModel || 'per_day',
                status: item.status || 'active',
                allowOverbooking: item.allowOverbooking || false,
                notes: item.notes || '',
                quickbooksItemId: item.quickbooksItemId || '',
                images: item.images?.join('|') || '',
            }))

            const csv = Papa.unparse(csvData)
            const filename = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`
            const BOM = '\ufeff'
            const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(BOM + csv)}`

            const link = document.createElement('a')
            link.style.display = 'none'
            link.href = dataUri
            link.download = filename

            document.body.appendChild(link)
            link.click()
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link)
                }
            }, 500)

            toast.success('Inventory exported successfully!')
        } catch (err) {
            console.error('Export failure:', err)
            toast.error('Export failed.')
        }
    }

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: Papa.ParseResult<any>) => {
                try {
                    const parsedItems = results.data.map((row: any) => ({
                        ...(row.id ? { id: row.id } : {}),
                        name: row.name,
                        category: row.category,
                        description: row.description,
                        totalQuantity: Number(row.totalQuantity) || 0,
                        internalCost: Number(row.internalCost) || 0,
                        rentalPrice: Number(row.rentalPrice) || 0,
                        cateringPrice: row.cateringPrice ? Number(row.cateringPrice) : undefined,
                        pricingModel: row.pricingModel || 'per_day',
                        status: row.status || 'active',
                        allowOverbooking: row.allowOverbooking === 'true' || row.allowOverbooking === 'TRUE' || row.allowOverbooking === true,
                        notes: row.notes,
                        quickbooksItemId: row.quickbooksItemId,
                        images: row.images ? row.images.split('|').filter(Boolean) : [],
                    }))

                    toast.loading(`Importing ${parsedItems.length} items...`, { id: 'import-toast' })
                    await inventoryService.bulkImport(parsedItems)
                    toast.success(`Successfully imported ${parsedItems.length} items!`, { id: 'import-toast' })
                    await fetchInventory()
                } catch (error) {
                    console.error('Import error during processing:', error)
                    toast.error('Failed to import inventory.', { id: 'import-toast' })
                    setIsLoading(false)
                }
            },
            error: (error: Error) => {
                console.error('PapaParse parser error:', error)
                toast.error('Failed to parse CSV file.')
                setIsLoading(false)
            },
        })

        e.target.value = ''
    }

    return (
        <div className="page-shell page-stack">
            <div className="page-header">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">
                        Manage <span className="text-2xl uppercase tracking-widest text-primary">Inventory</span>
                    </h2>
                    <p className="font-medium text-slate-500">Add, edit, or remove rental equipment and catering packages.</p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                    <button
                        onClick={handleExportCSV}
                        id="btn-export-csv"
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-ocean-deep shadow-sm transition-all hover:scale-105 dark:bg-white/10 dark:text-white"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export
                    </button>
                    <button
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-ocean-deep shadow-sm transition-all hover:scale-105 dark:bg-white/10 dark:text-white"
                    >
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        Import CSV
                    </button>
                    <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                    <button
                        onClick={() => handleOpenModal()}
                        className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105"
                    >
                        Create New Listing
                    </button>
                </div>
            </div>

            <div className="panel-card-strong overflow-hidden">
                <div className="data-table-shell">
                    <table className="data-table">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-white/5">
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Quantity Available</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-slate-500">Loading inventory...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-slate-500">No inventory found.</td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                        <td>
                                            <div className="flex items-center gap-4 sm:gap-6">
                                                <div className="relative">
                                                    <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-ocean-deep/10 shadow-lg dark:border-white/10 dark:bg-white/10">
                                                        {item.images && item.images.length > 0 ? (
                                                            <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-xl text-ocean-deep dark:text-white">inventory_2</span>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`absolute -right-1 -top-1 size-4 rounded-full border-2 border-white shadow-sm dark:border-slate-900 ${
                                                            item.totalQuantity > 10 ? 'bg-emerald-500' : item.totalQuantity > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}
                                                        title={`${item.totalQuantity} in stock`}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-sm font-bold text-ocean-deep transition-colors group-hover:text-primary dark:text-white">{item.name}</span>
                                                    <span className="block max-w-[240px] line-clamp-1 text-[10px] font-medium text-slate-400">{item.description}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-ocean-deep dark:text-white">${item.rentalPrice.toFixed(2)}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">per day</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-sm font-black ${
                                                        item.totalQuantity > 10 ? 'text-emerald-600' : item.totalQuantity > 0 ? 'text-amber-600' : 'text-rose-600'
                                                    }`}
                                                >
                                                    {item.totalQuantity}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-ocean-deep transition-colors hover:bg-ocean-deep hover:text-white"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                                >
                                                    Delete
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

            <InventoryItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                existingItem={editingItem}
            />
        </div>
    )
}
