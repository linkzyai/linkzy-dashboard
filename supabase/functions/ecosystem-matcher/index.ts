import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Geographic distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate phrase overlap score
function phraseOverlap(sourceKw: string[] = [], targetKw: string[] = []) {
  if (!sourceKw.length || !targetKw.length) return 0;
  const norm = (s: string) => s.toLowerCase().trim();
  const s = sourceKw.map(norm);
  const t = targetKw.map(norm);
  // weight 3-grams > 2-grams > 1-grams
  const w = (k: string) =>
    k.split(" ").length >= 3 ? 3 : k.split(" ").length === 2 ? 2 : 1;
  const sMap = new Map<string, number>();
  s.forEach((k) => sMap.set(k, (sMap.get(k) || 0) + w(k)));
  const tMap = new Map<string, number>();
  t.forEach((k) => tMap.set(k, (tMap.get(k) || 0) + w(k)));
  const keys = new Set([...sMap.keys(), ...tMap.keys()]);
  let inter = 0,
    uni = 0;
  keys.forEach((k) => {
    inter += Math.min(sMap.get(k) || 0, tMap.get(k) || 0);
    uni += Math.max(sMap.get(k) || 0, tMap.get(k) || 0);
  });
  return uni ? inter / uni : 0;
}

// Calculate keyword overlap score
function calculateKeywordOverlap(sourceKeywords, targetKeywords) {
  if (!sourceKeywords.length || !targetKeywords.length) return 0;
  const sourceSet = new Set(sourceKeywords.map((k) => k.toLowerCase()));
  const targetSet = new Set(targetKeywords.map((k) => k.toLowerCase()));
  const intersection = new Set([...sourceSet].filter((x) => targetSet.has(x)));
  const union = new Set([...sourceSet, ...targetSet]);
  return intersection.size / union.size; // Jaccard similarity
}
// Generate contextual anchor text suggestions
function generateAnchorTextSuggestions(keywords, targetUrl) {
  const suggestions = [];
  // Extract domain name for branded anchors
  try {
    const domain = new URL(targetUrl).hostname.replace("/^www./", "");
    const brandName = domain.split(".")[0];
    suggestions.push(brandName);
    suggestions.push(`visit ${brandName}`);
    suggestions.push(`${brandName} services`);
  } catch (e) {
    // Invalid URL, skip branded suggestions
    console.error(
      "Error while handling the domain on generateAnchorTextSuggestions: ",
      e
    );
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
  suggestions.push("learn more", "click here", "read more", "this resource");
  return [...new Set(suggestions)].slice(0, 5); // Remove duplicates, limit to 5
}
// Calculate niche proximity score
async function getNicheProximityScore(sourceNiche, targetNiche) {
  if (sourceNiche === targetNiche) return 1.0;
  const { data } = await supabase
    .from("niche_proximity")
    .select("proximity_score")
    .or(
      `and(niche_a.eq.${sourceNiche},niche_b.eq.${targetNiche}),and(niche_a.eq.${targetNiche},niche_b.eq.${sourceNiche})`
    )
    .single();
  return data?.proximity_score || 0.1; // Default low score for unrelated niches
}
// Main matching logic
async function findMatchingOpportunities(contentId, userId) {
  console.log(`🔍 Finding matches for content ${contentId} by user ${userId}`);
  // Get source content and user details (simplified)
  const { data: sourceContent } = await supabase
    .from("tracked_content")
    .select("*")
    .eq("id", contentId)
    .single();
  if (!sourceContent) {
    throw new Error("Source content not found");
  }
  // Get source user details separately
  const { data: sourceUser } = await supabase
    .from("users")
    .select("niche, website")
    .eq("id", sourceContent.user_id)
    .single();
  if (!sourceUser) {
    throw new Error("Source user not found");
  }
  console.log(
    `📄 Source content: ${sourceContent.title}, niche: ${sourceUser.niche}`
  );
  // Domain metrics table doesn't exist in current schema - skip geographic scoring
  // Find potential target users (exclude the source user) - simplified
  const { data: potentialUsers } = await supabase
    .from("users")
    .select("id, niche, website, credits")
    .neq("id", userId);
  if (!potentialUsers?.length) {
    console.log("⚠️ No potential target users found");
    return [];
  }
  // Attach content count
  const usersWithContent = [];
  for (const u of potentialUsers) {
    const { data: tc } = await supabase
      .from("tracked_content")
      .select("id, title, keywords, url")
      .eq("user_id", u.id)
      .limit(5);
    if (tc?.length) {
      usersWithContent.push({
        ...u,
        tracked_content: tc,
      });
    }
  }
  const withScores = [];
  for (const u of usersWithContent) {
    const proximity = await getNicheProximityScore(sourceUser.niche, u.niche);
    withScores.push({
      ...u,
      proximity,
    });
  }
  const sortedUsers = withScores
    .filter((u) => u.proximity > 0) // skip totally unrelated
    .sort((a, b) => b.proximity - a.proximity)
    .slice(0, 50);
  console.log(`🎯 Found ${sortedUsers.length} potential targets`);
  const opportunities = [];
  for (const target of sortedUsers) {
    if (!target.tracked_content?.length) continue;
    // Partner relationship check removed - table doesn't exist in current schema
    // All users are considered potential partners for now
    // For each piece of target content, calculate match scores
    for (const targetContent of target.tracked_content) {
      try {
        const scores = {
          keywordOverlap: 0,
          nicheProximity: 0,
          domainAuthority: 0,
          geographicRelevance: 0,
          partnerQuality: 0,
          overall: 0,
        };
        // 1. Keyword overlap score (30% weight)
        scores.keywordOverlap = phraseOverlap(
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
        scores.overall =
          scores.keywordOverlap * 0.3 +
          scores.nicheProximity * 0.25 +
          scores.domainAuthority * 0.2 +
          scores.geographicRelevance * 0.15 +
          scores.partnerQuality * 0.1;
        // Only create opportunities above minimum threshold (temporarily lowered for debugging)
        if (scores.overall >= 0.1) {
          const anchorSuggestions = generateAnchorTextSuggestions(
            targetContent.keywords || [],
            sourceContent.url || sourceUser.website // error found - need to change sourceContent.users.website -> .url
          );
          opportunities.push({
            source_content_id: contentId,
            target_content_id: targetContent.id,
            target_user_id: target.id,
            source_user_id: userId,
            keyword_overlap_score: scores.keywordOverlap,
            niche_proximity_score: scores.nicheProximity,
            domain_authority_score: scores.domainAuthority,
            geographic_relevance_score: scores.geographicRelevance,
            partner_quality_score: scores.partnerQuality,
            overall_match_score: scores.overall,
            suggested_anchor_text: anchorSuggestions[0] ?? "Read more",
            suggested_target_url: sourceUser.website,
            suggested_placement_context: `Natural placement opportunity in content about "${targetContent.title}"`,
            estimated_value: Math.ceil(scores.overall * 3),
            auto_approved: scores.overall >= 0.7,
            status: scores.overall >= 0.7 ? "approved" : "pending",
            target_content_title: targetContent.title,
            target_content_url: targetContent.url,
          });
        }
      } catch (error) {
        console.error(
          `Error calculating scores for target ${target.id}:`,
          error
        );
      }
    }
  }
  // Sort by overall match score
  opportunities.sort((a, b) => b.overall_match_score - a.overall_match_score);
  console.log(`✅ Generated ${opportunities.length} opportunities`);
  return opportunities.slice(0, 20); // Return top 20 opportunities
}
/**
 * Triggers automatic placement for a given opportunity
 * @param opportunityId - The ID of the placement opportunity
 * @param userId - Optional user ID for ownership validation
 * @param manualOverride - Optional flag to bypass auto-approval checks
 */ async function triggerAutomaticPlacement(
  opportunityId,
  userId,
  manualOverride
) {
  try {
    console.log(
      `🤖 Starting automatic placement for opportunity ${opportunityId}`
    );
    // Call the automatic-placement function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/automatic-placement`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          opportunityId: opportunityId,
          userId: userId,
          manualOverride: manualOverride || false,
        }),
      }
    );
    const result = await response.json();
    if (result.success) {
      console.log(
        `✅ Automatic placement successful: ${result.message || "Link placed"}`
      );
      console.log(`📍 Placement URL: ${result.placementUrl || "N/A"}`);
      console.log(`⚡ Method: ${result.placementMethod || "unknown"}`);
      if (result.verificationSuccess) {
        console.log(`✅ Link verification: PASSED`);
      } else {
        console.log(`⚠️ Link verification: FAILED or not attempted`);
      }
    } else {
      console.error(
        `❌ Automatic placement failed: ${result.error || "Unknown error"}`
      );
    }
    return result;
  } catch (error) {
    console.error(`❌ Failed to trigger automatic placement:`, error);
    throw error;
  }
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
  try {
    const { contentId, userId, forceReprocess } = await req.json();
    if (!contentId || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing contentId or userId",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Check if opportunities already exist (unless forcing reprocess)
    if (!forceReprocess) {
      const { data: existing, error: existingError } = await supabase
        .from("placement_opportunities")
        .select("id")
        .eq("source_content_id", contentId)
        .eq("status", "pending");
      // Check for query error
      if (existingError) {
        console.error("Error checking existing opportunities:", existingError);
        return new Response(
          JSON.stringify({
            error: "Failed to check existing opportunities",
            details: existingError.message,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      if (existing?.length) {
        return new Response(
          JSON.stringify({
            message: "Opportunities already exist",
            existing_opportunities: existing.length,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }
    // Find and create matching opportunities
    const opportunities = await findMatchingOpportunities(contentId, userId);
    if (opportunities.length > 0) {
      // ✅ Use upsert for idempotent insert/update
      const { data: upsertedOpportunities, error: upsertError } = await supabase
        .from("placement_opportunities")
        .upsert(opportunities, {
          onConflict: "source_content_id,target_content_id",
          ignoreDuplicates: false,
        })
        .select("*");
      if (upsertError) {
        console.error("❌ Failed to upsert opportunities:", upsertError);
        throw new Error(upsertError.message);
      }
      console.log(
        `✅ Upserted ${upsertedOpportunities?.length || 0} unique opportunities`
      );
      // create instruction (backlink)
      // Trigger automatic placement for auto-approved opportunities
      if (upsertedOpportunities && upsertedOpportunities.length > 0) {
        for (const opportunity of upsertedOpportunities) {
          // if (opportunity.auto_approved) {
          try {
            // await triggerAutomaticPlacement(opportunity.id, userId, false);
            console.log("Opportunity", opportunity);
          } catch (error) {
            console.error(
              `⚠️ Failed to trigger automatic placement for opportunity ${opportunity.id}:`,
              error
            );
            // Continue with other opportunities even if one fails
          }
          // }
        }
      }
      // Count auto-approved opportunities
      const autoApproved =
        upsertedOpportunities?.filter((op) => op.auto_approved).length || 0;
      return new Response(
        JSON.stringify({
          success: true,
          opportunities_created: opportunities.length,
          auto_approved: autoApproved,
          average_score:
            opportunities.reduce((sum, op) => sum + op.overall_match_score, 0) /
            opportunities.length,
          top_opportunity: opportunities[0]
            ? {
                target_user_id: opportunities[0].target_user_id,
                score: opportunities[0].overall_match_score,
                suggested_anchor_text: opportunities[0].suggested_anchor_text,
              }
            : null,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          opportunities_created: 0,
          message: "No suitable opportunities found above quality threshold",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Ecosystem matching error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
