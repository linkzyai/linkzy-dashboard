-- Rate limit tracking for track-content Edge Function
-- Fixed window: one row per user per minute

CREATE TABLE IF NOT EXISTS public.track_content_rate_limits (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_track_content_rate_limits_window
  ON public.track_content_rate_limits(window_start);

-- RLS: only service role can read/write (Edge Function uses service role)
ALTER TABLE public.track_content_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.track_content_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Atomic upsert: increment count for user+window, return new count
CREATE OR REPLACE FUNCTION public.track_content_rate_limit_upsert(
  p_user_id UUID,
  p_window_start TIMESTAMPTZ
)
RETURNS TABLE (count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.track_content_rate_limits (user_id, window_start, request_count)
  VALUES (p_user_id, p_window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = track_content_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  -- Clean up old windows (older than 2 minutes) to prevent table bloat
  DELETE FROM public.track_content_rate_limits
  WHERE window_start < now() - interval '2 minutes';

  RETURN QUERY SELECT v_count;
END;
$$;
