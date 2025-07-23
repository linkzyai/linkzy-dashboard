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

// Comprehensive stopwords for keyword extraction
const STOPWORDS = new Set([
  // Basic stopwords
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'with', 'this', 'that', 'from', 'have', 'was', 'your', 'all', 'can', 'will', 'has', 'our', 'they', 'their', 'what', 'when', 'where', 'which', 'who', 'how', 'why', 'about', 'into', 'more', 'than', 'then', 'them', 'out', 'use', 'any', 'had', 'his', 'her', 'its', 'one', 'two', 'three', 'on', 'in', 'at', 'by', 'to', 'of', 'a', 'an', 'is', 'it', 'as', 'be', 'or', 'if', 'so', 'do', 'we', 'he', 'she', 'i', 'my', 'me', 'no', 'yes', 'up', 'down', 'over', 'under', 'again', 'new', 'just', 'now', 'only', 'very', 'also', 'after', 'before', 'such', 'each', 'other', 'some', 'most', 'many', 'much', 'like', 'see', 'get', 'got', 'make', 'made', 'back', 'off', 'own', 'too', 'should', 'could', 'would', 'may', 'might', 'must', 'shall', 'did', 'does', 'done', 'being', 'were', 'been', 'because', 'while', 'during', 'between', 'among', 'within', 'without', 'across', 'through', 'upon', 'against', 'toward', 'towards', 'around', 'beside', 'besides', 'behind', 'ahead', 'along', 'alongside', 'amid', 'amidst', 'beyond', 'despite', 'except', 'inside', 'outside', 'since', 'though', 'unless', 'until', 'versus', 'via', 'whether', 'yet', 'etc',
  
  // Website noise words
  'com', 'net', 'org', 'www', 'http', 'https', 'html', 'php', 'asp', 'jsp', 'css', 'js', 'min',
  'home', 'page', 'site', 'web', 'website', 'blog', 'post', 'article', 'content', 'text',
  'click', 'here', 'link', 'read', 'view', 'share', 'email', 'mail', 'contact', 'form',
  'menu', 'nav', 'navigation', 'header', 'footer', 'sidebar', 'main', 'section',
  'div', 'span', 'img', 'image', 'alt', 'title', 'meta', 'tag', 'class', 'style',
  
  // Generic terms
  'login', 'signup', 'register', 'account', 'profile', 'dashboard', 'admin', 'user',
  'search', 'find', 'submit', 'button', 'form', 'field', 'input', 'select', 'option',
  'privacy', 'terms', 'policy', 'legal', 'cookie', 'cookies', 'consent',
  'subscribe', 'newsletter', 'updates', 'follow', 'social', 'media',
  
  // Time/date related
  'today', 'yesterday', 'tomorrow', 'week', 'month', 'year', 'date', 'time',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  
  // Numbers and common technical terms
  'first', 'second', 'third', 'last', 'next', 'previous', 'prev', 'continue',
  'loading', 'error', 'success', 'warning', 'info', 'message', 'alert',
  'please', 'thank', 'thanks', 'welcome', 'hello', 'hi', 'hey', 'okay', 'ok'
]);

// Email pattern to filter out email addresses
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Year pattern to filter out years
const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;

