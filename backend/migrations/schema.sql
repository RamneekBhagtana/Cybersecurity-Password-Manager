-- ============================================================
-- Cybersecurity Password Manager - Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. users table (references Supabase Auth, must come first)
CREATE TABLE users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    salt            VARCHAR(255) NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    locked_until    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. vault_entries table
CREATE TABLE vault_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    website_url         VARCHAR(500),
    username            TEXT,
    password            TEXT NOT NULL,
    iv                  VARCHAR(255) NOT NULL,
    auth_tag            VARCHAR(255) NOT NULL,
    notes               TEXT,
    is_favorite         BOOLEAN DEFAULT FALSE,
    last_used           TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. tags table
CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 4. vault_entry_tags join table (depends on vault_entries and tags)
CREATE TABLE vault_entry_tags (
    vault_entry_id  UUID REFERENCES vault_entries(id) ON DELETE CASCADE,
    tag_id          UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (vault_entry_id, tag_id)
);

-- 5. generator_settings table
CREATE TABLE generator_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_name    VARCHAR(100) NOT NULL DEFAULT 'default',
    type            VARCHAR(20) NOT NULL DEFAULT 'password',
    length          INTEGER DEFAULT 16,
    use_uppercase   BOOLEAN DEFAULT TRUE,
    use_lowercase   BOOLEAN DEFAULT TRUE,
    use_numbers     BOOLEAN DEFAULT TRUE,
    use_symbols     BOOLEAN DEFAULT TRUE,
    min_numbers     INTEGER DEFAULT 1,
    min_symbols     INTEGER DEFAULT 1,
    word_count      INTEGER DEFAULT 4,
    separator       VARCHAR(5) DEFAULT '-',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_vault_entries_user_id ON vault_entries(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE generator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_row" ON users
    USING (id = auth.uid());

CREATE POLICY "vault_entries_own_rows" ON vault_entries
    USING (user_id = auth.uid());

CREATE POLICY "tags_own_rows" ON tags
    USING (user_id = auth.uid());

CREATE POLICY "vault_entry_tags_own_rows" ON vault_entry_tags
    USING (
        vault_entry_id IN (
            SELECT id FROM vault_entries WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "generator_settings_own_rows" ON generator_settings
    USING (user_id = auth.uid());

-- ============================================================
-- Trigger: auto-create user profile on Supabase Auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();