import type { MetadataRoute } from 'next'

// 本番ドメイン固定（env が localhost のときに sitemap へ混入するのを防ぐ）
const baseUrl = 'https://ele-cal.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    // ツール群
    { url: `${baseUrl}/allowable_current`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/breaker`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/apartment_main`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/pipe_size`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/voltage_drop_v2`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // 情報ページ
    { url: `${baseUrl}/questions`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/feedback`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    // 法務
    { url: `${baseUrl}/legal/tokushoho`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
