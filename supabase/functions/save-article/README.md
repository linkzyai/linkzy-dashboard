# Article Webhook Documentation

## Endpoint

`POST /save-article`

## Purpose

Webhook to create or update blog articles with their associated tags, categories, and related posts.

## Request Body

Send a JSON payload matching the `IArticle` interface:

```json
{
  "slug": "my-article-slug",
  "headline": "My Article Title",
  "metaDescription": "Article description for SEO",
  "metaKeywords": "keyword1, keyword2, keyword3",
  "category": {
    "title": "Technology",
    "slug": "technology"
  },
  "tags": [
    {
      "title": "JavaScript",
      "slug": "javascript"
    },
    {
      "title": "Web Development",
      "slug": "web-development"
    }
  ],
  "html": "<h1>Article Content</h1><p>This is the HTML content...</p>",
  "markdown": "# Article Content\n\nThis is the markdown content...",
  "outline": "Introduction\n1. Main Point\n2. Second Point\nConclusion",
  "image": "https://example.com/image.jpg",
  "readingTime": 5,
  "published": true,
  "deleted": false,
  "relatedPosts": [
    {
      "slug": "related-article-1"
    },
    {
      "slug": "related-article-2"
    }
  ]
}
```

## Required Fields

- `slug` (string) - Unique identifier for the article URL
- `headline` (string) - Article title

## Optional Fields

- `metaDescription` (string) - SEO meta description
- `metaKeywords` (string) - SEO keywords
- `category` (object) - Article category
  - `title` (string) - Category name
  - `slug` (string) - Category slug (auto-generated if not provided)
- `tags` (array) - Array of tag objects
  - `title` (string) - Tag name
  - `slug` (string) - Tag slug (auto-generated if not provided)
- `html` (string) - HTML content
- `markdown` (string) - Markdown content
- `outline` (string) - Article outline/structure
- `image` (string) - Featured image URL
- `readingTime` (number) - Reading time in minutes (auto-calculated if not provided)
- `published` (boolean) - Publication status (default: false)
- `deleted` (boolean) - Soft delete flag (default: false)
- `publishedAt` (string) - Publication timestamp (auto-set on first publish)
- `relatedPosts` (array) - Array of related article slugs

## Behavior

### Create New Article

If an article with the given `slug` doesn't exist, a new article is created.

### Update Existing Article

If an article with the given `slug` exists, it is updated with the new data.

### Tag Handling

- Existing tags are reused by matching slug
- New tags are automatically created
- Previous tag associations are removed and replaced with new ones

### Category Handling

- Existing categories are reused by matching slug
- New categories are automatically created

### Related Posts

- Related posts are linked by slug
- Only existing articles can be linked as related posts
- Previous related post associations are removed and replaced with new ones

## Response

### Success (200)

```json
{
  "success": true,
  "action": "created" | "updated",
  "article": {
    "id": "uuid",
    "slug": "my-article-slug",
    "headline": "My Article Title",
    "metaDescription": "...",
    "metaKeywords": "...",
    "tags": [...],
    "category": {...},
    "readingTime": 5,
    "html": "...",
    "markdown": "...",
    "outline": "...",
    "deleted": false,
    "published": true,
    "publishedAt": "2024-12-04T...",
    "createdAt": "2024-12-04T...",
    "updatedAt": "2024-12-04T...",
    "relatedPosts": [...],
    "image": "..."
  }
}
```

### Error (400)

```json
{
  "error": "Missing required fields: slug and headline"
}
```

### Error (500)

```json
{
  "error": "Error message"
}
```

## Example Usage

### cURL

```bash
curl -X POST https://your-project.supabase.co/functions/v1/save-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "slug": "getting-started-with-react",
    "headline": "Getting Started with React",
    "metaDescription": "Learn the basics of React",
    "category": {
      "title": "Tutorials",
      "slug": "tutorials"
    },
    "tags": [
      {"title": "React"},
      {"title": "JavaScript"}
    ],
    "markdown": "# Getting Started\n\nReact is a JavaScript library...",
    "published": true
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch(
  "https://your-project.supabase.co/functions/v1/save-article",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      slug: "getting-started-with-react",
      headline: "Getting Started with React",
      metaDescription: "Learn the basics of React",
      category: {
        title: "Tutorials",
        slug: "tutorials",
      },
      tags: [{ title: "React" }, { title: "JavaScript" }],
      markdown: "# Getting Started\n\nReact is a JavaScript library...",
      published: true,
    }),
  }
);

const result = await response.json();
console.log(result);
```

## Deployment

Deploy the Edge Function:

```bash
npx supabase functions deploy save-article
```

## Notes

- The webhook automatically generates slugs for tags and categories if not provided
- Reading time is auto-calculated from markdown or HTML content if not provided
- The `published_at` timestamp is automatically set when an article is first published
- All timestamps (`created_at`, `updated_at`) are managed automatically
- The webhook uses the service role key for full database access
