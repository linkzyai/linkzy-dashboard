import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PlacementRequest {
  opportunityId: string;
  userId?: string;
  manualOverride?: boolean;
}

interface WordPressCredentials {
  apiUrl: string;
  username: string;
  appPassword: string;
}

interface PlacementResult {
  success: boolean;
  placementUrl?: string;
  errorMessage?: string;
  responseTime?: number;
  verificationSuccess?: boolean;
  placementMethod?:
    | "wordpress_api"
    | "javascript_injection"
    | "manual_fallback";
}

interface PlatformDetection {
  isWordPress: boolean;
  hasRestAPI: boolean;
  platform: string;
  jsInjectionPossible: boolean;
}

interface PlacementInstructionData {
  type: string;
  targetUrl: string;
  anchorText: string;
  opportunityId: string;
  placementContext: string;
  keywords: string[];
  injectionMethod: string;
  paragraph?: string;
  rel?: string;
}

function generateContextualParagraph(
  anchorText: string,
  targetUrl: string,
  niche: string | undefined,
  keywords: string[] = [],
  rel: string = "noopener"
): string {
  const kw = (keywords[0] || niche || "resources").toString();
  const sentences = [
    `If you're exploring ${kw}, you might find ${anchorText} helpful for practical tips and real examples.`,
    `For readers focused on ${kw}, check out ${anchorText} for an in‑depth look and actionable guidance.`,
    `Looking to improve your ${kw}? ${anchorText} breaks it down with a simple walkthrough.`,
  ];
  const pick = sentences[Math.floor(Math.random() * sentences.length)];
  return pick.replace(
    anchorText,
    `<a href="${targetUrl}" rel="${rel}" target="_blank">${anchorText}</a>`
  );
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Platform detection function
async function detectPlatform(websiteUrl: string): Promise<PlatformDetection> {
  try {
    const domain = new URL(websiteUrl).origin;

    // Check for WordPress REST API
    const wpApiResponse = await fetch(`${domain}/wp-json/wp/v2/`, {
      method: "HEAD",
      headers: { "User-Agent": "Linkzy-Bot/1.0" },
    });

    if (wpApiResponse.ok) {
      return {
        isWordPress: true,
        hasRestAPI: true,
        platform: "wordpress",
        jsInjectionPossible: true,
      };
    }

    // Check for other platform indicators
    const pageResponse = await fetch(domain, {
      headers: { "User-Agent": "Linkzy-Bot/1.0" },
    });

    if (pageResponse.ok) {
      const html = await pageResponse.text();

      // Platform detection patterns
      const platforms = {
        shopify: /shopify/i,
        wix: /wix\.com|_wix_/i,
        squarespace: /squarespace/i,
        webflow: /webflow/i,
        wordpress: /wp-content|wordpress/i,
      };

      for (const [platform, pattern] of Object.entries(platforms)) {
        if (pattern.test(html)) {
          return {
            isWordPress: platform === "wordpress",
            hasRestAPI: false,
            platform,
            jsInjectionPossible: true,
          };
        }
      }
    }

    // Default: assume JavaScript injection is possible
    return {
      isWordPress: false,
      hasRestAPI: false,
      platform: "unknown",
      jsInjectionPossible: true,
    };
  } catch (error) {
    console.error("Platform detection failed:", error);
    console.log(
      "🔧 Defaulting to JavaScript injection method due to fetch failure"
    );
    return {
      isWordPress: false,
      hasRestAPI: false,
      platform: "unknown",
      jsInjectionPossible: true, // Default to true - assume JS injection is possible unless proven otherwise
    };
  }
}

// JavaScript injection placement for non-WordPress sites
async function attemptJavaScriptPlacement(
  opportunity: any,
  targetDomainMetrics: any
): Promise<PlacementResult> {
  const startTime = Date.now();

  try {
    console.log(
      `🔧 Attempting JavaScript injection placement for ${targetDomainMetrics.website}`
    );

    const niche =
      opportunity?.target_user?.niche ||
      opportunity?.source_user?.niche ||
      undefined;
    // Default to dofollow (no 'nofollow'); switch to nofollow for low-quality/experimental cases later if needed
    const rel = "noopener";
    const paragraph = generateContextualParagraph(
      opportunity.suggested_anchor_text || "this guide",
      opportunity.suggested_target_url,
      niche,
      opportunity.source_content?.keywords || [],
      rel
    );

    // Create the placement instruction that will be sent to the tracking script
    const placementInstruction: PlacementInstructionData = {
      type: "backlink_placement",
      targetUrl: opportunity.suggested_target_url,
      anchorText: opportunity.suggested_anchor_text,
      opportunityId: opportunity.id,
      placementContext: opportunity.suggested_placement_context,
      keywords: opportunity.source_content?.keywords || [],
      injectionMethod: "dom_manipulation",
      paragraph,
      rel,
    };

    // Store the placement instruction in the database for the tracking script to pick up
    const { error: instructionError } = await supabase
      .from("placement_instructions")
      .insert({
        opportunity_id: opportunity.id,
        target_user_id: opportunity.target_user_id,
        instruction_data: placementInstruction,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (instructionError) {
      throw new Error(
        `Failed to create placement instruction: ${instructionError.message}`
      );
    }

    console.log(
      `✅ JavaScript placement instruction created for opportunity ${opportunity.id}`
    );

    return {
      success: true,
      placementUrl: targetDomainMetrics.website,
      placementMethod: "javascript_injection",
      responseTime: Date.now() - startTime,
      verificationSuccess: false, // Will be verified when tracking script executes
    };
  } catch (error) {
    console.error("JavaScript placement failed:", error);
    return {
      success: false,
      errorMessage: (error as any).message,
      placementMethod: "javascript_injection",
      responseTime: Date.now() - startTime,
    };
  }
}

// WordPress API client
async function makeWordPressRequest(
  credentials: WordPressCredentials,
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<Response> {
  const auth = btoa(`${credentials.username}:${credentials.appPassword}`);

  const response = await fetch(`${credentials.apiUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

// Find best insertion point in WordPress post content
function findOptimalInsertionPoint(
  content: string,
  keywords: string[]
): { position: number; context: string } {
  const paragraphs = content.split(/\n\s*\n|\<\/p\>/i);
  let bestParagraph = 0;
  let maxScore = 0;

  paragraphs.forEach((paragraph, index) => {
    if (index === 0 || index === paragraphs.length - 1) return; // Skip intro and conclusion

    const lowerPara = paragraph.toLowerCase();
    let score = 0;

    // Score based on keyword matches
    keywords.forEach((keyword) => {
      if (lowerPara.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });

    // Prefer paragraphs that aren't too short or too long
    const wordCount = paragraph.split(/\s+/).length;
    if (wordCount >= 20 && wordCount <= 100) {
      score += 1;
    }

    // Avoid paragraphs with existing links
    if (paragraph.includes("<a ") || paragraph.includes("href=")) {
      score -= 2;
    }

    if (score > maxScore) {
      maxScore = score;
      bestParagraph = index;
    }
  });

  return {
    position: bestParagraph,
    context: paragraphs[bestParagraph]?.substring(0, 200) + "...",
  };
}

// Generate contextual sentence for link insertion
function generateContextualSentence(
  anchorText: string,
  targetUrl: string,
  keywords: string[]
): string {
  const templates = [
    `For more information about ${
      keywords[0] || "this topic"
    }, check out ${anchorText}.`,
    `If you're looking for professional ${
      keywords[0] || "services"
    }, ${anchorText} offers excellent solutions.`,
    `Learn more about ${
      keywords[0] || "this subject"
    } by visiting ${anchorText}.`,
    `${anchorText} provides comprehensive resources on ${
      keywords[0] || "this topic"
    }.`,
    `For additional insights, see what ${anchorText} has to offer.`,
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(
    anchorText,
    `<a href="${targetUrl}" target="_blank">${anchorText}</a>`
  );
}

// Insert link into WordPress post content
function insertLinkIntoContent(
  originalContent: string,
  insertionPoint: number,
  linkHtml: string
): string {
  const paragraphs = originalContent.split(/\n\s*\n|\<\/p\>/i);

  if (insertionPoint >= paragraphs.length) {
    // Fallback: insert at the end of content
    return originalContent + "\n\n" + linkHtml;
  }

  // Insert the link sentence at the end of the target paragraph
  paragraphs[insertionPoint] =
    paragraphs[insertionPoint].trim() + " " + linkHtml;

  return paragraphs.join("\n\n");
}

// Verify that link was successfully placed
async function verifyLinkPlacement(
  postUrl: string,
  targetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(postUrl, {
      headers: { "User-Agent": "Linkzy-Verification-Bot/1.0" },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const linkPattern = new RegExp(
      `href=["']${targetUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "i"
    );

    return { success: linkPattern.test(html) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main placement logic for WordPress
async function attemptWordPressPlacement(
  opportunity: any,
  targetDomainMetrics: any
): Promise<PlacementResult> {
  const startTime = Date.now();

  try {
    const credentials: WordPressCredentials = {
      apiUrl: targetDomainMetrics.wordpress_api_url,
      username: targetDomainMetrics.wordpress_username,
      appPassword: targetDomainMetrics.wordpress_app_password,
    };

    // Find suitable posts to place the link
    const postsResponse = await makeWordPressRequest(
      credentials,
      "/wp/v2/posts?status=publish&per_page=10&orderby=date&order=desc"
    );

    if (!postsResponse.ok) {
      throw new Error(
        `WordPress API error: ${postsResponse.status} ${postsResponse.statusText}`
      );
    }

    const posts = await postsResponse.json();

    if (!posts.length) {
      throw new Error("No published posts found for placement");
    }

    // Find best post based on keyword relevance
    const sourceKeywords = opportunity.tracked_content?.keywords || [];
    let bestPost = null;
    let maxRelevance = 0;

    for (const post of posts) {
      const postContent = (post.content?.rendered || "").toLowerCase();
      let relevance = 0;

      sourceKeywords.forEach((keyword) => {
        if (postContent.includes(keyword.toLowerCase())) {
          relevance += 1;
        }
      });

      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        bestPost = post;
      }
    }

    // If no keyword matches, use the most recent post
    if (!bestPost) {
      bestPost = posts[0];
    }

    // Find optimal insertion point
    const insertionInfo = findOptimalInsertionPoint(
      bestPost.content.rendered,
      sourceKeywords
    );

    // Generate contextual link sentence
    const linkSentence = generateContextualSentence(
      opportunity.suggested_anchor_text,
      opportunity.suggested_target_url,
      sourceKeywords
    );

    // Insert link into content
    const updatedContent = insertLinkIntoContent(
      bestPost.content.raw || bestPost.content.rendered,
      insertionInfo.position,
      linkSentence
    );

    // Update the WordPress post
    const updateResponse = await makeWordPressRequest(
      credentials,
      `/wp/v2/posts/${bestPost.id}`,
      "POST",
      { content: updatedContent }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      throw new Error(
        `Failed to update post: ${updateResponse.status} - ${errorData}`
      );
    }

    const updatedPost = await updateResponse.json();
    const postUrl = updatedPost.link;
    const responseTime = Date.now() - startTime;

    // Verify placement (with a brief delay for caching)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const verification = await verifyLinkPlacement(
      postUrl,
      opportunity.suggested_target_url
    );

    return {
      success: true,
      placementUrl: postUrl,
      responseTime,
      verificationSuccess: verification.success,
    };
  } catch (error) {
    return {
      success: false,
      errorMessage: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Credit management functions
async function holdCredits(userId: string, amount: number): Promise<boolean> {
  const { data: user } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!user || user.credits < amount) {
    return false;
  }

  // Create hold transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    transaction_type: "hold",
    amount: -amount,
    balance_before: user.credits,
    balance_after: user.credits - amount,
    description: "Credits held for placement attempt",
  });

  // Update user balance
  await supabase
    .from("users")
    .update({ credits: user.credits - amount })
    .eq("id", userId);

  return true;
}

async function processSuccessfulPlacement(
  opportunityId: string,
  placementResult: PlacementResult
) {
  // Update opportunity status
  await supabase
    .from("placement_opportunities")
    .update({
      status: "placed",
      placement_attempted_at: new Date().toISOString(),
      placement_method: placementResult.placementMethod || "unknown",
      placement_success: true,
      placement_url: placementResult.placementUrl,
    })
    .eq("id", opportunityId);

  // Log successful attempt
  await supabase.from("placement_attempts").insert({
    opportunity_id: opportunityId,
    target_domain: new URL(placementResult.placementUrl!).hostname,
    placement_method: placementResult.placementMethod || "unknown",
    success: true,
    response_time_ms: placementResult.responseTime,
    verification_attempted: true,
    verification_success: placementResult.verificationSuccess,
    link_still_live: placementResult.verificationSuccess,
    attempted_at: new Date().toISOString(),
  });
}

async function processFailedPlacement(
  opportunityId: string,
  error: string,
  responseTime?: number
) {
  // Update opportunity status
  await supabase
    .from("placement_opportunities")
    .update({
      status: "failed",
      placement_attempted_at: new Date().toISOString(),
      placement_method: "wordpress_api",
      placement_success: false,
      placement_error_message: error,
    })
    .eq("id", opportunityId);

  // Log failed attempt
  await supabase.from("placement_attempts").insert({
    opportunity_id: opportunityId,
    placement_method: "wordpress_api",
    success: false,
    response_time_ms: responseTime || 0,
    error_message: error,
    attempted_at: new Date().toISOString(),
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const adminKey = req.headers.get("x-admin-key") || "";
    const requireAdminKey = Deno.env.get("ADMIN_API_KEY") || "";
    const { opportunityId, userId, manualOverride }: PlacementRequest =
      await req.json();

    console.log(`🔍 Placement request:`, {
      opportunityId,
      userId,
      manualOverride,
    });

    if (!opportunityId) {
      return new Response(JSON.stringify({ error: "Missing opportunityId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get opportunity details with related data
    const { data: opportunity, error: oppError } = await supabase
      .from("placement_opportunities")
      .select(
        `
        *,
        tracked_content (id, title, keywords, content, url),
        source_user:users!source_user_id (id, website, credits),
        target_user:users!target_user_id (id, website, credits)
      `
      )
      .eq("id", opportunityId)
      .single();

    console.log(`🔍 Get opportunity details with related data:`, {
      opportunity,
      oppError,
    });

    if (!opportunity || oppError) {
      return new Response(JSON.stringify({ error: "Opportunity not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (manualOverride) {
      if (!requireAdminKey || adminKey !== requireAdminKey) {
        return new Response(
          JSON.stringify({ error: "Admin key required for manualOverride" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      if (!userId || userId !== opportunity.source_user_id) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized: user must own the opportunity",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Note: temporary disabled
    // // Check if opportunity is in valid state for placement
    // if (!opportunity.auto_approved && !manualOverride) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Opportunity must be approved before placement",
    //       status: opportunity.status,
    //     }),
    //     {
    //       status: 400,
    //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    //     }
    //   );
    // }

    // Get target domain metrics
    const { data: targetDomainMetrics } = await supabase
      .from("domain_metrics")
      .select("*")
      .eq("user_id", opportunity.target_user_id)
      .single();

    // Detect target platform to choose placement method
    const targetWebsite =
      opportunity.target_user?.website ||
      targetDomainMetrics?.website ||
      "https://example.com";
    console.log(`🔍 Target website: ${targetWebsite}`);
    console.log(`🔍 Opportunity data:`, JSON.stringify(opportunity, null, 2));

    const platformInfo = await detectPlatform(targetWebsite);
    console.log(
      `🔍 Platform detected: ${platformInfo.platform}, WordPress: ${platformInfo.isWordPress}, JS Injection: ${platformInfo.jsInjectionPossible}`
    );

    // Validate placement method availability
    if (
      platformInfo.isWordPress &&
      platformInfo.hasRestAPI &&
      targetDomainMetrics?.wordpress_api_enabled
    ) {
      console.log("📝 Using WordPress API method");
    } else if (platformInfo.jsInjectionPossible) {
      console.log("🔧 Using JavaScript injection method");
    } else {
      return new Response(
        JSON.stringify({
          error: "No suitable placement method available for target website",
          platform: platformInfo.platform,
          wordpress_available:
            platformInfo.isWordPress &&
            targetDomainMetrics?.wordpress_api_enabled,
          js_injection_possible: platformInfo.jsInjectionPossible,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Hold credits before attempting placement
    const creditsHeld = await holdCredits(
      opportunity.source_user_id,
      opportunity.estimated_value
    );
    if (!creditsHeld) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits for placement",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Attempt automatic placement using detected method
    console.log(
      `🚀 Attempting automatic placement for opportunity ${opportunityId}`
    );
    let placementResult: PlacementResult;

    if (
      platformInfo.isWordPress &&
      platformInfo.hasRestAPI &&
      targetDomainMetrics?.wordpress_api_enabled
    ) {
      // Use WordPress API method
      placementResult = await attemptWordPressPlacement(
        opportunity,
        targetDomainMetrics
      );
    } else {
      // Use JavaScript injection method
      placementResult = await attemptJavaScriptPlacement(
        opportunity,
        targetDomainMetrics || { website: opportunity.target_user.website }
      );
    }

    if (placementResult.success) {
      await processSuccessfulPlacement(opportunityId, placementResult);

      return new Response(
        JSON.stringify({
          success: true,
          placement_url: placementResult.placementUrl,
          placement_method: placementResult.placementMethod,
          platform_detected: platformInfo.platform,
          response_time_ms: placementResult.responseTime,
          verification_success: placementResult.verificationSuccess,
          credits_charged: opportunity.estimated_value,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      await processFailedPlacement(
        opportunityId,
        placementResult.errorMessage!,
        placementResult.responseTime
      );

      // Refund held credits on failure
      const { data: user } = await supabase
        .from("users")
        .select("credits")
        .eq("id", opportunity.source_user_id)
        .single();

      if (user) {
        await supabase.from("credit_transactions").insert({
          user_id: opportunity.source_user_id,
          transaction_type: "credit",
          amount: opportunity.estimated_value,
          balance_before: user.credits,
          balance_after: user.credits + opportunity.estimated_value,
          description: "Credits refunded for failed placement",
          refund_reason: placementResult.errorMessage,
        });

        await supabase
          .from("users")
          .update({ credits: user.credits + opportunity.estimated_value })
          .eq("id", opportunity.source_user_id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: placementResult.errorMessage,
          response_time_ms: placementResult.responseTime,
          credits_refunded: opportunity.estimated_value,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Automatic placement error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: (error as any).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
