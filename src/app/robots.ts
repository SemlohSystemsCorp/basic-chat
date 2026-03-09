import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/w/',
          '/onboarding/',
          '/create/',
          '/join/',
          '/verify-email',
          '/ip-banned',
          '/unavailable',
          '/unsupported-browser',
          '/unsupported-device',
        ],
      },
    ],
    sitemap: 'https://chatterbox.app/sitemap.xml',
  };
}
