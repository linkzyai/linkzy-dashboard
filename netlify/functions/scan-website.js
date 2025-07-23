const cheerio = require('cheerio');

// Initialize Supabase client
const { createClient } = require('@supabase/supabase-js');

// Add fetch polyfill for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple stopwords for keyword extraction
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'with', 'this', 'that', 'from', 'have', 'was', 'your', 'all', 'can', 'will', 'has', 'our', 'they', 'their', 'what', 'when', 'where', 'which', 'who', 'how', 'why', 'about', 'into', 'more', 'than', 'then', 'them', 'out', 'use', 'any', 'had', 'his', 'her', 'its', 'one', 'two', 'three', 'on', 'in', 'at', 'by', 'to', 'of', 'a', 'an', 'is', 'it', 'as', 'be', 'or', 'if', 'so', 'do', 'we', 'he', 'she', 'i', 'my', 'me', 'no', 'yes', 'up', 'down', 'over', 'under', 'again', 'new', 'just', 'now', 'only', 'very', 'also', 'after', 'before', 'such', 'each', 'other', 'some', 'most', 'many', 'much', 'like', 'see', 'get', 'got', 'make', 'made', 'back', 'off', 'own', 'too', 'should', 'could', 'would', 'may', 'might', 'must', 'shall', 'did', 'does', 'done', 'being', 'were', 'been', 'because', 'while', 'during', 'between', 'among', 'within', 'without', 'across', 'through', 'upon', 'against', 'toward', 'towards', 'around', 'beside', 'besides', 'behind', 'ahead', 'along', 'alongside', 'amid', 'amidst', 'beyond', 'despite', 'except', 'inside', 'outside', 'since', 'though', 'unless', 'until', 'versus', 'via', 'whether', 'yet', 'etc'
]);

