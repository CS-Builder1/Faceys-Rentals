import { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, XCircle, Loader2 } from 'lucide-react';
import { InventoryItem, ItemCategory, PricingModel } from '../../types';
import { storage } from '../../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface InventoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<void>;
    existingItem?: InventoryItem | null;
}

const defaultItemParams = {
    name: '',
    category: ItemCategory.Other,
    description: '',
    images: [] as string[],
    totalQuantity: 1,
    internalCost: 0,
    rentalPrice: 0,
    pricingModel: PricingModel.PerDay,
    status: 'active' as 'active' | 'inactive',
    allowOverbooking: false,
    notes: ''
};

export default function InventoryItemModal({ isOpen, onClose, onSave, existingItem }: InventoryItemModalProps) {
    const [formData, setFormData] = useState(defaultItemParams);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (existingItem) {
            setFormData({
                name: existingItem.name,
                category: existingItem.category,
                description: existingItem.description,
                images: existingItem.images || [],
                totalQuantity: existingItem.totalQuantity,
                internalCost: existingItem.internalCost || 0,
                rentalPrice: existingItem.rentalPrice,
                pricingModel: existingItem.pricingModel,
                status: existingItem.status,
                allowOverbooking: existingItem.allowOverbooking,
                notes: existingItem.notes || ''
            });
        } else {
            setFormData(defaultItemParams);
        }
    }, [existingItem, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save item:", error);
            alert("Failed to save item. See console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                const fileRef = ref(storage, `inventory/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef, file);

                return new Promise<string>((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // Just tracking a rough overall progress for the batch
                            if (index === 0) setUploadProgress(progress); 
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            });

            const newImageUrls = await Promise.all(uploadPromises);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
        } catch (error) {
            console.error("Error uploading images:", error);
            alert("An error occurred while uploading. Please try again.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-deep/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-white/10">
                <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center z-10">
                    <h2 className="text-xl font-black text-ocean-deep dark:text-white">
                        {existingItem ? 'Edit Item' : 'Create New Listing'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-ocean-deep hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    
                    {/* Image Upload Area */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500">Item Media</label>
                        
                        {/* Image Preview Grid */}
                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.images.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group">
                                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveImage(idx)}
                                                className="p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl transition-all ${
                                isUploading 
                                    ? 'border-slate-300 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5' 
                                    : 'border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-500 hover:text-primary dark:border-white/20 dark:hover:bg-white/5'
                            }`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-sm font-bold">Uploading... {Math.round(uploadProgress)}%</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                        <UploadCloud className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold">Click to upload images</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                                    </div>
                                </>
                            )}
                        </button>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/10">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-500">Item Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10"
                                placeholder="e.g., 20x20 High Peak Tent"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as ItemCategory })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10"
                            >
                                {Object.values(ItemCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500">Total Quantity</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.totalQuantity}
                                onChange={e => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500">Rental Price ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.rentalPrice}
                                onChange={e => setFormData({ ...formData, rentalPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500">Pricing Model</label>
                            <select
                                value={formData.pricingModel}
                                onChange={e => setFormData({ ...formData, pricingModel: e.target.value as PricingModel })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10"
                            >
                                {Object.values(PricingModel).map(model => (
                                    <option key={model} value={model}>{model.replace('_', ' ').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-500">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10 resize-none"
                                placeholder="Detailed description of the item..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5 dark:text-white dark:ring-white/10"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/10 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            disabled={isSubmitting || isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                            disabled={isSubmitting || isUploading}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
