import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY"); // set in Project Settings
function htmlEscape(s = "") {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function sanitizeAnchorText(a = "") {
  return a
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 80);
}
async function generateContextualParagraphAI(opts) {
  const {
    anchorText,
    targetUrl,
    niche,
    keywords = [],
    pageTitle = "",
    pageExcerpt = "",
    rel = "noopener",
    maxChars = 240,
  } = opts;
  // hard fallback if key missing
  if (!OPENAI_API_KEY) {
    return generateContextualParagraph(
      anchorText,
      targetUrl,
      niche,
      keywords,
      rel
    );
  }
  // guard inputs
  const safeAnchor = sanitizeAnchorText(anchorText) || "this guide";
  let safeUrl = "";
  try {
    safeUrl = new URL(targetUrl).toString();
  } catch {}
  if (!safeUrl) {
    return generateContextualParagraph(
      safeAnchor,
      targetUrl,
      niche,
      keywords,
      rel
    );
  }
  const sys = `
You write a single, natural sentence (<= ${maxChars} characters) that fits within an article body and introduces a relevant resource.
Rules:
- One sentence only. No lists. No headings. No emojis.
- Include the provided anchor text exactly once, wrapped as: <a href="URL" rel="${rel}" target="_blank">ANCHOR</a>
- No salesy language, no clickbait, no exclamation marks.
- Keep it neutral, informational, context-aware (use niche/keywords if helpful), human-sounding.
- No first-person ("I", "we"). No promises. No superlatives.
- Output plain HTML for the sentence only.
`;
  const user = `
ANCHOR_TEXT: ${safeAnchor}
TARGET_URL: ${safeUrl}
NICHE: ${niche || ""}
KEYWORDS: ${(keywords || []).slice(0, 8).join(", ")}
PAGE_TITLE: ${pageTitle}
PAGE_EXCERPT: ${pageExcerpt}
`;
  let content = "";
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: sys.trim(),
          },
          {
            role: "user",
            content: user.trim(),
          },
        ],
      }),
    });
    const json = await resp.json();
    content = json?.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    // network/model error -> fallback
    return generateContextualParagraph(
      safeAnchor,
      safeUrl,
      niche,
      keywords,
      rel
    );
  }
  // validate + sanitize
  if (!content) {
    return generateContextualParagraph(
      safeAnchor,
      safeUrl,
      niche,
      keywords,
      rel
    );
  }
  // must include exactly one anchor with correct href + text
  const hrefOk = content.includes(`href="${safeUrl}"`);
  const anchorOk = content.includes(`>${safeAnchor}</a>`);
  const oneSentence =
    content.split(/[.!?](?=\s|$)/).filter(Boolean).length === 1;
  const tooLong = content.replace(/\s+/g, " ").length > maxChars;
  const hasExclaim = /!/.test(content);
  if (!hrefOk || !anchorOk || !oneSentence || tooLong || hasExclaim) {
    return generateContextualParagraph(
      safeAnchor,
      safeUrl,
      niche,
      keywords,
      rel
    );
  }
  // minimal HTML hardening: escape any leftover text nodes (anchor already our exact markup)
  // We'll rebuild sentence around the exact anchor snippet:
  // Find anchor tag and wrap with safe text parts
  try {
    const anchorTag = `<a href="${safeUrl}" rel="${rel}" target="_blank">${safeAnchor}</a>`;
    // Split on anchor once
    const parts = content.split(anchorTag);
    if (parts.length === 2) {
      const left = htmlEscape(parts[0]);
      const right = htmlEscape(parts[1]);
      const final = `${left}${anchorTag}${right}`.replace(/\s+/g, " ").trim();
      return final;
    }
  } catch {}
  return generateContextualParagraph(safeAnchor, safeUrl, niche, keywords, rel);
}

