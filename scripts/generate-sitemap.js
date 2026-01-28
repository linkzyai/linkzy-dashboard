import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...')
  console.log('📍 Supabase URL:', supabaseUrl ? 'Set ✓' : 'Missing ✗')
  console.log('🔑 Service Key:', supabaseKey ? 'Set ✓' : 'Missing ✗')
  
  // Generate sitemap with static pages only for now
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
  
  let articles = []
  
  // Try to fetch articles, but don't fail if it doesn't work
  if (supabaseUrl && supabaseKey) {
    try {
      console.log('🔄 Attempting to fetch articles from Supabase...')
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data, error } = await supabase
        .from('articles')
        .select('slug, published_at')
        .eq('published', true)
        .eq('deleted', false)
        .order('published_at', { ascending: false })
      
      if (error) {
        console.warn('⚠️  Could not fetch articles:', error.message)
        console.log('📝 Generating sitemap with static pages only')
      } else {
        articles = data || []
        console.log(`✅ Found ${articles.length} published articles`)
      }
    } catch (error) {
      console.warn('⚠️  Network error fetching articles:', error.message)
      console.log('📝 Generating sitemap with static pages only')
    }
  } else {
    console.warn('⚠️  Supabase credentials missing')
    console.log('📝 Generating sitemap with static pages only')
  }
  
  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>https://linkzy.ai/${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${articles.map(article => `  <url>
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
  console.log(`✅ Sitemap generated with ${articles.length + staticPages.length} URLs`)
  console.log(`   - Static pages: ${staticPages.length}`)
  console.log(`   - Blog articles: ${articles.length}`)
  console.log(`📝 Written to dist/sitemap.xml`)
}

generateSitemap().catch(error => {
  console.error('❌ Fatal error:', error)
  // Don't exit with error - just generate static sitemap
  process.exit(0)
})
