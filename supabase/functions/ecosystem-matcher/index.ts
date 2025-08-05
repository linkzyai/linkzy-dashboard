import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface MatchingRequest {
  contentId: string;
  userId: string;
  forceReprocess?: boolean;
}

interface MatchScore {
  keywordOverlap: number;
  nicheProximity: number;
  domainAuthority: number;
  geographicRelevance: number;
  partnerQuality: number;
  overall: number;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Geographic distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate keyword overlap score
function calculateKeywordOverlap(sourceKeywords: string[], targetKeywords: string[]): number {
  if (!sourceKeywords.length || !targetKeywords.length) return 0;
  
  const sourceSet = new Set(sourceKeywords.map(k => k.toLowerCase()));
  const targetSet = new Set(targetKeywords.map(k => k.toLowerCase()));
  
  const intersection = new Set([...sourceSet].filter(x => targetSet.has(x)));
  const union = new Set([...sourceSet, ...targetSet]);
  
  return intersection.size / union.size; // Jaccard similarity
}

// Generate contextual anchor text suggestions
function generateAnchorTextSuggestions(keywords: string[], targetUrl: string): string[] {
  const suggestions: string[] = [];
  
  // Extract domain name for branded anchors
  try {
    const domain = new URL(targetUrl).hostname.replace('www.', '');
    const brandName = domain.split('.')[0];
    suggestions.push(brandName);
    suggestions.push(`visit ${brandName}`);
    suggestions.push(`${brandName} services`);
  } catch (e) {
    // Invalid URL, skip branded suggestions
  }
  
  // Keyword-based anchors
  if (keywords.length > 0) {
    suggestions.push(keywords[0]); // Primary keyword
    if (keywords.length > 1) {
      suggestions.push(`${keywords[0]} ${keywords[1]}`); // Compound
    }
    suggestions.push(`${keywords[0]} solutions`);
    suggestions.push(`professional ${keywords[0]}`);
    suggestions.push(`${keywords[0]} services`);
  }
  
  // Generic anchors
  suggestions.push('learn more', 'click here', 'read more', 'this resource');
  
  return [...new Set(suggestions)].slice(0, 5); // Remove duplicates, limit to 5
}

// Calculate niche proximity score
async function getNicheProximityScore(sourceNiche: string, targetNiche: string): Promise<number> {
  if (sourceNiche === targetNiche) return 1.0;
  
  const { data } = await supabase
    .from('niche_proximity')
    .select('proximity_score')
    .or(`and(niche_a.eq.${sourceNiche},niche_b.eq.${targetNiche}),and(niche_a.eq.${targetNiche},niche_b.eq.${sourceNiche})`)
    .single();
  
  return data?.proximity_score || 0.1; // Default low score for unrelated niches
}

// Main matching logic
async function findMatchingOpportunities(contentId: string, userId: string): Promise<any[]> {
  console.log(`🔍 Finding matches for content ${contentId} by user ${userId}`);
  
  // Get source content and user details
  const { data: sourceContent } = await supabase
    .from('tracked_content')
    .select('*, users!inner(niche, website)')
    .eq('id', contentId)
    .single();
  
  if (!sourceContent) {
    throw new Error('Source content not found');
  }
  
  console.log(`📄 Source content: ${sourceContent.title}, niche: ${sourceContent.users.niche}`);
  
  // Get source user's domain metrics for geographic reference
  const { data: sourceDomainMetrics } = await supabase
    .from('domain_metrics')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Find potential target users (exclude the source user)
  const { data: potentialTargets } = await supabase
    .from('users')
    .select(`
      id, niche, website, credits,
      domain_metrics (domain_authority, geographic_location, latitude, longitude, placement_success_rate),
      tracked_content!inner (id, title, keywords, url, created_at)
    `)
    .neq('id', userId)
    .gte('credits', 1) // Must have credits for placement
    .limit(50); // Limit for performance
  
  if (!potentialTargets?.length) {
    console.log('⚠️ No potential targets found');
    return [];
  }
  
  console.log(`🎯 Found ${potentialTargets.length} potential targets`);
  
  const opportunities = [];
  
  for (const target of potentialTargets) {
    if (!target.tracked_content?.length) continue;
    
    // Check existing partner relationship
    const { data: partnerRelation } = await supabase
      .from('partner_relationships')
      .select('quality_score, blocked, auto_approve_threshold')
      .or(`and(user_a_id.eq.${userId},user_b_id.eq.${target.id}),and(user_a_id.eq.${target.id},user_b_id.eq.${userId})`)
      .single();
    
    if (partnerRelation?.blocked) continue; // Skip blocked partners
    
    // For each piece of target content, calculate match scores
    for (const targetContent of target.tracked_content) {
      try {
        const scores: MatchScore = {
          keywordOverlap: 0,
          nicheProximity: 0,
          domainAuthority: 0,
          geographicRelevance: 0,
          partnerQuality: 0,
          overall: 0
        };
        
        // 1. Keyword overlap score (30% weight)
        scores.keywordOverlap = calculateKeywordOverlap(
          sourceContent.keywords || [],
          targetContent.keywords || []
        );
        
        // 2. Niche proximity score (25% weight)
        scores.nicheProximity = await getNicheProximityScore(
          sourceContent.users.niche,
          target.niche
        );
        
        // 3. Domain Authority score (20% weight)
        const targetDA = target.domain_metrics?.[0]?.domain_authority || 0;
        scores.domainAuthority = Math.min(targetDA / 100, 1.0); // Normalize to 0-1
        
        // 4. Geographic relevance score (15% weight)
        if (sourceDomainMetrics?.latitude && sourceDomainMetrics?.longitude && 
            target.domain_metrics?.[0]?.latitude && target.domain_metrics?.[0]?.longitude) {
          const distance = calculateDistance(
            sourceDomainMetrics.latitude,
            sourceDomainMetrics.longitude,
            target.domain_metrics[0].latitude,
            target.domain_metrics[0].longitude
          );
          // Higher score for closer proximity (within 50 miles = 1.0, diminishing returns)
          scores.geographicRelevance = Math.max(0, 1 - (distance / 500));
        } else {
          scores.geographicRelevance = 0.5; // Neutral if no location data
        }
        
        // 5. Partner quality score (10% weight)
        scores.partnerQuality = partnerRelation ? (partnerRelation.quality_score / 10) : 0.5;
        
        // Calculate overall weighted score
        scores.overall = (
          scores.keywordOverlap * 0.30 +
          scores.nicheProximity * 0.25 +
          scores.domainAuthority * 0.20 +
          scores.geographicRelevance * 0.15 +
          scores.partnerQuality * 0.10
        );
        
        // Only create opportunities above minimum threshold
        if (scores.overall >= 0.3) {
          const anchorSuggestions = generateAnchorTextSuggestions(
            targetContent.keywords || [],
            sourceContent.users.website
          );
          
          opportunities.push({
            source_content_id: contentId,
            target_user_id: target.id,
            source_user_id: userId,
            keyword_overlap_score: scores.keywordOverlap,
            niche_proximity_score: scores.nicheProximity,
            domain_authority_score: scores.domainAuthority,
            geographic_relevance_score: scores.geographicRelevance,
            partner_quality_score: scores.partnerQuality,
            overall_match_score: scores.overall,
            suggested_anchor_text: anchorSuggestions[0],
            suggested_target_url: sourceContent.users.website,
            suggested_placement_context: `Natural placement opportunity in content about "${targetContent.title}"`,
            estimated_value: Math.ceil(scores.overall * 3), // 1-3 credits based on quality
            auto_approved: partnerRelation && scores.overall >= (partnerRelation.auto_approve_threshold / 10),
            target_content_title: targetContent.title,
            target_content_url: targetContent.url
          });
        }
      } catch (error) {
        console.error(`Error calculating scores for target ${target.id}:`, error);
      }
    }
  }
  
  // Sort by overall match score
  opportunities.sort((a, b) => b.overall_match_score - a.overall_match_score);
  
  console.log(`✅ Generated ${opportunities.length} opportunities`);
  return opportunities.slice(0, 20); // Return top 20 opportunities
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { contentId, userId, forceReprocess }: MatchingRequest = await req.json();
    
    if (!contentId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing contentId or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if opportunities already exist (unless forcing reprocess)
    if (!forceReprocess) {
      const { data: existing } = await supabase
        .from('placement_opportunities')
        .select('id')
        .eq('source_content_id', contentId)
        .eq('status', 'pending');
      
      if (existing?.length) {
        return new Response(JSON.stringify({ 
          message: 'Opportunities already exist',
          existing_opportunities: existing.length 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Find and create matching opportunities
    const opportunities = await findMatchingOpportunities(contentId, userId);
    
    if (opportunities.length > 0) {
      // Insert opportunities into database
      const { data: insertedOpportunities, error: insertError } = await supabase
        .from('placement_opportunities')
        .insert(opportunities)
        .select('*');
      
      if (insertError) {
        throw new Error(`Failed to create opportunities: ${insertError.message}`);
      }
      
      // Count auto-approved opportunities
      const autoApproved = insertedOpportunities?.filter(op => op.auto_approved).length || 0;
      
      return new Response(JSON.stringify({
        success: true,
        opportunities_created: opportunities.length,
        auto_approved: autoApproved,
        average_score: opportunities.reduce((sum, op) => sum + op.overall_match_score, 0) / opportunities.length,
        top_opportunity: opportunities[0] ? {
          target_user_id: opportunities[0].target_user_id,
          score: opportunities[0].overall_match_score,
          suggested_anchor_text: opportunities[0].suggested_anchor_text
        } : null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: true,
        opportunities_created: 0,
        message: 'No suitable opportunities found above quality threshold'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
  } catch (error) {
    console.error('Ecosystem matching error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 