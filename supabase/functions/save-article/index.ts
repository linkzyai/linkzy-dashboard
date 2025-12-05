import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the incoming article data
    const articleData = await req.json();

    console.log("Received article data:", articleData);

    // Validate required fields
    if (!articleData.slug || !articleData.headline) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: slug and headline" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Helper function to generate slug from title
    const generateSlug = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    };

    // Helper function to calculate reading time
    const calculateReadingTime = (text: string): number => {
      const wordsPerMinute = 200;
      const wordCount = text.trim().split(/\s+/).length;
      return Math.ceil(wordCount / wordsPerMinute);
    };

    // 1. Handle Category
    let categoryId = null;
    if (articleData.category) {
      const categorySlug =
        articleData.category.slug || generateSlug(articleData.category.title);

      // Check if category exists
      const { data: existingCategory } = await supabaseClient
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category
        const { data: newCategory, error: categoryError } = await supabaseClient
          .from("categories")
          .insert({
            title: articleData.category.title,
            slug: categorySlug,
          })
          .select("id")
          .single();

        if (categoryError) {
          console.error("Error creating category:", categoryError);
        } else {
          categoryId = newCategory.id;
        }
      }
    }

    // 2. Calculate reading time if not provided
    const readingTime =
      articleData.readingTime ||
      calculateReadingTime(articleData.markdown || articleData.html || "");

    // 3. Prepare article data for database
    const articleDbData = {
      slug: articleData.slug,
      headline: articleData.headline,
      meta_description: articleData.metaDescription || null,
      meta_keywords: articleData.metaKeywords || null,
      category_id: categoryId,
      reading_time: readingTime,
      html: articleData.html || null,
      markdown: articleData.markdown || null,
      outline: articleData.outline || null,
      image: articleData.image || null,
      deleted: articleData.deleted || false,
      published: articleData.published || false,
      published_at: articleData.publishedAt || null,
    };

    // 4. Check if article exists (update) or create new
    const { data: existingArticle } = await supabaseClient
      .from("articles")
      .select("id")
      .eq("slug", articleData.slug)
      .single();

    let articleId: string;
    let isUpdate = false;

    if (existingArticle) {
      // Update existing article
      const { data: updatedArticle, error: updateError } = await supabaseClient
        .from("articles")
        .update(articleDbData)
        .eq("id", existingArticle.id)
        .select("id")
        .single();

      if (updateError) {
        throw updateError;
      }

      articleId = updatedArticle.id;
      isUpdate = true;
      console.log("Updated article:", articleId);
    } else {
      // Create new article
      const { data: newArticle, error: insertError } = await supabaseClient
        .from("articles")
        .insert(articleDbData)
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      articleId = newArticle.id;
      console.log("Created new article:", articleId);
    }

    // 5. Handle Tags
    if (articleData.tags && articleData.tags.length > 0) {
      // First, remove existing tags for this article
      await supabaseClient
        .from("article_tags")
        .delete()
        .eq("article_id", articleId);

      // Process each tag
      const tagIds: string[] = [];
      for (const tag of articleData.tags) {
        const tagSlug = tag.slug || generateSlug(tag.title);

        // Check if tag exists
        const { data: existingTag } = await supabaseClient
          .from("tags")
          .select("id")
          .eq("slug", tagSlug)
          .single();

        let tagId: string;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const { data: newTag, error: tagError } = await supabaseClient
            .from("tags")
            .insert({
              title: tag.title,
              slug: tagSlug,
            })
            .select("id")
            .single();

          if (tagError) {
            console.error("Error creating tag:", tagError);
            continue;
          }
          tagId = newTag.id;
        }

        tagIds.push(tagId);
      }

      // Insert article-tag relationships
      if (tagIds.length > 0) {
        const articleTagsData = tagIds.map((tagId) => ({
          article_id: articleId,
          tag_id: tagId,
        }));

        const { error: articleTagsError } = await supabaseClient
          .from("article_tags")
          .insert(articleTagsData);

        if (articleTagsError) {
          console.error("Error linking tags to article:", articleTagsError);
        }
      }
    }

    // 6. Handle Related Posts
    if (articleData.relatedPosts && articleData.relatedPosts.length > 0) {
      // First, remove existing related posts for this article
      await supabaseClient
        .from("article_related_posts")
        .delete()
        .eq("article_id", articleId);

      // Get related article IDs by slug
      const relatedSlugs = articleData.relatedPosts.map((rp: any) => rp.slug);
      const { data: relatedArticles } = await supabaseClient
        .from("articles")
        .select("id, slug")
        .in("slug", relatedSlugs);

      if (relatedArticles && relatedArticles.length > 0) {
        const relatedPostsData = relatedArticles.map((ra) => ({
          article_id: articleId,
          related_article_id: ra.id,
        }));

        const { error: relatedPostsError } = await supabaseClient
          .from("article_related_posts")
          .insert(relatedPostsData);

        if (relatedPostsError) {
          console.error("Error linking related posts:", relatedPostsError);
        }
      }
    }

    // 7. Fetch and return the complete article with all relationships
    const { data: completeArticle, error: fetchError } = await supabaseClient
      .from("articles")
      .select(
        `
        *,
        categories (id, title, slug),
        article_tags (
          tags (id, title, slug)
        ),
        article_related_posts!article_related_posts_article_id_fkey (
      related_article:articles!article_related_posts_related_article_id_fkey (
        id,
        headline,
        slug
      )
    )
      `
      )
      .eq("id", articleId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Transform to match IArticle interface
    const response = {
      id: completeArticle.id,
      slug: completeArticle.slug,
      headline: completeArticle.headline,
      metaDescription: completeArticle.meta_description,
      metaKeywords: completeArticle.meta_keywords,
      tags: completeArticle.article_tags?.map((at: any) => at.tags) || [],
      category: completeArticle.categories || null,
      readingTime: completeArticle.reading_time,
      html: completeArticle.html,
      markdown: completeArticle.markdown,
      outline: completeArticle.outline,
      deleted: completeArticle.deleted,
      published: completeArticle.published,
      publishedAt: completeArticle.published_at,
      createdAt: completeArticle.created_at,
      updatedAt: completeArticle.updated_at,
      relatedPosts:
        completeArticle.article_related_posts?.map(
          (arp: any) => arp.related_article
        ) || [],
      image: completeArticle.image,
    };

    return new Response(
      JSON.stringify({
        success: true,
        action: isUpdate ? "updated" : "created",
        article: response,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing article:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
