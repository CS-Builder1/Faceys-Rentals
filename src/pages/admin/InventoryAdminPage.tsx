import { useState, useEffect } from 'react'
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
            console.error("Error fetching inventory:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchInventory()
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
        if (window.confirm("Are you sure you want to delete this item?")) {
            await inventoryService.remove(id)
            await fetchInventory()
        }
    }

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Manage <span className="text-primary tracking-widest uppercase text-2xl">Inventory</span></h2>
                    <p className="text-slate-500 font-medium">Add, edit, or remove rental equipment and catering packages.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all">
                        Create New Listing
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Item Name</th>
                                <th className="px-8 py-5">Category</th>
                                <th className="px-8 py-5">Price</th>
                                <th className="px-8 py-5">Quantity Available</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-6 text-center text-slate-500">Loading inventory...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-6 text-center text-slate-500">No inventory found.</td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="relative group/thumb">
                                                    <div className="size-14 bg-ocean-deep/10 dark:bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 transition-transform group-hover/thumb:scale-110 shadow-lg">
                                                        {item.images && item.images.length > 0 ? (
                                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-ocean-deep dark:text-white text-xl">inventory_2</span>
                                                        )}
                                                    </div>
                                                    {/* Stock Status Badge */}
                                                    <div className={`absolute -top-1 -right-1 size-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                                                        item.totalQuantity > 10 ? 'bg-emerald-500' : 
                                                        item.totalQuantity > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`} title={`${item.totalQuantity} in stock`} />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-sm font-bold text-ocean-deep dark:text-white group-hover:text-primary transition-colors">{item.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] block line-clamp-1">{item.description}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-ocean-deep dark:text-white">${item.rentalPrice.toFixed(2)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">per day</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black ${
                                                    item.totalQuantity > 10 ? 'text-emerald-600' : 
                                                    item.totalQuantity > 0 ? 'text-amber-600' : 'text-rose-600'
                                                }`}>
                                                    {item.totalQuantity}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="px-4 py-2 bg-slate-100 text-ocean-deep hover:bg-ocean-deep hover:text-white rounded-lg text-xs font-bold transition-colors">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                                                Delete
                                            </button>
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
