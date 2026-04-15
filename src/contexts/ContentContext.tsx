import React, { createContext, useContext, useEffect, useState } from 'react'
import { contentService, defaultContent } from '../services/contentService'
import type { SiteContent } from '../types'

interface ContentContextProps {
    content: SiteContent | null;
    loading: boolean;
    refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextProps>({
    content: null,
    loading: true,
    refreshContent: async () => {},
})

export const useContent = () => useContext(ContentContext)

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [content, setContent] = useState<SiteContent | null>(defaultContent)
    const [loading, setLoading] = useState(true)

    const fetchContent = async () => {
        setLoading(true)
        try {
            const data = await contentService.getGlobalContent()
            setContent(data)
        } catch (error) {
            console.error('Error fetching global content:', error)
            setContent((current) => current ?? defaultContent)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContent()
    }, [])

    useEffect(() => {
        if (content) {
            // Update Title
            document.title = content.seoTitle || "Facey's Party Rentals and Catering"

            // Update Description
            let metaDesc = document.querySelector('meta[name="description"]')
            if (!metaDesc) {
                metaDesc = document.createElement('meta')
                metaDesc.setAttribute('name', 'description')
                document.head.appendChild(metaDesc)
            }
            metaDesc.setAttribute('content', content.seoDescription || '')

            // Update Keywords
            let metaKeywords = document.querySelector('meta[name="keywords"]')
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta')
                metaKeywords.setAttribute('name', 'keywords')
                document.head.appendChild(metaKeywords)
            }
            metaKeywords.setAttribute('content', content.seoKeywords || '')

            // Update OG Image if present
            if (content.ogImage) {
                let ogImage = document.querySelector('meta[property="og:image"]')
                if (!ogImage) {
                    ogImage = document.createElement('meta')
                    ogImage.setAttribute('property', 'og:image')
                    document.head.appendChild(ogImage)
                }
                ogImage.setAttribute('content', content.ogImage)
            }
        }
    }, [content])

    return (
        <ContentContext.Provider value={{ content, loading, refreshContent: fetchContent }}>
            {children}
        </ContentContext.Provider>
    )
}
