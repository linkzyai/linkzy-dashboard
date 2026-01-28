import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Fetch published articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('published', true)
    .eq('deleted', false)
    .order('published_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching articles:', error)
    process.exit(1)
  }
  
  console.log(`✅ Found ${articles?.length || 0} published articles`)
  
  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: 'pricing', priority: '0.9', changefreq: 'weekly' },
    { url: 'how-it-works', priority: '0.8', changefreq: 'weekly' },
    { url: 'blog', priority: '0.8', changefreq: 'daily' },
    { url: 'faq', priority: '0.7', changefreq: 'monthly' },
    { url: 'login', priority: '0.6', changefreq: 'monthly' },
    { url: 'signup', priority: '0.6', changefreq: 'monthly' },
    { url: 'terms', priority: '0.5', changefreq: 'yearly' },
  ]
  
  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>https://linkzy.ai/${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${(articles || []).map(article => `  <url>
    <loc>https://linkzy.ai/blog/${article.slug}</loc>
    <lastmod>${new Date(article.published_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`
  
  // Write to dist directory
  const distDir = path.resolve(process.cwd(), 'dist')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap)
  console.log(`✅ Sitemap generated with ${(articles?.length || 0) + staticPages.length} URLs`)
  console.log(`📝 Written to dist/sitemap.xml`)
}

generateSitemap().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
