-- ================================================================
--  MEMORYVERSE — COMPLETE DATABASE SETUP
--  Single file: schema + migrations + RLS + seed data
--  Run this ENTIRE script in: Supabase Dashboard → SQL Editor → New Query
--  Safe for fresh install OR full reset
-- ================================================================


-- ================================================================
-- STEP 1: DROP EXISTING TABLES (clean slate)
-- ================================================================
DROP TABLE IF EXISTS visitor_logs    CASCADE;
DROP TABLE IF EXISTS final_messages  CASCADE;
DROP TABLE IF EXISTS quotes          CASCADE;
DROP TABLE IF EXISTS videos          CASCADE;
DROP TABLE IF EXISTS photos          CASCADE;
DROP TABLE IF EXISTS members         CASCADE;
DROP TABLE IF EXISTS memory_groups   CASCADE;
DROP TABLE IF EXISTS admins          CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- STEP 2: CREATE TABLES (latest schema with all columns)
-- ================================================================

-- 1. Admins (reference only — actual auth handled by Supabase Auth)
CREATE TABLE IF NOT EXISTS admins (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Memory Groups
CREATE TABLE IF NOT EXISTS memory_groups (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id          VARCHAR(50)  NOT NULL UNIQUE,
    group_name         VARCHAR(255) NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    theme              VARCHAR(100) DEFAULT 'CinematicSpace',
    cover_image        TEXT,
    audio_url          TEXT,          -- legacy, kept for compatibility
    ambient_audio      TEXT,          -- background music URL
    ending_audio       TEXT,          -- ending scene audio URL
    intro_quote        TEXT,          -- opening quote/message
    theme_settings     JSONB    DEFAULT '{}'::jsonb,
    allow_download     BOOLEAN  DEFAULT true,
    allow_share        BOOLEAN  DEFAULT true,
    show_watermark     BOOLEAN  DEFAULT false,
    allow_audio_change BOOLEAN  DEFAULT true,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Members
CREATE TABLE IF NOT EXISTS members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Photos
CREATE TABLE IF NOT EXISTS photos (
    id                 UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           UUID  NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    image_url          TEXT  NOT NULL,
    caption            TEXT,
    display_order      INT   DEFAULT 0,
    -- 3D transform
    position_x         FLOAT DEFAULT 0,
    position_y         FLOAT DEFAULT 0,
    position_z         FLOAT DEFAULT 0,
    rotation_x         FLOAT DEFAULT 0,
    rotation_y         FLOAT DEFAULT 0,
    rotation_z         FLOAT DEFAULT 0,
    scale              FLOAT DEFAULT 1,
    -- Style
    frame_style        VARCHAR(50) DEFAULT 'glass',
    glow_strength      FLOAT       DEFAULT 1,
    animation_type     VARCHAR(50) DEFAULT 'float',
    animation_style    VARCHAR(50),
    -- Metadata
    date               VARCHAR(100),
    location           VARCHAR(255),
    -- Advanced
    layer_index        INT     DEFAULT 0,
    is_visible         BOOLEAN DEFAULT true,
    animation_settings JSONB   DEFAULT '{}'::jsonb,
    audio_settings     JSONB   DEFAULT '{}'::jsonb,
    theme_settings     JSONB   DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Videos
CREATE TABLE IF NOT EXISTS videos (
    id                 UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           UUID  NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    video_url          TEXT  NOT NULL,
    title              TEXT,
    display_order      INT   DEFAULT 0,
    -- 3D transform
    position_x         FLOAT DEFAULT 0,
    position_y         FLOAT DEFAULT 0,
    position_z         FLOAT DEFAULT 0,
    rotation_x         FLOAT DEFAULT 0,
    rotation_y         FLOAT DEFAULT 0,
    rotation_z         FLOAT DEFAULT 0,
    scale              FLOAT DEFAULT 1,
    -- Style
    frame_style        VARCHAR(50) DEFAULT 'glass',
    glow_strength      FLOAT       DEFAULT 1,
    animation_type     VARCHAR(50) DEFAULT 'float',
    -- Advanced
    layer_index        INT     DEFAULT 0,
    is_visible         BOOLEAN DEFAULT true,
    animation_settings JSONB   DEFAULT '{}'::jsonb,
    audio_settings     JSONB   DEFAULT '{}'::jsonb,
    theme_settings     JSONB   DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quotes
CREATE TABLE IF NOT EXISTS quotes (
    id                 UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           UUID  NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    quote              TEXT  NOT NULL,
    author             VARCHAR(255),
    display_order      INT   DEFAULT 0,
    theme_color        VARCHAR(50),
    -- 3D transform
    position_x         FLOAT DEFAULT 0,
    position_y         FLOAT DEFAULT 0,
    position_z         FLOAT DEFAULT 0,
    rotation_x         FLOAT DEFAULT 0,
    rotation_y         FLOAT DEFAULT 0,
    rotation_z         FLOAT DEFAULT 0,
    scale              FLOAT DEFAULT 1,
    -- Style
    frame_style        VARCHAR(50) DEFAULT 'glass',
    glow_strength      FLOAT       DEFAULT 1,
    animation_type     VARCHAR(50) DEFAULT 'float',
    -- Advanced
    layer_index        INT     DEFAULT 0,
    is_visible         BOOLEAN DEFAULT true,
    animation_settings JSONB   DEFAULT '{}'::jsonb,
    audio_settings     JSONB   DEFAULT '{}'::jsonb,
    theme_settings     JSONB   DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Final Messages (one per group)
CREATE TABLE IF NOT EXISTS final_messages (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID         NOT NULL UNIQUE REFERENCES memory_groups(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- 8. Visitor Logs
CREATE TABLE IF NOT EXISTS visitor_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_name TEXT NOT NULL,
    group_id     UUID NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    visited_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================================
-- STEP 3: INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_memory_groups_memory_id  ON memory_groups(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_groups_group_name ON memory_groups(group_name);
CREATE INDEX IF NOT EXISTS idx_photos_group_id          ON photos(group_id);
CREATE INDEX IF NOT EXISTS idx_videos_group_id          ON videos(group_id);
CREATE INDEX IF NOT EXISTS idx_quotes_group_id          ON quotes(group_id);
CREATE INDEX IF NOT EXISTS idx_members_group_id         ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_group_id    ON visitor_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at  ON visitor_logs(visited_at DESC);


-- ================================================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs   ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ — visitors and admin can read all content
CREATE POLICY "public_read_admins"         ON admins         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_memory_groups"  ON memory_groups  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_members"        ON members        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_photos"         ON photos         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_videos"         ON videos         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_quotes"         ON quotes         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_final_messages" ON final_messages FOR SELECT TO anon, authenticated USING (true);

-- AUTHENTICATED WRITE — only Supabase Auth session (admin) can write
-- memory_groups
CREATE POLICY "auth_insert_memory_groups"  ON memory_groups  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_memory_groups"  ON memory_groups  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_memory_groups"  ON memory_groups  FOR DELETE TO authenticated USING (true);
-- members
CREATE POLICY "auth_insert_members"        ON members        FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_members"        ON members        FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_members"        ON members        FOR DELETE TO authenticated USING (true);
-- photos
CREATE POLICY "auth_insert_photos"         ON photos         FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_photos"         ON photos         FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_photos"         ON photos         FOR DELETE TO authenticated USING (true);
-- videos
CREATE POLICY "auth_insert_videos"         ON videos         FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_videos"         ON videos         FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_videos"         ON videos         FOR DELETE TO authenticated USING (true);
-- quotes
CREATE POLICY "auth_insert_quotes"         ON quotes         FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_quotes"         ON quotes         FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_quotes"         ON quotes         FOR DELETE TO authenticated USING (true);
-- final_messages
CREATE POLICY "auth_insert_final_messages" ON final_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_final_messages" ON final_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_final_messages" ON final_messages FOR DELETE TO authenticated USING (true);

-- VISITOR LOGS — anyone can log a visit, only admin can read
CREATE POLICY "anon_insert_visitor_logs"   ON visitor_logs   FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_visitor_logs"   ON visitor_logs   FOR SELECT TO authenticated USING (true);


-- ================================================================
-- STEP 5: STORAGE BUCKET (photo & video uploads)
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read — visitors can view uploaded photos/videos
DROP POLICY IF EXISTS "media_public_read"  ON storage.objects;
CREATE POLICY "media_public_read"  ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'media');

-- Admin write — only authenticated admin can upload/delete
DROP POLICY IF EXISTS "media_auth_insert" ON storage.objects;
CREATE POLICY "media_auth_insert"  ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update"  ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete"  ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'media');


-- ================================================================
-- STEP 6: SEED DATA
-- ================================================================

-- Admin reference record
-- NOTE: Real login uses Supabase Auth → Dashboard → Authentication → Users
--       Add user: vivekpawar932564@gmail.com / MyMemoryVerse@1402
INSERT INTO admins (email, password_hash)
VALUES ('admin@memoryverse.com', 'MANAGED_BY_SUPABASE_AUTH')
ON CONFLICT (email) DO NOTHING;

-- Global "For All" group (public entry-point journey, no password needed)
INSERT INTO memory_groups (id, memory_id, group_name, password_hash, theme, status, theme_settings)
VALUES (
    'b1ffcd00-0000-4000-a000-000000000001',
    'GLOBAL_FOR_ALL',
    'For All (Global)',
    'NO_PASSWORD',
    'CinematicSpace',
    'ACTIVE',
    '{"isDefault": true}'::jsonb
) ON CONFLICT (memory_id) DO NOTHING;

-- Sample quote for Global "For All" group (Display Order 0)
INSERT INTO quotes (group_id, quote, author, display_order, theme_color)
VALUES (
    'b1ffcd00-0000-4000-a000-000000000001',
    'Happy Friendship Day! ❤️ Welcome to our global memory space.',
    'MemoryVerse',
    0,
    '#ffffff'
) ON CONFLICT DO NOTHING;

-- Sample friendship group (Memory ID: MV-8A73PQ / Password: friendship2026)
INSERT INTO memory_groups (id, memory_id, group_name, password_hash, theme, status)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MV-8A73PQ',
    'The Starlight Squad 2026',
    'friendship2026',
    'CinematicSpace',
    'ACTIVE'
) ON CONFLICT (memory_id) DO NOTHING;

-- Welcoming quote for friendship group (Display Order 0)
INSERT INTO quotes (group_id, quote, author, display_order, theme_color)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Happy Friendship Day! ❤️ Cheers to the bond we share.',
    'Starlight Squad',
    0,
    '#fef08a'
) ON CONFLICT DO NOTHING;

-- Sample photos (Display Order 1 and 2)
INSERT INTO photos (group_id, image_url, caption, display_order)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800',
     'Annual Beach Trip Sunset 2026',
     1),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?auto=format&fit=crop&q=80&w=800',
     'Late night rooftop bonfire stories',
     2);

-- Sample final message
INSERT INTO final_messages (group_id, title, message)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'To Our Forever Squad',
    'Thank you for making every moment unforgettable. Here''s to a lifetime of laughter and shared memories!'
) ON CONFLICT (group_id) DO NOTHING;


-- ================================================================
-- STEP 6.5: AUDIO TRACKS CATALOG
-- ================================================================
CREATE TABLE IF NOT EXISTS audio_tracks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(50)  NOT NULL DEFAULT 'ambient' CHECK (category IN ('ambient', 'effect', 'ending')),
    audio_url   TEXT NOT NULL,
    description TEXT,
    is_default  BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed audio catalog presets
INSERT INTO audio_tracks (title, category, audio_url, description, is_default) VALUES
('Acoustic Memories', 'ambient', 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3', 'Warm acoustic guitar with a nostalgic, emotional feel.', true),
('Endless Horizons', 'ambient', 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2441951560.mp3', 'Ambient cinematic piano and strings for deep friendship memories.', true),
('Celestial Dreams', 'ambient', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', 'Atmospheric synth pad for futuristic & space 3D themes.', false),
('Golden Sunset', 'ambient', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73213.mp3', 'Gentle acoustic lo-fi vibes for sunset memories.', false),
('Gentle Chime', 'effect', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', 'Soft glass chime for card hovers and reveals.', true),
('Camera Click', 'effect', 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav', 'Classic shutter click for photo zoom animations.', false),
('Acoustic Ping', 'effect', 'https://assets.mixkit.co/active_storage/sfx/911/911-84.wav', 'Subtle woodblock ping reaction.', false),
('Sparkle Magic', 'effect', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-84.wav', 'Magical shimmer sound effect for floating cards.', false),
('Emotional Piano Farewell', 'ending', 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c3c39df4a8.mp3', 'Soft piano outro for final messages.', true);


-- ================================================================
-- STEP 7: VERIFY (check tables + policies created correctly)
-- ================================================================
SELECT 'TABLE' AS type, tablename AS name
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'POLICY', tablename || ' → ' || policyname
FROM pg_policies WHERE schemaname = 'public'
ORDER BY type, name;