// Extract meaningful keywords from content with enhanced filtering
function extractKeywords(htmlContent, title = '', limit = 15) {
  if (!htmlContent && !title) return [];
  
  try {
    // Parse HTML content to extract structured text
    const $ = require('cheerio').load(htmlContent);
    
    // Extract text from different content sections with weights
    const titleText = (title || $('title').text() || $('h1').first().text()).toLowerCase();
    const headingText = $('h1, h2, h3, h4, h5, h6').map((i, el) => $(el).text()).get().join(' ').toLowerCase();
    const paragraphText = $('p').map((i, el) => $(el).text()).get().join(' ').toLowerCase();
    const mainContent = $('article, main, .content, .post, .entry').text().toLowerCase();
    
    // Combine all text sources with emphasis on titles and headings
    const combinedText = [
      titleText.repeat(3), // Give title words 3x weight
      headingText.repeat(2), // Give heading words 2x weight
      paragraphText,
      mainContent
    ].join(' ');
    
    // Clean text and remove noise
    let cleanText = combinedText
      .replace(EMAIL_PATTERN, '') // Remove email addresses
      .replace(YEAR_PATTERN, '') // Remove years
      .replace(/\b\d+\b/g, '') // Remove standalone numbers
      .replace(/[^\w\s]/g, ' ') // Remove special characters except word boundaries
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Extract potential keywords (2-4 character words, avoiding very short ones)
    const words = cleanText
      .split(/\s+/)
      .filter(word => 
        word.length >= 3 && 
        word.length <= 20 && // Avoid very long words (likely URLs or technical terms)
        !STOPWORDS.has(word) &&
        !/^\d+$/.test(word) && // No pure numbers
        !word.includes('@') && // No email fragments
        !/^(www|http|https)/.test(word) && // No URL fragments
        isNaN(word) // Not a number
      );
    
    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Extract multi-word phrases (2-3 words) for better context
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      const threeWordPhrase = i < words.length - 2 ? `${words[i]} ${words[i + 1]} ${words[i + 2]}` : null;
      
      // Add valuable phrases
      if (isValuablePhrase(twoWordPhrase)) {
        phrases.push(twoWordPhrase);
      }
      if (threeWordPhrase && isValuablePhrase(threeWordPhrase)) {
        phrases.push(threeWordPhrase);
      }
    }
    
    // Combine single words and phrases
    const allTerms = { ...wordFreq };
    phrases.forEach(phrase => {
      allTerms[phrase] = (allTerms[phrase] || 0) + 2; // Give phrases higher weight
    });
    
    // Filter and rank terms by relevance and frequency
    const rankedTerms = Object.entries(allTerms)
      .filter(([term, freq]) => 
        freq >= 2 && // Must appear at least twice
        isTopicalKeyword(term) // Must be topically relevant
      )
      .sort((a, b) => {
        // Sort by frequency, but boost topical relevance
        const aBoost = getTopicalBoost(a[0]);
        const bBoost = getTopicalBoost(b[0]);
        return (b[1] + bBoost) - (a[1] + aBoost);
      })
      .slice(0, limit)
      .map(([term]) => term);
    
    console.log(`🔍 Extracted ${rankedTerms.length} meaningful keywords:`, rankedTerms.slice(0, 10));
    return rankedTerms;
    
  } catch (error) {
    console.error('Keyword extraction error:', error);
    // Fallback to simple extraction
    return simpleKeywordExtraction(htmlContent + ' ' + title, limit);
  }
}

// Check if a phrase is valuable for backlink context
function isValuablePhrase(phrase) {
  const valuablePatterns = [
    /\b(digital|content|social|email|search|video|graphic|web|mobile|brand|marketing)\s+(marketing|strategy|design|development|content|campaign|optimization|analytics)\b/i,
    /\b(creative|design|branding|visual|user|website|app|logo|brand)\s+(process|strategy|identity|experience|design|development|solution|services)\b/i,
    /\b(business|startup|entrepreneur|freelance|agency|consultant|professional)\s+(strategy|growth|development|services|consulting|solutions|tips|advice)\b/i,
    /\b(seo|sem|ppc|social|content|email|digital|online|internet|web)\s+(marketing|strategy|optimization|advertising|campaign|management|analysis)\b/i
  ];
  
  return valuablePatterns.some(pattern => pattern.test(phrase)) || 
         phrase.split(' ').every(word => !STOPWORDS.has(word));
}

