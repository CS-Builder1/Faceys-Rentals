import { useState, useEffect } from 'react'
import { SiteContent } from '../../types'
import { contentService } from '../../services/contentService'
import { useContent } from '../../contexts/ContentContext'
import toast from 'react-hot-toast'

type Tab = 'general' | 'hero' | 'about' | 'services' | 'seo' | 'cta'

export default function ContentManagerPage() {
    const { content: currentContent, refreshContent } = useContent()
    const [content, setContent] = useState<SiteContent | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('general')
    const [uploadingImage, setUploadingImage] = useState<string | null>(null)

    useEffect(() => {
        if (currentContent) {
            setContent(currentContent)
            setLoading(false)
        }
    }, [currentContent])

    const handleSave = async () => {
        if (!content) return
        try {
            setSaving(true)
            await contentService.updateGlobalContent(content)
            await refreshContent()
            toast.success('Site content updated successfully')
        } catch (error: any) {
            console.error('Error saving content:', error)
            toast.error(error.message || 'Failed to update site content')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: keyof SiteContent, value: any) => {
        setContent(prev => prev ? { ...prev, [field]: value } : null)
    }

    const handleSocialChange = (platform: 'facebook' | 'instagram' | 'twitter', value: string) => {
        setContent(prev => {
            if (!prev) return prev
            return {
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [platform]: value
                }
            }
        })
    }

    // SEO fields are top-level in SiteContent now

    const handleImageUpload = async (file: File, field: keyof SiteContent | string, index?: number) => {
        try {
            setUploadingImage(field.toString())
            const url = await contentService.uploadAsset(file)
            
            if (field === 'heroImage') {
                handleChange('heroImage', url)
            } else if (field === 'ctaImage') {
                handleChange('ctaImage', url)
            } else if (field === 'aboutUsImage') {
                handleChange('aboutUsImage', url)
            } else if (field === 'ogImage') {
                handleChange('ogImage', url)
            } else if (field === 'services' && typeof index === 'number') {
                const newServices = [...(content?.services || [])]
                newServices[index] = { ...newServices[index], image: url }
                handleChange('services', newServices)
            } else if (field === 'recentEvents' && typeof index === 'number') {
                const newEvents = [...(content?.recentEvents || [])]
                newEvents[index] = { ...newEvents[index], image: url }
                handleChange('recentEvents', newEvents)
            }
            
            toast.success('Image uploaded successfully')
        } catch (error: any) {
            console.error('Error uploading image:', error)
            toast.error('Failed to upload image')
        } finally {
            setUploadingImage(null)
        }
    }

    if (loading || !content) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-ocean-deep dark:text-white">Site Content CMS</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage texts, images, and SEO configuration.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary flex items-center gap-2"
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <span className="material-symbols-outlined">save</span>
                    )}
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Vertical Tabs Sidebar */}
                <div className="w-full lg:w-64 shrink-0 space-y-2">
                    {[
                        { id: 'general', label: 'General Info', icon: 'info' },
                        { id: 'hero', label: 'Hero Section', icon: 'home' },
                        { id: 'about', label: 'About Us', icon: 'business' },
                        { id: 'services', label: 'Services & Events', icon: 'event' },
                        { id: 'cta', label: 'Call to Action', icon: 'call_to_action' },
                        { id: 'seo', label: 'SEO & Marketing', icon: 'search' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-left ${
                                activeTab === tab.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    {/* GENERAL INFO */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4">General Information</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Site Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={content.siteName || ''}
                                        onChange={(e) => handleChange('siteName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={content.contactEmail || ''}
                                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={content.contactPhone || ''}
                                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                                    />
                                </div>
                                
                                <h3 className="text-lg font-bold pt-4">Social Links</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">facebook</span> Facebook URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://facebook.com/..."
                                            value={content.socialLinks?.facebook || ''}
                                            onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">camera_alt</span> Instagram URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://instagram.com/..."
                                            value={content.socialLinks?.instagram || ''}
                                            onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">public</span> Twitter/X URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://twitter.com/..."
                                            value={content.socialLinks?.twitter || ''}
                                            onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HERO SECTION */}
                    {activeTab === 'hero' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4">Hero Section (Home Page)</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hero Title (HTML supported)</label>
                                    <textarea
                                        className="input min-h-[100px]"
                                        value={content.heroTitle || ''}
                                        onChange={(e) => handleChange('heroTitle', e.target.value)}
                                        placeholder="Your Event, <br/>Our <span className='text-gradient-coral'>Passion</span>"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Use <code>&lt;br/&gt;</code> for newlines and HTML span for gradients.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        value={content.heroSubtitle || ''}
                                        onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-sm font-medium mb-2">Hero Background Image</label>
                                    {content.heroImage && (
                                        <div className="mb-4 relative rounded-xl overflow-hidden h-48 w-full md:w-2/3 border border-slate-200 dark:border-slate-700">
                                            <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <label className="btn btn-outline cursor-pointer relative">
                                            <span>{uploadingImage === 'heroImage' ? 'Uploading...' : 'Replace Image'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'heroImage')
                                                }}
                                                disabled={uploadingImage !== null}
                                            />
                                        </label>
                                        <span className="text-xs text-slate-500">Recommended size: 1920x1080px (landscape)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABOUT US */}
                    {activeTab === 'about' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4">About Us Snippet</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">About Us Text (Footer)</label>
                                    <textarea
                                        className="input min-h-[120px]"
                                        value={content.aboutUsText || ''}
                                        onChange={(e) => handleChange('aboutUsText', e.target.value)}
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-sm font-medium mb-2">About Us Image</label>
                                    {content.aboutUsImage && (
                                        <div className="mb-4 relative rounded-xl overflow-hidden h-48 w-full md:w-2/3 border border-slate-200 dark:border-slate-700">
                                            <img src={content.aboutUsImage} alt="About Us" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <label className="btn btn-outline cursor-pointer relative">
                                            <span>{uploadingImage === 'aboutUsImage' ? 'Uploading...' : 'Replace Image'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'aboutUsImage')
                                                }}
                                                disabled={uploadingImage !== null}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SERVICES & EVENTS */}
                    {activeTab === 'services' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">Featured Services</h2>
                                <div className="space-y-6">
                                    {(content.services || []).map((service, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold">Service {idx + 1}</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={service.title}
                                                        onChange={(e) => {
                                                            const newServices = [...(content.services || [])]
                                                            newServices[idx].title = e.target.value
                                                            handleChange('services', newServices)
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Link URL</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={service.linkUrl || ''}
                                                        onChange={(e) => {
                                                            const newServices = [...(content.services || [])]
                                                            newServices[idx].linkUrl = e.target.value
                                                            handleChange('services', newServices)
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium mb-1">Description</label>
                                                    <textarea
                                                        className="input min-h-[60px]"
                                                        value={service.description}
                                                        onChange={(e) => {
                                                            const newServices = [...(content.services || [])]
                                                            newServices[idx].description = e.target.value
                                                            handleChange('services', newServices)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 pt-2">
                                                {service.image && (
                                                    <img src={service.image} className="w-24 h-24 object-cover rounded-lg border border-slate-200" alt="" />
                                                )}
                                                <label className="btn btn-sm btn-outline cursor-pointer relative">
                                                    <span>{uploadingImage === `services_${idx}` ? 'Uploading...' : 'Change Image'}</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'services', idx)
                                                        }}
                                                        disabled={uploadingImage !== null}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">Recent Events Gallery</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(content.recentEvents || []).map((event, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 relative">
                                                {event.image ? (
                                                    <img src={event.image} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <label className="btn btn-sm btn-primary cursor-pointer">
                                                        <span>Upload</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'recentEvents', idx)
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <input
                                                    type="text"
                                                    className="input text-sm"
                                                    placeholder="Image Alt Text..."
                                                    value={event.alt || ''}
                                                    onChange={(e) => {
                                                        const newEvents = [...(content.recentEvents || [])]
                                                        newEvents[idx].alt = e.target.value
                                                        handleChange('recentEvents', newEvents)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEO & MARKETING */}
                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4">SEO Configuration</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Global Meta Title</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={content.seoTitle || ''}
                                        onChange={(e) => handleChange('seoTitle', e.target.value)}
                                        placeholder="Facey's Party Rentals & Catering"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Global Meta Description</label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        value={content.seoDescription || ''}
                                        onChange={(e) => handleChange('seoDescription', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Keywords</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={content.seoKeywords || ''}
                                        onChange={(e) => handleChange('seoKeywords', e.target.value)}
                                        placeholder="party rentals, catering, saint lucia, events..."
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Comma-separated list of keywords</p>
                                </div>
                                <div className="pt-2">
                                    <label className="block text-sm font-medium mb-2">OG:Image (Social Sharing Cover)</label>
                                    {content.ogImage && (
                                        <div className="mb-4 relative rounded-xl overflow-hidden h-40 w-full md:w-1/2 border border-slate-200 dark:border-slate-700">
                                            <img src={content.ogImage} alt="SEO Cover" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <label className="btn btn-outline cursor-pointer relative">
                                            <span>{uploadingImage === 'ogImage' ? 'Uploading...' : 'Upload SEO Image'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'ogImage')
                                                }}
                                                disabled={uploadingImage !== null}
                                            />
                                        </label>
                                        <span className="text-xs text-slate-500">1200x630px recommended</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CTA SECTION */}
                    {activeTab === 'cta' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4">Footer Call To Action</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title (HTML supported)</label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        value={content.ctaTitle || ''}
                                        onChange={(e) => handleChange('ctaTitle', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Subtitle</label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        value={content.ctaSubtitle || ''}
                                        onChange={(e) => handleChange('ctaSubtitle', e.target.value)}
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-sm font-medium mb-2">CTA Background Image</label>
                                    {content.ctaImage && (
                                        <div className="mb-4 relative rounded-xl overflow-hidden h-48 w-full md:w-2/3 border border-slate-200 dark:border-slate-700">
                                            <img src={content.ctaImage} alt="CTA" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <label className="btn btn-outline cursor-pointer relative">
                                            <span>{uploadingImage === 'ctaImage' ? 'Uploading...' : 'Replace Image'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'ctaImage')
                                                }}
                                                disabled={uploadingImage !== null}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
