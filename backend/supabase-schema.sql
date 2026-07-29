-- =========================================================
-- MemoryVerse Supabase PostgreSQL Database Schema
-- Run this ENTIRE script in your Supabase SQL Editor
-- WARNING: This will DROP and RECREATE all tables (clean reset)
-- =========================================================

-- =========================================================
-- STEP 1: Drop all existing tables (clean slate)
-- =========================================================
DROP TABLE IF EXISTS final_messages CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS memory_groups CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Memory Groups Table
CREATE TABLE IF NOT EXISTS memory_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    theme VARCHAR(50) DEFAULT 'theme1',
    cover_image TEXT,
    audio_url TEXT,
    ambient_audio TEXT,
    ending_audio TEXT,
    intro_quote TEXT,
    theme_settings JSONB DEFAULT '{}'::jsonb,
    allow_download BOOLEAN DEFAULT true,
    allow_share BOOLEAN DEFAULT true,
    show_watermark BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Members Table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Photos Table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Videos Table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES memory_groups(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    author VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Final Messages Table
CREATE TABLE IF NOT EXISTS final_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL UNIQUE REFERENCES memory_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_memory_groups_memory_id ON memory_groups(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_groups_group_name ON memory_groups(group_name);
CREATE INDEX IF NOT EXISTS idx_photos_group_id ON photos(group_id);
CREATE INDEX IF NOT EXISTS idx_videos_group_id ON videos(group_id);
CREATE INDEX IF NOT EXISTS idx_quotes_group_id ON quotes(group_id);

-- NOTE: Admin login now uses Supabase Auth (Dashboard → Authentication → Users).
-- This admins table is kept for reference metadata only.
-- The actual auth is handled by supabase.auth.signInWithPassword() in the frontend.
INSERT INTO admins (email, password_hash)
VALUES ('admin@memoryverse.com', 'MANAGED_BY_SUPABASE_AUTH')
ON CONFLICT (email) DO NOTHING;

-- Default Sample Friendship Group (Memory ID: MV-8A73PQ / Password: friendship2026)
INSERT INTO memory_groups (id, memory_id, group_name, password_hash)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MV-8A73PQ',
    'The Starlight Squad 2026',
    'friendship2026'
) ON CONFLICT (memory_id) DO NOTHING;

-- Sample Photos
INSERT INTO photos (group_id, image_url, caption)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800', 'Annual Beach Trip Sunset 2026'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800', 'Late night rooftop bonfire stories');

-- Sample Final Message
INSERT INTO final_messages (group_id, title, message)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'To Our Forever Squad', 'Thank you for making every moment unforgettable. Here is to a lifetime of laughter and shared memories!')
ON CONFLICT (group_id) DO NOTHING;

-- =========================================================
-- STEP 4: Secure Row Level Security (RLS)
-- Prevents unauthorized users from wiping your database!
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_messages ENABLE ROW LEVEL SECURITY;

-- 1. ALLOW PUBLIC READ (SELECT)
-- Visitors need to be able to read data to see their memory groups.
CREATE POLICY "Public Read Access" ON admins FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON memory_groups FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON members FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON photos FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON videos FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON quotes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON final_messages FOR SELECT USING (true);

-- 2. ALLOW AUTHENTICATED WRITE (INSERT/UPDATE/DELETE)
-- Only logged-in admins (authenticated via Supabase Auth) can modify data.
CREATE POLICY "Auth Insert Access" ON memory_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON memory_groups FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON memory_groups FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Insert Access" ON members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON members FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Insert Access" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON photos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Insert Access" ON videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON videos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON videos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Insert Access" ON quotes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON quotes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON quotes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Insert Access" ON final_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON final_messages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Access" ON final_messages FOR DELETE USING (auth.role() = 'authenticated');

-- =========================================================
-- STEP 5: Storage Bucket Security
-- Ensures only authenticated admins can upload photos/videos
-- =========================================================

-- Note: Ensure you have a bucket named 'media' created in the Supabase Storage dashboard.
-- The following policies secure that bucket.

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Auth Insert Access" ON storage.objects;
CREATE POLICY "Auth Insert Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update Access" ON storage.objects;
CREATE POLICY "Auth Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Delete Access" ON storage.objects;
CREATE POLICY "Auth Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