// Check if a term is topically relevant
function isTopicalKeyword(term) {
  // Industry and business terms
  const industryTerms = [
    'marketing', 'branding', 'design', 'creative', 'strategy', 'business', 'freelance', 'agency',
    'consultant', 'professional', 'services', 'solutions', 'development', 'management', 'growth',
    'optimization', 'analytics', 'campaign', 'advertising', 'content', 'digital', 'social',
    'seo', 'sem', 'ppc', 'email', 'video', 'graphic', 'web', 'mobile', 'app', 'website',
    'brand', 'identity', 'logo', 'visual', 'user', 'experience', 'interface', 'portfolio',
    'client', 'project', 'process', 'workflow', 'tool', 'software', 'platform', 'technology'
  ];
  
  // Creative and design terms
  const creativeTerms = [
    'photography', 'illustration', 'typography', 'layout', 'color', 'composition', 'aesthetic',
    'style', 'trend', 'inspiration', 'concept', 'vision', 'artistic', 'creative', 'innovative',
    'unique', 'original', 'custom', 'bespoke', 'premium', 'quality', 'professional', 'expert'
  ];
  
  // Business and strategy terms
  const businessTerms = [
    'revenue', 'profit', 'growth', 'scale', 'market', 'target', 'audience', 'customer',
    'client', 'conversion', 'roi', 'kpi', 'metric', 'analysis', 'report', 'dashboard',
    'automation', 'efficiency', 'productivity', 'innovation', 'competitive', 'advantage'
  ];
  
  // Check if term contains industry-relevant words
  const allRelevantTerms = [...industryTerms, ...creativeTerms, ...businessTerms];
  const termLower = term.toLowerCase();
  
  return allRelevantTerms.some(relevant => 
    termLower.includes(relevant) || relevant.includes(termLower)
  ) || 
  // Or if it's a multi-word phrase with at least one relevant word
  (term.includes(' ') && term.split(' ').some(word => 
    allRelevantTerms.includes(word.toLowerCase())
  ));
}

// Get topical relevance boost for ranking
function getTopicalBoost(term) {
  const highValueTerms = [
    'marketing', 'branding', 'design', 'creative', 'strategy', 'business',
    'freelance', 'agency', 'professional', 'consultant', 'development',
    'optimization', 'analytics', 'campaign', 'content', 'digital'
  ];
  
  const termLower = term.toLowerCase();
  const boost = highValueTerms.filter(valuable => 
    termLower.includes(valuable) || valuable.includes(termLower)
  ).length;
  
  return boost * 5; // Give 5 point boost per valuable term
}

