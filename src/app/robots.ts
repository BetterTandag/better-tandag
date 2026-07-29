import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/lgu-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/*/search' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
