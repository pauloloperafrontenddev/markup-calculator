-- ────────────────────────────────────────────────────────────────────────────
-- Markup Calculator — Initial Schema
-- All monetary values in centavos (integers). 150000 = ₱1,500.00
-- Percentages in basis points. 1200 = 12%, 5000 = 50%, 10000 = 100%
-- ────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension


-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE quote_status      AS ENUM ('draft', 'active', 'accepted', 'cancelled');
CREATE TYPE expiry_type       AS ENUM ('none', 'fixed', 'relative');
CREATE TYPE markup_type       AS ENUM ('percentage', 'fixed');
CREATE TYPE discount_type     AS ENUM ('percentage', 'fixed_per_item');
CREATE TYPE commission_type   AS ENUM ('percentage', 'fixed');
CREATE TYPE quota_target_type AS ENUM ('fixed', 'percentage');
CREATE TYPE quota_mode        AS ENUM ('soft', 'hard');
CREATE TYPE user_role         AS ENUM ('super_user', 'staff');

-- ── User Profiles ─────────────────────────────────────────────────────────────

CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT      NOT NULL,
  role         user_role NOT NULL DEFAULT 'staff',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Each user can read their own profile
CREATE POLICY "users_read_own" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Super users can read all profiles
CREATE POLICY "super_users_read_all" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_user'
    )
  );

-- Super users can insert/update/delete all profiles
CREATE POLICY "super_users_manage_all" ON user_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_user'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_user'
    )
  );

-- Auto-create a staff profile on new user sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  INSERT INTO user_profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    -- First user ever becomes super_user
    CASE WHEN user_count = 0 THEN 'super_user'::user_role ELSE 'staff'::user_role END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ── Customers ─────────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Price Sets ────────────────────────────────────────────────────────────────

CREATE TABLE price_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  description TEXT,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON price_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed a default price set
INSERT INTO price_sets (name, is_default) VALUES ('Retail', TRUE);

-- ── Items ─────────────────────────────────────────────────────────────────────

CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           TEXT,
  name          TEXT    NOT NULL,
  description   TEXT,
  category      TEXT,
  base_cost     INTEGER NOT NULL DEFAULT 0,  -- centavos
  is_active     BOOLEAN DEFAULT TRUE,
  image_url     TEXT,                        -- Supabase Storage URL
  min_order_qty INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Item Pricing (price per item per price set) ───────────────────────────────

CREATE TABLE item_pricing (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                 UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price_set_id            UUID NOT NULL REFERENCES price_sets(id) ON DELETE CASCADE,
  retail_price            INTEGER NOT NULL DEFAULT 0,  -- centavos
  use_global_volume_tiers BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, price_set_id)
);

ALTER TABLE item_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON item_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Item Volume Tiers (custom per-item tiers) ─────────────────────────────────

CREATE TABLE item_volume_tiers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_pricing_id  UUID    NOT NULL REFERENCES item_pricing(id) ON DELETE CASCADE,
  min_qty          INTEGER NOT NULL,
  max_qty          INTEGER,  -- NULL = open-ended
  unit_price       INTEGER NOT NULL,  -- centavos
  CHECK (max_qty IS NULL OR max_qty >= min_qty)
);

ALTER TABLE item_volume_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON item_volume_tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Global Volume Tiers (inherited by items with use_global_volume_tiers=true) ─

CREATE TABLE global_volume_tiers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT    NOT NULL,       -- e.g. "Retail (15–29 pcs)"
  min_qty              INTEGER NOT NULL,
  max_qty              INTEGER,                -- NULL = open-ended
  price_multiplier_bps INTEGER NOT NULL DEFAULT 10000,  -- 10000 = 1.0x (no change)
  sort_order           INTEGER NOT NULL DEFAULT 0,
  CHECK (max_qty IS NULL OR max_qty >= min_qty)
);

ALTER TABLE global_volume_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON global_volume_tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Item Sets (Bundles) ───────────────────────────────────────────────────────

CREATE TABLE item_sets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  description  TEXT,
  markup_type  markup_type NOT NULL DEFAULT 'percentage',
  markup_value INTEGER     NOT NULL DEFAULT 0,  -- basis points if pct; centavos if fixed
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON item_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE set_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id           UUID    NOT NULL REFERENCES item_sets(id) ON DELETE CASCADE,
  item_id          UUID    NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  default_quantity INTEGER NOT NULL DEFAULT 1,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  UNIQUE(set_id, item_id)
);

ALTER TABLE set_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON set_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Quote Number Sequences ────────────────────────────────────────────────────