// Extract keywords from text
function extractKeywords(text, limit = 20) {
  if (!text) return [];
  
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

// Calculate linkability score based on content quality
function calculateLinkabilityScore(content, title, wordCount) {
  let score = 0;
  
  // Base score from word count
  if (wordCount > 500) score += 30;
  else if (wordCount > 300) score += 20;
  else if (wordCount > 100) score += 10;
  
  // Title quality
  if (title && title.length > 20) score += 15;
  if (title && title.length > 40) score += 10;
  
  // Content indicators
  const qualityIndicators = [
    'tutorial', 'guide', 'how to', 'tips', 'best practices', 
    'review', 'comparison', 'analysis', 'case study', 'research'
  ];
  
  const contentLower = content.toLowerCase();
  for (const indicator of qualityIndicators) {
    if (contentLower.includes(indicator)) {
      score += 10;
      break;
    }
  }
  
  // Content structure indicators
  if (content.includes('<h2>') || content.includes('<h3>')) score += 15;
  if (content.includes('<ul>') || content.includes('<ol>')) score += 10;
  if (content.includes('<p>')) score += 5;
  
  return Math.min(score, 100);
}

// Find potential anchor text opportunities
function findAnchorOpportunities(content, niche) {
  const opportunities = [];
  const contentLower = content.toLowerCase();
  
  // Generic anchor opportunities
  const genericAnchors = [
    'learn more', 'read more', 'click here', 'this article', 'helpful resource',
    'useful tool', 'great example', 'additional information', 'further reading'
  ];
  
  // Niche-specific anchors
  const nicheAnchors = {
    technology: ['software', 'platform', 'tool', 'solution', 'technology'],
    marketing: ['strategy', 'campaign', 'marketing', 'advertising', 'promotion'],
    business: ['business', 'company', 'enterprise', 'startup', 'organization'],
    health: ['health', 'wellness', 'fitness', 'medical', 'healthcare'],
    finance: ['financial', 'money', 'investment', 'banking', 'economic']
  };
  
  // Add generic opportunities
  for (const anchor of genericAnchors) {
    if (contentLower.includes(anchor)) {
      opportunities.push(anchor);
    }
  }
  
  // Add niche-specific opportunities
  if (niche && nicheAnchors[niche.toLowerCase()]) {
    for (const anchor of nicheAnchors[niche.toLowerCase()]) {
      if (contentLower.includes(anchor)) {
        opportunities.push(anchor);
      }
    }
  }
  
  return [...new Set(opportunities)];
}

// Fetch and parse a single page
async function analyzePage(url, userNiche = '') {
  try {
    console.log(`📄 Analyzing page: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkzyBot/1.0; +https://linkzy.ai)'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract basic information
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Extract main content (try multiple selectors)
    const contentSelectors = [
      'article', 'main', '.content', '#content', '.post', '.entry',
      '.article-content', '.post-content', '.entry-content'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > content.length) {
        content = element.text().trim();
      }
    }
    
    // Fallback to body content if no main content found
    if (!content) {
      $('script, style, nav, header, footer, aside').remove();
      content = $('body').text().trim();
    }
    
    // Clean and truncate content
    content = content.replace(/\s+/g, ' ').substring(0, 5000);
    const wordCount = content.split(/\s+/).length;
    
    // Extract keywords
    const keywords = extractKeywords(content);
    
    // Calculate linkability score
    const linkabilityScore = calculateLinkabilityScore(html, title, wordCount);
    
    // Find anchor opportunities
    const anchorOpportunities = findAnchorOpportunities(content, userNiche);
    
    return {
      url,
      title,
      metaDescription,
      content: content.substring(0, 1000), // Store snippet
      keywords,
      wordCount,
      linkabilityScore,
      anchorOpportunities,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Failed to analyze ${url}:`, error.message);
    return {
      url,
      success: false,
      error: error.message
    };
  }
}

// Discover pages from a website
async function discoverPages(baseUrl, maxPages = 20) {
  try {
    console.log(`🕷️ Discovering pages from: ${baseUrl}`);
    
    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkzyBot/1.0; +https://linkzy.ai)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const baseHost = new URL(baseUrl).hostname;
    
    const pages = new Set([baseUrl]);
    
    // Extract links from the page
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (!href) return;
      
      try {
        let fullUrl;
        if (href.startsWith('http')) {
          fullUrl = href;
        } else if (href.startsWith('/')) {
          fullUrl = new URL(href, baseUrl).href;
        } else {
          fullUrl = new URL(href, baseUrl).href;
        }
        
        const urlObj = new URL(fullUrl);
        
        // Only include pages from the same domain
        if (urlObj.hostname === baseHost) {
          // Skip unwanted file types and fragments
          if (!urlObj.pathname.match(/\.(jpg|jpeg|png|gif|pdf|doc|zip|exe)$/i) && 
              !urlObj.href.includes('#')) {
            pages.add(fullUrl);
          }
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    // Convert to array and limit
    return Array.from(pages).slice(0, maxPages);
    
  } catch (error) {
    console.error(`❌ Failed to discover pages from ${baseUrl}:`, error.message);
    return [baseUrl]; // Return at least the base URL
  }
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate environment variables
    if (!process.env.VITE_SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL environment variable is missing');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing');
    }

    console.log('🔧 Environment check passed');
    console.log('📡 Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('🔑 Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { website_url, user_id, niche = '' } = JSON.parse(event.body);

    if (!website_url || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log(`🔍 Starting website scan for: ${website_url}`);

    // Create initial analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('website_analysis')
      .insert({
        user_id,
        website_url,
        scan_status: 'scanning',
        scan_progress: 0
      })
      .select()
      .single();

    if (analysisError) {
      throw new Error(`Failed to create analysis record: ${analysisError.message}`);
    }

    const analysisId = analysis.id;

    // Discover pages
    const pages = await discoverPages(website_url);
    
    // Update progress
    await supabase
      .from('website_analysis')
      .update({ 
        total_pages: pages.length,
        scan_progress: 10 
      })
      .eq('id', analysisId);

    console.log(`📋 Found ${pages.length} pages to analyze`);

    // Analyze each page
    const allKeywords = new Set();
    const pageTitles = [];
    const linkableContent = [];

    for (let i = 0; i < pages.length; i++) {
      const pageResult = await analyzePage(pages[i], niche);
      
      if (pageResult.success) {
        pageTitles.push(pageResult.title);
        pageResult.keywords.forEach(kw => allKeywords.add(kw));
        
        // Store linkable content
        const contentData = {
          user_id,
          website_analysis_id: analysisId,
          page_url: pageResult.url,
          page_title: pageResult.title,
          meta_description: pageResult.metaDescription,
          content_snippet: pageResult.content,
          keywords: pageResult.keywords,
          niche: niche || 'general',
          word_count: pageResult.wordCount,
          linkable_score: pageResult.linkabilityScore,
          anchor_opportunities: pageResult.anchorOpportunities
        };
        
        linkableContent.push(contentData);
      }
      
      // Update progress
      const progress = Math.floor(((i + 1) / pages.length) * 80) + 10;
      await supabase
        .from('website_analysis')
        .update({ scan_progress: progress })
        .eq('id', analysisId);
    }

    // Store linkable content in batch
    if (linkableContent.length > 0) {
      const { error: contentError } = await supabase
        .from('linkable_content')
        .insert(linkableContent);
        
      if (contentError) {
        console.error('Failed to store linkable content:', contentError);
      }
    }

    // Generate content summary
    const topKeywords = Array.from(allKeywords).slice(0, 20);
    const summary = `Analyzed ${pages.length} pages. Top content themes: ${topKeywords.slice(0, 5).join(', ')}. ${linkableContent.length} pages with linkable content identified.`;

    // Complete the analysis
    await supabase
      .from('website_analysis')
      .update({
        page_titles: pageTitles,
        keywords: topKeywords,
        content_summary: summary,
        scan_status: 'completed',
        scan_progress: 100,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    console.log(`✅ Website scan completed for: ${website_url}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis_id: analysisId,
        pages_analyzed: pages.length,
        linkable_pages: linkableContent.length,
        top_keywords: topKeywords.slice(0, 10),
        summary
      }),
    };

  } catch (error) {
    console.error('Website scan error:', error);
    
    // Try to create a basic analysis record even if scan fails
    try {
      const { website_url, user_id } = JSON.parse(event.body || '{}');
      
      if (website_url && user_id) {
        console.log('🔄 Creating fallback analysis record...');
        
        const { data: fallbackAnalysis } = await supabase
          .from('website_analysis')
          .insert({
            user_id,
            website_url,
            scan_status: 'failed',
            scan_progress: 0,
            error_message: error.message,
            content_summary: 'Scan failed - manual retry may be needed'
          })
          .select()
          .single();

        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Website scan failed',
            message: error.message,
            analysis_id: fallbackAnalysis?.id,
            fallback_created: true
          }),
        };
      }
    } catch (fallbackError) {
      console.error('Fallback analysis creation failed:', fallbackError);
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Website scan failed',
        message: error.message
      }),
    };
  }
}; 