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
  
  // Get source content and user details (simplified)
  const { data: sourceContent } = await supabase
    .from('tracked_content')
    .select('*')
    .eq('id', contentId)
    .single();
  
  if (!sourceContent) {
    throw new Error('Source content not found');
  }
  
  // Get source user details separately
  const { data: sourceUser } = await supabase
    .from('users')
    .select('niche, website')
    .eq('id', sourceContent.user_id)
    .single();
  
  if (!sourceUser) {
    throw new Error('Source user not found');
  }
  
  console.log(`📄 Source content: ${sourceContent.title}, niche: ${sourceUser.niche}`);
  
  // Domain metrics table doesn't exist in current schema - skip geographic scoring
  
  // Find potential target users (exclude the source user) - simplified
  const { data: potentialUsers } = await supabase
    .from('users')
    .select('id, niche, website, credits')
    .neq('id', userId)
    .gte('credits', 1) // Must have credits for placement
    .limit(10); // Reduced limit for performance
  
  if (!potentialUsers?.length) {
    console.log('⚠️ No potential target users found');
    return [];
  }
  
  // Get tracked content for each user separately
  const potentialTargets = [];
  for (const user of potentialUsers) {
    const { data: userContent } = await supabase
      .from('tracked_content')
      .select('id, title, keywords, url, created_at')
      .eq('user_id', user.id)
      .limit(5); // Max 5 content items per user
    
    if (userContent?.length) {
      potentialTargets.push({
        ...user,
        tracked_content: userContent
      });
    }
  }
  
  if (!potentialTargets?.length) {
    console.log('⚠️ No potential targets found');
    return [];
  }
  
  console.log(`🎯 Found ${potentialTargets.length} potential targets`);
  
  const opportunities = [];
  
  for (const target of potentialTargets) {
    if (!target.tracked_content?.length) continue;
    
    // Partner relationship check removed - table doesn't exist in current schema
    // All users are considered potential partners for now
    
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
          sourceUser.niche,
          target.niche
        );
        
        // 3. Domain Authority score (20% weight) - Default since domain_metrics table doesn't exist
        scores.domainAuthority = 0.5; // Default neutral DA score
        
        // 4. Geographic relevance score (15% weight) - Default since domain_metrics table doesn't exist
        scores.geographicRelevance = 0.5; // Neutral score since no geographic data available
        
        // 5. Partner quality score (10% weight)
        scores.partnerQuality = 0.5; // Default neutral score since partner_relationships table doesn't exist
        
        // Calculate overall weighted score
        scores.overall = (
          scores.keywordOverlap * 0.30 +
          scores.nicheProximity * 0.25 +
          scores.domainAuthority * 0.20 +
          scores.geographicRelevance * 0.15 +
          scores.partnerQuality * 0.10
        );
        
        // Only create opportunities above minimum threshold (temporarily lowered for debugging)
        if (scores.overall >= 0.1) {
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
            suggested_target_url: sourceUser.website,
            suggested_placement_context: `Natural placement opportunity in content about "${targetContent.title}"`,
            estimated_value: Math.ceil(scores.overall * 3), // 1-3 credits based on quality
            auto_approved: scores.overall >= 0.7, // Auto-approve if score is high enough
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