function generateContextualParagraph(
  anchorText,
  targetUrl,
  niche,
  keywords = [],
  rel = "noopener"
) {
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
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Platform detection function
async function detectPlatform(websiteUrl) {
  try {
    const domain = new URL(websiteUrl).origin;
    // Check for WordPress REST API
    const wpApiResponse = await fetch(`${domain}/wp-json/wp/v2/`, {
      method: "HEAD",
      headers: {
        "User-Agent": "Linkzy-Bot/1.0",
      },
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
      headers: {
        "User-Agent": "Linkzy-Bot/1.0",
      },
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
      jsInjectionPossible: true,
    };
  }
}
// JavaScript injection placement for non-WordPress sites
async function attemptJavaScriptPlacement(
  opportunity,
  targetDomainMetrics,
  targetUser
) {
  const startTime = Date.now();
  try {
    console.log(
      `🔧 Attempting JavaScript injection placement for ${targetUser?.website}`
    );
    const niche =
      targetUser?.niche || opportunity?.source_user?.niche || undefined;
    // Default to dofollow (no 'nofollow'); switch to nofollow for low-quality/experimental cases later if needed
    const rel = "noopener";
    console.log("Getting paragraph");
    const paragraph = await generateContextualParagraphAI({
      anchorText: opportunity.suggested_anchor_text || "this guide",
      targetUrl: opportunity.suggested_target_url,
      niche,
      keywords: opportunity.source_content?.keywords || [],
      pageTitle: opportunity.target_content_title || "",
      // if you have a short excerpt/body for the target page, pass it:
      // pageExcerpt: someSnippetFromTargetContent || "",
      rel: rel,
      maxChars: 240,
    });
    console.log("Paragraph", paragraph);
    // Create the placement instruction that will be sent to the tracking script
    const placementInstruction = {
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
      .upsert(
        {
          opportunity_id: opportunity.id,
          source_user_id: opportunity.source_user_id,
          target_url: opportunity.suggested_target_url,
          anchor_text: opportunity.suggested_anchor_text,
          placement_text: opportunity.suggested_placement_context,
          title: opportunity.target_content_title,
          target_user_id: opportunity.target_user_id,
          target_content_id: opportunity.target_content_id,
          instruction_data: placementInstruction,
          domain_authority: opportunity.domain_authority_score,
          status: "pending",
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "opportunity_id",
        }
      );
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
      placementUrl: targetUser?.website,
      placementMethod: "javascript_injection",
      responseTime: Date.now() - startTime,
      verificationSuccess: false,
    };
  } catch (error) {
    console.error("JavaScript placement failed:", error);
    return {
      success: false,
      errorMessage: error.message,
      placementMethod: "javascript_injection",
      responseTime: Date.now() - startTime,
    };
  }
}
// WordPress API client
async function makeWordPressRequest(
  credentials,
  endpoint,
  method = "GET",
  body
) {
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
function findOptimalInsertionPoint(content, keywords) {
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
function generateContextualSentence(anchorText, targetUrl, keywords) {
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
function insertLinkIntoContent(originalContent, insertionPoint, linkHtml) {
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
async function verifyLinkPlacement(postUrl, targetUrl) {
  try {
    const response = await fetch(postUrl, {
      headers: {
        "User-Agent": "Linkzy-Verification-Bot/1.0",
      },
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
      };
    }
    const html = await response.text();
    const linkPattern = new RegExp(
      `href=["']${targetUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "i"
    );
    return {
      success: linkPattern.test(html),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
// Main placement logic for WordPress
async function attemptWordPressPlacement(opportunity, targetDomainMetrics) {
  const startTime = Date.now();
  try {
    const credentials = {
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
      {
        content: updatedContent,
      }
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
async function holdCredits(userId, amount) {
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
    .update({
      credits: user.credits - amount,
    })
    .eq("id", userId);
  return true;
}
async function processSuccessfulPlacement(opportunity, placementResult) {
  //update credits
  const { data: user } = await supabase
    .from("users")
    .select("credits")
    .eq("id", opportunity.source_user_id)
    .single();
  if (user) {
    await supabase.from("credit_transactions").insert({
      user_id: opportunity.source_user_id,
      transaction_type: "credit",
      amount: 1,
      balance_before: user.credits,
      balance_after: user.credits - 1,
      description: "Credits removed for successfull placement",
    });
    await supabase
      .from("users")
      .update({
        credits: user.credits - 1,
      })
      .eq("id", opportunity.source_user_id);
  }
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
    .eq("id", opportunity.id);
  // Log successful attempt
  await supabase.from("placement_attempts").insert({
    opportunity_id: opportunity.id,
    target_domain: new URL(placementResult.placementUrl).hostname,
    placement_method: placementResult.placementMethod || "unknown",
    success: true,
    response_time_ms: placementResult.responseTime,
    verification_attempted: true,
    verification_success: placementResult.verificationSuccess,
    link_still_live: placementResult.verificationSuccess,
    attempted_at: new Date().toISOString(),
  });
  await supabase
    .from("placement_instructions")
    .update({
      status: "completed",
    })
    .eq("opportunity_id", opportunity.id);
}
async function processFailedPlacement(opportunityId, error, responseTime) {
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
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  console.log("Scheduler hit:", req.method, Object.fromEntries(req.headers));
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
    const adminKey = req.headers.get("x-admin-key") || "";
    const requireAdminKey = Deno.env.get("ADMIN_API_KEY") || "";
    const { data: users, error: usersError } = await supabase.from("users")
      .select(`
        *
      `);
    if (usersError) {
      console.error("error:", usersError);
      return new Response(
        JSON.stringify({
          error: `Users not found: ${usersError}`,
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const results = [];
    for (const u of users) {
      if (u.plan != "starter") {
        console.log("not starter plan");
        continue;
      }
      console.log("starting placement for user:", u.email);
      if (u.credits < 1) {
        console.log("not enough credit, continue", u.email);
        continue;
      }
      const { data: opportunities, error: oppError } = await supabase
        .from("placement_opportunities")
        .select(
          `
        *,
        source_user:users!source_user_id (id, website, credits),
        target_user:users!target_user_id (id, website, credits)
      `
        )
        .eq("source_user_id", u.id)
        .order("overall_match_score", {
          ascending: false,
        });
      if (!opportunities || oppError) {
        console.log("Opportunity not found for user: ", u.email);
        console.error(oppError);
        continue;
      }
      for (const opportunity of opportunities) {
        console.log("starting placement for opportunity:", opportunity.id);
        if (opportunity.status === "placed") {
          continue;
        }
        console.log("status", opportunity.status);
        const { data: placements, error: placementsError } = await supabase
          .from("placement_instructions")
          .select("*")
          .eq("target_content_id", opportunity.target_content_id);
        console.log("length", placements?.length);
        if ((placements?.length ?? 0) > 2) continue;
        console.log("continue");
        const { data: targetDomainMetrics } = await supabase
          .from("domain_metrics")
          .select("*")
          .eq("user_id", opportunity.target_user_id)
          .single();
        // Detect target platform to choose placement method
        const { data: targetUser, error: targetUserError } = await supabase
          .from("users")
          .select("*")
          .eq("id", opportunity.target_user_id)
          .single();
        const targetWebsite =
          targetUser.website ||
          targetDomainMetrics?.website ||
          "https://example.com";
        console.log(`🔍 Target website: ${targetWebsite}`);
        console.log(
          `🔍 Opportunity data:`,
          JSON.stringify(opportunity, null, 2)
        );
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
          console.log(
            "No suitable placement method available for target website"
          );
          continue;
        }
        // Hold credits before attempting placement
        // const creditsHeld = await holdCredits(opportunity.source_user_id, opportunity.estimated_value);
        // if (!creditsHeld) {
        //   return new Response(JSON.stringify({
        //     error: "Insufficient credits for placement"
        //   }), {
        //     status: 400,
        //     headers: {
        //       ...corsHeaders,
        //       "Content-Type": "application/json"
        //     }
        //   });
        // }
        // Attempt automatic placement using detected method
        console.log(
          `🚀 Attempting automatic placement for opportunity ${opportunity.id}`
        );
        let placementResult;
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
            targetDomainMetrics,
            targetUser
          );
        }
        if (placementResult.success) {
          await processSuccessfulPlacement(opportunity, placementResult);
          results.push({
            opportunityId: opportunity.id,
            success: true,
            placementUrl: placementResult.placementUrl,
          });
          break;
        } else {
          await processFailedPlacement(
            opportunity.id,
            placementResult.errorMessage,
            placementResult.responseTime
          );
          results.push({
            opportunityId: opportunity.id,
            success: false,
            error: placementResult.errorMessage,
          });
          // Refund held credits on failure
          // const { data: user } = await supabase.from("users").select("credits").eq("id", opportunity.source_user_id).single();
          // if (user) {
          //   await supabase.from("credit_transactions").insert({
          //     user_id: opportunity.source_user_id,
          //     transaction_type: "credit",
          //     amount: opportunity.estimated_value,
          //     balance_before: user.credits,
          //     balance_after: user.credits + opportunity.estimated_value,
          //     description: "Credits refunded for failed placement",
          //     refund_reason: placementResult.errorMessage
          //   });
          //   await supabase.from("users").update({
          //     credits: user.credits + opportunity.estimated_value
          //   }).eq("id", opportunity.source_user_id);
          // }
          // return new Response(JSON.stringify({
          //   success: false,
          //   error: placementResult.errorMessage,
          //   response_time_ms: placementResult.responseTime,
          //   credits_refunded: opportunity.estimated_value
          // }), {
          //   status: 500,
          //   headers: {
          //     ...corsHeaders,
          //     "Content-Type": "application/json"
          //   }
          // });
        }
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
    // const { opportunityId, userId, manualOverride } = await req.json();
    // console.log(`🔍 Placement request:`, {
    //   opportunityId,
    //   userId,
    //   manualOverride
    // });
    // if (!opportunityId) {
    //   return new Response(JSON.stringify({
    //     error: "Missing opportunityId"
    //   }), {
    //     status: 400,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // }
    // // Get opportunity details with related data
    // const { data: opportunity, error: oppError } = await supabase.from("placement_opportunities").select(`
    //     *,
    //     tracked_content (id, title, keywords, content, url),
    //     source_user:users!source_user_id (id, website, credits),
    //     target_user:users!target_user_id (id, website, credits)
    //   `).eq("id", opportunityId).single();
    // console.log(`🔍 Get opportunity details with related data:`, {
    //   opportunity,
    //   oppError
    // });
    // if (!opportunity || oppError) {
    //   return new Response(JSON.stringify({
    //     error: "Opportunity not found"
    //   }), {
    //     status: 404,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // }
    // if (manualOverride) {
    //   if (!requireAdminKey || adminKey !== requireAdminKey) {
    //     return new Response(JSON.stringify({
    //       error: "Admin key required for manualOverride"
    //     }), {
    //       status: 401,
    //       headers: {
    //         ...corsHeaders,
    //         "Content-Type": "application/json"
    //       }
    //     });
    //   }
    // } else {
    //   if (!userId || userId !== opportunity.source_user_id) {
    //     return new Response(JSON.stringify({
    //       error: "Unauthorized: user must own the opportunity"
    //     }), {
    //       status: 401,
    //       headers: {
    //         ...corsHeaders,
    //         "Content-Type": "application/json"
    //       }
    //     });
    //   }
    // }
    // // Note: temporary disabled
    // // // Check if opportunity is in valid state for placement
    // // if (!opportunity.auto_approved && !manualOverride) {
    // //   return new Response(
    // //     JSON.stringify({
    // //       error: "Opportunity must be approved before placement",
    // //       status: opportunity.status,
    // //     }),
    // //     {
    // //       status: 400,
    // //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    // //     }
    // //   );
    // // }
    // // Get target domain metrics
    // const { data: targetDomainMetrics } = await supabase.from("domain_metrics").select("*").eq("user_id", opportunity.target_user_id).single();
    // // Detect target platform to choose placement method
    // const targetWebsite = opportunity.target_user?.website || targetDomainMetrics?.website || "https://example.com";
    // console.log(`🔍 Target website: ${targetWebsite}`);
    // console.log(`🔍 Opportunity data:`, JSON.stringify(opportunity, null, 2));
    // const platformInfo = await detectPlatform(targetWebsite);
    // console.log(`🔍 Platform detected: ${platformInfo.platform}, WordPress: ${platformInfo.isWordPress}, JS Injection: ${platformInfo.jsInjectionPossible}`);
    // // Validate placement method availability
    // if (platformInfo.isWordPress && platformInfo.hasRestAPI && targetDomainMetrics?.wordpress_api_enabled) {
    //   console.log("📝 Using WordPress API method");
    // } else if (platformInfo.jsInjectionPossible) {
    //   console.log("🔧 Using JavaScript injection method");
    // } else {
    //   return new Response(JSON.stringify({
    //     error: "No suitable placement method available for target website",
    //     platform: platformInfo.platform,
    //     wordpress_available: platformInfo.isWordPress && targetDomainMetrics?.wordpress_api_enabled,
    //     js_injection_possible: platformInfo.jsInjectionPossible
    //   }), {
    //     status: 400,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // }
    // // Hold credits before attempting placement
    // const creditsHeld = await holdCredits(opportunity.source_user_id, opportunity.estimated_value);
    // if (!creditsHeld) {
    //   return new Response(JSON.stringify({
    //     error: "Insufficient credits for placement"
    //   }), {
    //     status: 400,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // }
    // // Attempt automatic placement using detected method
    // console.log(`🚀 Attempting automatic placement for opportunity ${opportunityId}`);
    // let placementResult;
    // if (platformInfo.isWordPress && platformInfo.hasRestAPI && targetDomainMetrics?.wordpress_api_enabled) {
    //   // Use WordPress API method
    //   placementResult = await attemptWordPressPlacement(opportunity, targetDomainMetrics);
    // } else {
    //   // Use JavaScript injection method
    //   placementResult = await attemptJavaScriptPlacement(opportunity, targetDomainMetrics || {
    //     website: opportunity.target_user.website
    //   });
    // }
    // if (placementResult.success) {
    //   await processSuccessfulPlacement(opportunityId, placementResult);
    //   return new Response(JSON.stringify({
    //     success: true,
    //     placement_url: placementResult.placementUrl,
    //     placement_method: placementResult.placementMethod,
    //     platform_detected: platformInfo.platform,
    //     response_time_ms: placementResult.responseTime,
    //     verification_success: placementResult.verificationSuccess,
    //     credits_charged: opportunity.estimated_value
    //   }), {
    //     status: 200,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // } else {
    //   await processFailedPlacement(opportunityId, placementResult.errorMessage, placementResult.responseTime);
    //   // Refund held credits on failure
    //   const { data: user } = await supabase.from("users").select("credits").eq("id", opportunity.source_user_id).single();
    //   if (user) {
    //     await supabase.from("credit_transactions").insert({
    //       user_id: opportunity.source_user_id,
    //       transaction_type: "credit",
    //       amount: opportunity.estimated_value,
    //       balance_before: user.credits,
    //       balance_after: user.credits + opportunity.estimated_value,
    //       description: "Credits refunded for failed placement",
    //       refund_reason: placementResult.errorMessage
    //     });
    //     await supabase.from("users").update({
    //       credits: user.credits + opportunity.estimated_value
    //     }).eq("id", opportunity.source_user_id);
    //   }
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: placementResult.errorMessage,
    //     response_time_ms: placementResult.responseTime,
    //     credits_refunded: opportunity.estimated_value
    //   }), {
    //     status: 500,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // }
  } catch (error) {
    console.error("Automatic placement error:", error);
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
