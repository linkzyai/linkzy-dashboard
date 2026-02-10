# fetch-moz-domain-metrics

Fetches Domain Authority (and related metrics) from the Moz API for every user's website and saves them to `domain_metrics`.

## Env (Supabase Edge Function secrets)

- **MOZ_TOKEN** – Your Moz API token (used as `x-moz-token` header). Create one in [Moz Links API](https://moz.com/help/links-api).

## Behavior

1. Loads all users with a non-empty `website` (skips `yourdomain.com` and empty values).
2. For each website, calls Moz `data.site.metrics.fetch` (scope: domain).
3. Upserts into `domain_metrics` by `user_id` with:
   - `domain_authority`
   - `domain_rating` (if returned)
   - `spam_score` (if returned)
   - `last_scanned_at`, `updated_at`

If a user has no `domain_metrics` row, one is created with `user_id` and `website`; otherwise the row is updated.

## Invoke

- **POST** or **GET** (no body).
- Use a cron job or Supabase scheduled trigger to run periodically.

Example (after deploy):

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/fetch-moz-domain-metrics" \
  -H "Authorization: Bearer <anon-or-service-role-key>"
```

## Rate limiting

The function waits 500ms between Moz requests to reduce the chance of hitting rate limits. Adjust or remove the delay if your Moz plan allows higher throughput.
