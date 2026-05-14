-- =============================================================================
-- Preflight script: unique-constraint hardening (second hardening pass)
-- =============================================================================
-- Run this BEFORE applying the Prisma migration that adds the three new
-- unique constraints below. It detects duplicate rows that would cause the
-- migration to fail with a unique-violation error.
--
-- HOW TO USE:
--   1. Run each detection query in a read-only connection or staging copy.
--   2. If any query returns rows, follow the manual deduplication notes below
--      for that table before running `prisma migrate deploy`.
--   3. Do NOT run the DELETE / deduplication statements automatically —
--      they are provided as commented-out patterns for human review.
--
-- CONSTRAINTS BEING ADDED:
--   1. simulation_months  : UNIQUE (startup_id, month_number)
--   2. usage_ledger       : UNIQUE (user_id, action_type, period_start, period_end)
--   3. leaderboard_entries: UNIQUE (startup_id, category, season)
--
-- TABLE NAMES:
--   These are the Prisma @@map values and match the actual PostgreSQL table names.
--   PostgreSQL lowercases unquoted identifiers, so these names are correct as-is.
--   Verified against prisma/schema.prisma:
--     SimulationMonth  @@map("simulation_months")
--     UsageLedger      @@map("usage_ledger")
--     LeaderboardEntry @@map("leaderboard_entries")
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. simulation_months — duplicate (startup_id, month_number)
-- ---------------------------------------------------------------------------
-- The application uses an upsert pattern but earlier code could have
-- inserted duplicate months. Identify any before adding the constraint.

SELECT
    startup_id,
    month_number,
    COUNT(*)  AS duplicate_count,
    array_agg(id ORDER BY created_at DESC) AS ids  -- first id is the newest
FROM simulation_months
GROUP BY startup_id, month_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Expected result: 0 rows.
-- If duplicates exist, keep the NEWEST row per (startup_id, month_number):
--
-- DELETE FROM simulation_months
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id,
--            ROW_NUMBER() OVER (
--              PARTITION BY startup_id, month_number
--              ORDER BY created_at DESC   -- keep newest
--            ) AS rn
--     FROM simulation_months
--   ) ranked
--   WHERE rn > 1
-- );


-- ---------------------------------------------------------------------------
-- 2. usage_ledger — duplicate (user_id, action_type, period_start, period_end)
-- ---------------------------------------------------------------------------
-- Prisma table name: usage_ledger (@@map("usage_ledger"))

SELECT
    user_id,
    action_type,
    period_start,
    period_end,
    COUNT(*)  AS duplicate_count,
    array_agg(id ORDER BY created_at DESC) AS ids
FROM usage_ledger
GROUP BY user_id, action_type, period_start, period_end
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Expected result: 0 rows.
-- If duplicates exist, consolidate counts into the newest row then delete extras:
--
-- WITH ranked AS (
--   SELECT id,
--          user_id, action_type, period_start, period_end,
--          SUM(count) OVER (
--            PARTITION BY user_id, action_type, period_start, period_end
--          ) AS total_count,
--          ROW_NUMBER() OVER (
--            PARTITION BY user_id, action_type, period_start, period_end
--            ORDER BY created_at DESC
--          ) AS rn
--   FROM usage_ledger
-- )
-- UPDATE usage_ledger u
-- SET    count = r.total_count
-- FROM   ranked r
-- WHERE  u.id = r.id AND r.rn = 1;
--
-- DELETE FROM usage_ledger
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id,
--            ROW_NUMBER() OVER (
--              PARTITION BY user_id, action_type, period_start, period_end
--              ORDER BY created_at DESC
--            ) AS rn
--     FROM usage_ledger
--   ) ranked
--   WHERE rn > 1
-- );


-- ---------------------------------------------------------------------------
-- 3. leaderboard_entries — duplicate (startup_id, category, season)
-- ---------------------------------------------------------------------------
-- Prisma table name: leaderboard_entries (@@map("leaderboard_entries"))

SELECT
    startup_id,
    category,
    season,
    COUNT(*)  AS duplicate_count,
    array_agg(id ORDER BY completed_at DESC NULLS LAST) AS ids
FROM leaderboard_entries
GROUP BY startup_id, category, season
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Expected result: 0 rows.
-- If duplicates exist, keep the row with the HIGHEST score:
--
-- DELETE FROM leaderboard_entries
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id,
--            ROW_NUMBER() OVER (
--              PARTITION BY startup_id, category, season
--              ORDER BY score DESC, completed_at DESC NULLS LAST
--            ) AS rn
--     FROM leaderboard_entries
--   ) ranked
--   WHERE rn > 1
-- );


-- ---------------------------------------------------------------------------
-- Summary health check
-- ---------------------------------------------------------------------------
-- Run this to get a quick "all clear" or "action required" status.

SELECT
  'simulation_months'  AS table_name,
  COUNT(*)             AS duplicate_groups
FROM (
  SELECT startup_id, month_number
  FROM simulation_months
  GROUP BY startup_id, month_number
  HAVING COUNT(*) > 1
) t

UNION ALL

SELECT
  'usage_ledger'       AS table_name,
  COUNT(*)             AS duplicate_groups
FROM (
  SELECT user_id, action_type, period_start, period_end
  FROM usage_ledger
  GROUP BY user_id, action_type, period_start, period_end
  HAVING COUNT(*) > 1
) t

UNION ALL

SELECT
  'leaderboard_entries' AS table_name,
  COUNT(*)              AS duplicate_groups
FROM (
  SELECT startup_id, category, season
  FROM leaderboard_entries
  GROUP BY startup_id, category, season
  HAVING COUNT(*) > 1
) t;

-- All three rows should show duplicate_groups = 0.
-- If any row > 0, resolve that table before migrating.
