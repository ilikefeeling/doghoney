/**
 * Dynamic SEO & OpenGraph Meta Tag updater for programmatic landing pages
 */

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export function updateSeoTags(config: SeoConfig) {
  if (typeof document === 'undefined') return;

  // Title
  document.title = `${config.title} | 개꿀 Doghoney`;

  // Helper to set or create meta tag
  const setMetaTag = (selector: string, attributeName: string, attributeValue: string, content: string) => {
    let element = document.querySelector(selector) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  // Description
  setMetaTag('meta[name="description"]', 'name', 'description', config.description);

  // Keywords
  if (config.keywords) {
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', config.keywords);
  }

  // OpenGraph
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', `${config.title} | 개꿀 (Doghoney)`);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', config.description);
  if (config.ogImage) {
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', config.ogImage);
  }

  // Canonical
  if (config.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = config.canonicalUrl;
  }
}