CREATE TABLE quote_sequences (
  year     INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE quote_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON quote_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  next_seq     INTEGER;
BEGIN
  INSERT INTO quote_sequences (year, last_seq) VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_seq = quote_sequences.last_seq + 1
  RETURNING last_seq INTO next_seq;
  RETURN 'QT-' || current_year || '-' || LPAD(next_seq::TEXT, 5, '0');
END;
$$;

-- ── Quotes ────────────────────────────────────────────────────────────────────

CREATE TABLE quotes (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number           TEXT         UNIQUE NOT NULL DEFAULT generate_quote_number(),
  customer_id            UUID         REFERENCES customers(id) ON DELETE SET NULL,
  customer_name_override TEXT,
  price_set_id           UUID         NOT NULL REFERENCES price_sets(id),
  status                 quote_status NOT NULL DEFAULT 'draft',
  -- Expiry
  expiry_type            expiry_type  NOT NULL DEFAULT 'none',
  expiry_date            DATE,
  expiry_days            INTEGER,
  -- computed_expiry_date is derived in the app layer by effectiveStatus()
  -- (PostgreSQL GENERATED columns require IMMUTABLE expressions; TIMESTAMPTZ::date is STABLE)
  -- Profit quota
  quota_min_type         quota_target_type,
  quota_min_value        INTEGER,   -- centavos (fixed) or basis points (percentage)
  quota_max_type         quota_target_type,
  quota_max_value        INTEGER,
  quota_mode             quota_mode   NOT NULL DEFAULT 'soft',
  -- Commission
  commission_referred_by TEXT,
  commission_type        commission_type,
  commission_value       INTEGER,   -- centavos or basis points
  -- Agent/reseller markup
  agent_markup_type      markup_type,
  agent_markup_value     INTEGER,
  -- Down payment
  down_payment_pct       INTEGER    NOT NULL DEFAULT 5000,  -- basis points; 5000 = 50%
  -- VAT
  vat_enabled            BOOLEAN    NOT NULL DEFAULT FALSE,
  vat_rate_bps           INTEGER,   -- NULL = inherit from global_settings
  -- Notes
  notes                  TEXT,
  -- Attribution
  created_by             UUID       REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Quote Line Items ──────────────────────────────────────────────────────────

CREATE TABLE quote_line_items (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id                  UUID         NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_id                   UUID         REFERENCES items(id) ON DELETE RESTRICT,
  set_id                    UUID         REFERENCES item_sets(id) ON DELETE RESTRICT,
  description_override      TEXT,
  quantity                  INTEGER      NOT NULL DEFAULT 1,
  unit_base_cost            INTEGER      NOT NULL,   -- centavos, snapshotted
  unit_retail_price         INTEGER      NOT NULL,   -- centavos, snapshotted (before discount)
  discount_type             discount_type,
  discount_value            INTEGER,                 -- basis points or centavos
  sort_order                INTEGER      NOT NULL DEFAULT 0,
  -- Duplication tracking
  sourced_from_line_item_id UUID         REFERENCES quote_line_items(id) ON DELETE SET NULL,
  price_variance_bps        INTEGER,     -- delta from current catalogue price; NULL = not duplicated
  CHECK (
    (item_id IS NOT NULL AND set_id IS NULL) OR
    (item_id IS NULL AND set_id IS NOT NULL)
  )
);

ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON quote_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Quote Incidentals (internal costs) ───────────────────────────────────────

CREATE TABLE quote_incidentals (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id   UUID    NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  cost       INTEGER NOT NULL DEFAULT 0,   -- centavos
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE quote_incidentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON quote_incidentals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Quote Payments (down payment tracking) ────────────────────────────────────

CREATE TABLE quote_payments (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     UUID    NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,   -- centavos
  payment_date DATE    NOT NULL,
  method       TEXT,               -- e.g. "GCash", "Cash", "Bank Transfer"
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON quote_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Rush Order Surcharge (customer-visible) ───────────────────────────────────

CREATE TABLE quote_rush_orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id         UUID        NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  label            TEXT        NOT NULL DEFAULT 'Rush Order Surcharge',
  surcharge_type   markup_type NOT NULL DEFAULT 'fixed',
  surcharge_value  INTEGER     NOT NULL DEFAULT 0   -- basis points or centavos
);

ALTER TABLE quote_rush_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON quote_rush_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Quota Override Log ────────────────────────────────────────────────────────

CREATE TABLE quota_override_log (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id                UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  reason                  TEXT NOT NULL,
  overridden_by           TEXT,
  quota_status_at_override TEXT NOT NULL,
  net_profit_at_override  INTEGER NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quota_override_log ENABLE ROW LEVEL SECURITY;

-- Only super_users can read the override log
CREATE POLICY "super_users_read" ON quota_override_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_user'
    )
  );

CREATE POLICY "auth_insert" ON quota_override_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── Global Settings (singleton row, id always = 1) ────────────────────────────

CREATE TABLE global_settings (
  id                     INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_quota_min_type quota_target_type,
  default_quota_min_value INTEGER,
  default_quota_max_type quota_target_type,
  default_quota_max_value INTEGER,
  default_quota_mode     quota_mode  NOT NULL DEFAULT 'soft',
  default_expiry_type    expiry_type NOT NULL DEFAULT 'none',
  default_expiry_days    INTEGER,
  default_price_set_id   UUID        REFERENCES price_sets(id) ON DELETE SET NULL,
  default_down_payment_pct INTEGER   NOT NULL DEFAULT 5000,   -- 50%
  business_name          TEXT        NOT NULL DEFAULT 'My Business',
  business_logo_url      TEXT,
  vat_enabled            BOOLEAN     NOT NULL DEFAULT FALSE,
  vat_rate_bps           INTEGER     NOT NULL DEFAULT 1200    -- 12%
);

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read global settings
CREATE POLICY "auth_read" ON global_settings
  FOR SELECT TO authenticated USING (true);

-- Only super_users can modify global settings
CREATE POLICY "super_users_write" ON global_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_user'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_user'
    )
  );

-- Ensure singleton row exists
INSERT INTO global_settings DEFAULT VALUES;

-- ── Updated-at trigger helper ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON items        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON price_sets   FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON item_pricing FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON item_sets    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON quotes       FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
