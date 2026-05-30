import type { MetadataRoute } from 'next'

const baseUrl = 'https://ele-cal.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 通常検索エンジン（Googlebot / Bingbot など）
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account', '/subscribe', '/sign-in', '/sign-up'],
      },
      // ChatGPT 検索 / ユーザー起点アクセス
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      // Claude 検索 / ユーザー起点アクセス
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      // Perplexity
      { userAgent: 'PerplexityBot', allow: '/' },
      // Google AI プロダクト制御（検索順位には影響しない）
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
