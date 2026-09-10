import { useEffect } from 'react';

/**
 * Lightweight SEO Head Manager for React SPA without heavy dependencies.
 * Updates document.title, meta tags, canonical link, and injects Schema.org JSON-LD structured data.
 */
export default function SeoHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://chongziapp.id.vn/ap2.png',
  schemaData = null,
}) {
  useEffect(() => {
    // 1. Update Title
    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    // Helper to set or create meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Set Standard Meta Tags
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }
    if (title) {
      setMetaTag('property', 'og:title', title);
      setMetaTag('name', 'twitter:title', title);
    }
    if (keywords && keywords.length > 0) {
      setMetaTag('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
    }
    setMetaTag('property', 'og:type', ogType);
    if (ogImage) {
      setMetaTag('property', 'og:image', ogImage);
      setMetaTag('name', 'twitter:image', ogImage);
    }
    if (canonicalUrl) {
      setMetaTag('property', 'og:url', canonicalUrl);
      setLinkTag('canonical', canonicalUrl);
    }

    // 3. Inject Schema.org JSON-LD
    let scriptEl = null;
    if (schemaData) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.id = 'seo-schema-jsonld';
      scriptEl.text = JSON.stringify(schemaData);
      document.head.appendChild(scriptEl);
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitle;
      const existingScript = document.getElementById('seo-schema-jsonld');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, schemaData]);

  return null;
}
