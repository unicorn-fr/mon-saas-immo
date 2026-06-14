import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  type?: 'website' | 'article'
  jsonLd?: object
}

export function useSEO({ title, description, canonical, ogImage, type = 'website', jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:type', type, 'property')
    if (ogImage) setMeta('og:image', ogImage, 'property')
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', canonical)
    }
    if (jsonLd) {
      const existing = document.getElementById('json-ld-script')
      if (existing) existing.remove()
      const script = document.createElement('script')
      script.id = 'json-ld-script'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
  }, [title, description, canonical, ogImage, type])
}
