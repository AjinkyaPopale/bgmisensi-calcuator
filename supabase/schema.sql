-- ═══════════════════════════════════════════════════════════
--  BGMI Sensitivity Calculator — Supabase Schema
--  Run this ONCE in your Supabase project → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Unlocks table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.unlocks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text        NOT NULL,
  tier        text        NOT NULL CHECK (tier IN ('pro', 'pmgc')),
  payment_id  text        NOT NULL UNIQUE,   -- razorpay_payment_id (prevents duplicates) payment id must add
  order_id    text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── Indexes for fast lookups ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_unlocks_email     ON public.unlocks (email);
CREATE INDEX IF NOT EXISTS idx_unlocks_payment   ON public.unlocks (payment_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_created   ON public.unlocks (created_at DESC);

-- ── Row Level Security ─────────────────────────────────────
-- Service key (used in functions) bypasses RLS.
-- Anon key cannot read/write unlocks directly.
ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;

-- No public access — only service_role (your Netlify functions) can access
CREATE POLICY "service_only"
  ON public.unlocks
  FOR ALL
  USING (false)   -- deny all by default
  WITH CHECK (false);

-- ── Optional: analytics view ──────────────────────────────
-- See revenue stats in Supabase dashboard
CREATE OR REPLACE VIEW public.revenue_summary AS
  SELECT
    tier,
    COUNT(*)                    AS total_payments,
    COUNT(*) * CASE
      WHEN tier = 'pro'  THEN 99
      WHEN tier = 'pmgc' THEN 199
      ELSE 0
    END                         AS total_revenue_inr,
    MIN(created_at)             AS first_payment,
    MAX(created_at)             AS latest_payment
  FROM public.unlocks
  GROUP BY tier;

-- ── Optional: recent payments view ───────────────────────
CREATE OR REPLACE VIEW public.recent_payments AS
  SELECT
    id,
    email,
    tier,
    payment_id,
    created_at
  FROM public.unlocks
  ORDER BY created_at DESC
  LIMIT 50;