// Fallback simple extraction for error cases
function simpleKeywordExtraction(text, limit) {
  if (!text) return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
  
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

// Calculate linkability score based on content quality
function calculateLinkabilityScore(content, title, wordCount, url = '') {
  let score = 0;
  const urlLower = url.toLowerCase();
  const contentLower = content.toLowerCase();
  const titleLower = (title || '').toLowerCase();
  
  // URL-BASED SCORING (Most Important)
  // Blog content gets massive bonus
  const blogIndicators = [
    '/blog/', '/article/', '/post/', '/news/', '/insights/',
    '/resources/', '/guides/', '/tutorials/', '/case-studies/',
    '/stories/', '/updates/', '/content/', '/knowledge/'
  ];
  
  const isBlogContent = blogIndicators.some(indicator => urlLower.includes(indicator));
  if (isBlogContent) {
    score += 40; // Major bonus for blog content
  }
  
  // Service pages get moderate bonus
  const serviceIndicators = [
    '/services/', '/solutions/', '/products/', '/features/',
    '/about/', '/portfolio/', '/work/', '/projects/'
  ];
  
  const isServiceContent = serviceIndicators.some(indicator => urlLower.includes(indicator));
  if (isServiceContent && !isBlogContent) {
    score += 20; // Moderate bonus for service content
  }
  
  // Penalize low-value pages heavily
  const lowValueIndicators = [
    '/pricing', '/support', '/contact', '/login', '/signup',
    '/cart', '/checkout', '/account', '/dashboard'
  ];
  
  const isLowValue = lowValueIndicators.some(indicator => urlLower.includes(indicator));
  if (isLowValue) {
    score -= 30; // Heavy penalty for low-value pages
  }
  
  // CONTENT QUALITY SCORING
  // Base score from word count (blog posts should be longer)
  if (wordCount > 1500) score += 25; // Long-form content bonus
  else if (wordCount > 800) score += 20;
  else if (wordCount > 500) score += 15;
  else if (wordCount > 300) score += 10;
  else if (wordCount > 100) score += 5;
  
  // Title quality
  if (title && title.length > 40) score += 15;
  else if (title && title.length > 20) score += 10;
  
  // High-value content indicators
  const qualityIndicators = [
    { keywords: ['tutorial', 'guide', 'how to'], bonus: 15 },
    { keywords: ['case study', 'research', 'analysis'], bonus: 15 },
    { keywords: ['tips', 'best practices', 'strategies'], bonus: 12 },
    { keywords: ['review', 'comparison', 'vs'], bonus: 10 },
    { keywords: ['example', 'examples', 'showcase'], bonus: 8 },
    { keywords: ['industry', 'trends', 'insights'], bonus: 10 }
  ];
  
  for (const indicator of qualityIndicators) {
    const hasKeyword = indicator.keywords.some(keyword => 
      contentLower.includes(keyword) || titleLower.includes(keyword)
    );
    if (hasKeyword) {
      score += indicator.bonus;
      break; // Only give bonus once
    }
  }
  
  // Content structure indicators (well-formatted content)
  if (content.includes('<h2>') || content.includes('<h3>')) score += 15;
  if (content.includes('<ul>') || content.includes('<ol>')) score += 10;
  if (content.includes('<blockquote>')) score += 8;
  if (content.includes('<code>') || content.includes('<pre>')) score += 5;
  
  // Blog-specific content patterns
  const blogPatterns = [
    'published', 'author', 'read more', 'continue reading',
    'share this', 'comments', 'related posts', 'tags:'
  ];
  
  const hasBlogPatterns = blogPatterns.some(pattern => contentLower.includes(pattern));
  if (hasBlogPatterns) score += 10;
  
  // Professional content indicators
  const professionalIndicators = [
    'creative', 'design', 'marketing', 'strategy', 'business',
    'professional', 'agency', 'consultant', 'expert', 'industry'
  ];
  
  const isProfessionalContent = professionalIndicators.some(indicator => 
    contentLower.includes(indicator) || titleLower.includes(indicator)
  );
  if (isProfessionalContent) score += 8;
  
  // Ensure score is within bounds and adjust for content type
  score = Math.max(0, Math.min(score, 100));
  
  // Final adjustments based on content type
  if (isBlogContent && score < 60) {
    score = Math.max(60, score); // Ensure blog content gets minimum 60
  }
  
  if (isLowValue && score > 30) {
    score = Math.min(30, score); // Cap low-value pages at 30
  }
  
  return score;
}

// Find potential anchor text opportunities
function findAnchorOpportunities(content, niche, url = '') {
  const opportunities = [];
  const contentLower = content.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Blog-specific anchor opportunities (high value)
  const blogAnchors = [
    'read the full article', 'check out this guide', 'see the tutorial',
    'view case study', 'learn more here', 'detailed analysis',
    'comprehensive guide', 'step-by-step tutorial', 'expert insights',
    'industry research', 'best practices', 'proven strategies'
  ];
  
  // Creative professional anchor opportunities
  const creativeAnchors = [
    'creative inspiration', 'design portfolio', 'creative process',
    'design showcase', 'creative work', 'professional examples',
    'industry expertise', 'creative solutions', 'design insights',
    'marketing strategies', 'branding examples', 'creative agency'
  ];
  
  // Service-based anchor opportunities
  const serviceAnchors = [
    'professional services', 'expert consultation', 'specialized solutions',
    'industry leader', 'proven expertise', 'professional portfolio',
    'client success stories', 'expert team', 'trusted partner'
  ];
  
  // Generic high-value anchors
  const genericAnchors = [
    'valuable resource', 'expert guide', 'industry insights',
    'professional analysis', 'detailed review', 'comprehensive overview',
    'authoritative source', 'trusted information', 'expert opinion'
  ];
  
  // Determine content type and prioritize anchors accordingly
  const isBlogContent = [
    '/blog/', '/article/', '/post/', '/guide/', '/tutorial/',
    '/case-study/', '/insights/', '/resources/'
  ].some(indicator => urlLower.includes(indicator));
  
  const isServiceContent = [
    '/services/', '/portfolio/', '/work/', '/about/',
    '/solutions/', '/projects/'
  ].some(indicator => urlLower.includes(indicator));
  
  // Add anchors based on content type
  if (isBlogContent) {
    // Prioritize blog-specific anchors for blog content
    for (const anchor of blogAnchors) {
      if (contentLower.includes(anchor.split(' ')[0]) || 
          contentLower.includes('article') || 
          contentLower.includes('guide') ||
          contentLower.includes('tutorial')) {
        opportunities.push(anchor);
      }
    }
  }
  
  if (isServiceContent) {
    // Add service-specific anchors
    for (const anchor of serviceAnchors) {
      if (contentLower.includes('service') || 
          contentLower.includes('professional') ||
          contentLower.includes('portfolio') ||
          contentLower.includes('work')) {
        opportunities.push(anchor);
      }
    }
  }
  
  // Add creative-specific anchors if content is creative-focused
  const creativeKeywords = [
    'design', 'creative', 'marketing', 'branding', 'advertising',
    'agency', 'portfolio', 'visual', 'graphic', 'web design'
  ];
  
  const isCreativeContent = creativeKeywords.some(keyword => 
    contentLower.includes(keyword)
  );
  
  if (isCreativeContent) {
    for (const anchor of creativeAnchors) {
      const keywordInAnchor = anchor.split(' ')[0];
      if (contentLower.includes(keywordInAnchor)) {
        opportunities.push(anchor);
      }
    }
  }
  
  // Add generic high-value anchors
  for (const anchor of genericAnchors) {
    const keywordInAnchor = anchor.split(' ')[0];
    if (contentLower.includes(keywordInAnchor) || 
        contentLower.includes('expert') ||
        contentLower.includes('professional') ||
        contentLower.includes('industry')) {
      opportunities.push(anchor);
      if (opportunities.length >= 8) break; // Limit to reasonable number
    }
  }
  
  // Niche-specific anchors (enhanced for creative professionals)
  const nicheAnchors = {
    technology: ['innovative solution', 'tech expertise', 'cutting-edge technology', 'digital innovation'],
    marketing: ['marketing expertise', 'campaign strategy', 'brand development', 'marketing insights'],
    business: ['business strategy', 'industry expertise', 'professional consulting', 'business solutions'],
    creative: ['creative portfolio', 'design expertise', 'creative solutions', 'visual storytelling'],
    design: ['design showcase', 'creative work', 'design process', 'visual identity'],
    health: ['wellness expertise', 'health insights', 'professional guidance', 'trusted resource'],
    finance: ['financial expertise', 'investment insights', 'financial planning', 'money management']
  };
  
  // Add niche-specific opportunities
  if (niche && nicheAnchors[niche.toLowerCase()]) {
    for (const anchor of nicheAnchors[niche.toLowerCase()]) {
      const keywordInAnchor = anchor.split(' ')[0];
      if (contentLower.includes(keywordInAnchor)) {
        opportunities.push(anchor);
      }
    }
  }
  
  // Remove duplicates and limit to most relevant
  const uniqueOpportunities = [...new Set(opportunities)];
  
  // Prioritize based on content type
  if (isBlogContent) {
    // For blog content, prioritize informational anchors
    return uniqueOpportunities
      .filter(anchor => 
        anchor.includes('guide') || 
        anchor.includes('article') || 
        anchor.includes('tutorial') ||
        anchor.includes('insights') ||
        anchor.includes('analysis')
      )
      .concat(uniqueOpportunities.filter(anchor => 
        !anchor.includes('guide') && 
        !anchor.includes('article') && 
        !anchor.includes('tutorial')
      ))
      .slice(0, 6);
  }
  
  return uniqueOpportunities.slice(0, 6);
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
    
    // Extract keywords using enhanced extraction with full HTML content
    const keywords = extractKeywords(html, title);
    
    // Calculate linkability score
    const linkabilityScore = calculateLinkabilityScore(html, title, wordCount, url);
    
    // Find anchor opportunities
    const anchorOpportunities = findAnchorOpportunities(content, userNiche, url);
    
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
    const blogPages = new Set();
    const servicePagesLowPriority = new Set();
    
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
          // Skip unwanted file types, fragments, and low-value pages
          if (!urlObj.pathname.match(/\.(jpg|jpeg|png|gif|pdf|doc|zip|exe)$/i) && 
              !urlObj.href.includes('#')) {
            
            const path = urlObj.pathname.toLowerCase();
            const fullPath = fullUrl.toLowerCase();
            
            // Skip obvious service/account pages
            const skipPatterns = [
              '/login', '/signin', '/signup', '/register', '/account', '/profile',
              '/checkout', '/cart', '/payment', '/billing', '/invoice',
              '/admin', '/dashboard', '/settings', '/preferences',
              '/terms', '/privacy', '/legal', '/cookies',
              '/404', '/error', '/maintenance',
              '/api/', '/webhook', '/callback'
            ];
            
            const shouldSkip = skipPatterns.some(pattern => path.includes(pattern));
            if (shouldSkip) return;
            
            // Prioritize blog content (HIGH PRIORITY)
            const blogIndicators = [
              '/blog/', '/article/', '/post/', '/news/', '/insights/',
              '/resources/', '/guides/', '/tutorials/', '/case-studies/',
              '/stories/', '/updates/', '/content/', '/knowledge/'
            ];
            
            const isBlogContent = blogIndicators.some(indicator => path.includes(indicator));
            
            if (isBlogContent) {
              blogPages.add(fullUrl);
            } else {
              // Check if it's a service page that might be linkable
              const servicePagesHighValue = [
                '/services/', '/solutions/', '/products/', '/features/',
                '/about/', '/team/', '/company/', '/mission/',
                '/portfolio/', '/work/', '/projects/', '/clients/',
                '/contact/', '/locations/', '/careers/'
              ];
              
              const isHighValueService = servicePagesHighValue.some(indicator => path.includes(indicator));
              
              if (isHighValueService) {
                servicePagesLowPriority.add(fullUrl);
              } else if (!path.includes('/pricing') && !path.includes('/support')) {
                // Include other pages but with lower priority
                pages.add(fullUrl);
              }
            }
          }
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    // Prioritize blog content, then service pages, then other pages
    const prioritizedPages = [
      ...Array.from(blogPages).slice(0, Math.floor(maxPages * 0.6)), // 60% blog content
      ...Array.from(servicePagesLowPriority).slice(0, Math.floor(maxPages * 0.3)), // 30% service pages
      ...Array.from(pages).slice(0, Math.floor(maxPages * 0.1)) // 10% other pages
    ];
    
    // Always include the homepage
    const finalPages = [baseUrl, ...prioritizedPages.filter(p => p !== baseUrl)].slice(0, maxPages);
    
    console.log(`📊 Page discovery results:
    - Total found: ${finalPages.length}
    - Blog content: ${blogPages.size}
    - Service pages: ${servicePagesLowPriority.size}
    - Other pages: ${pages.size}`);
    
    return finalPages;
    
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

    // Verify the website URL matches the user's profile website
    console.log('🔐 Verifying user website authorization...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('website')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Unable to verify user permissions' }),
      };
    }

    if (!userProfile?.website) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No website set in profile',
          message: 'Please set your website URL in your profile settings before scanning.'
        }),
      };
    }

    // Normalize URLs for comparison (remove trailing slashes, convert to lowercase)
    const normalizeUrl = (url) => url.toLowerCase().replace(/\/+$/, '');
    const profileWebsite = normalizeUrl(userProfile.website);
    const requestedWebsite = normalizeUrl(website_url);

    if (profileWebsite !== requestedWebsite) {
      console.warn(`🚫 Website mismatch: Profile has ${profileWebsite}, requested ${requestedWebsite}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Website authorization failed',
          message: 'You can only scan the website specified in your profile.',
          profile_website: userProfile.website
        }),
      };
    }

    console.log(`🔍 Starting authorized website scan for: ${website_url}`);

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

    // Generate enhanced content summary
    const topKeywords = Array.from(allKeywords).slice(0, 20);
    const highQualityPages = linkableContent.filter(page => page.linkable_score >= 70).length;
    const blogPages = linkableContent.filter(page => 
      page.page_url.toLowerCase().includes('/blog/') || 
      page.page_url.toLowerCase().includes('/article/') ||
      page.page_url.toLowerCase().includes('/post/')
    ).length;
    
    // Create intelligent summary based on content analysis
    let summary = `Analyzed ${pages.length} pages and found ${linkableContent.length} linkable opportunities.`;
    
    if (highQualityPages > 0) {
      summary += ` ${highQualityPages} high-quality pages (70+ score) identified.`;
    }
    
    if (blogPages > 0) {
      summary += ` ${blogPages} blog posts discovered.`;
    }
    
    if (topKeywords.length > 0) {
      const mainTopics = topKeywords.slice(0, 3).join(', ');
      summary += ` Main content themes: ${mainTopics}.`;
    }
    
    // Add niche-specific insights
    if (niche) {
      const nicheKeywords = topKeywords.filter(keyword => 
        keyword.toLowerCase().includes(niche.toLowerCase()) ||
        niche.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (nicheKeywords.length > 0) {
        summary += ` Strong ${niche} content focus detected.`;
      }
    }

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