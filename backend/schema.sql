-- =========================================================
-- MemoryVerse PostgreSQL Schema (Phase 1)
-- Neon PostgreSQL / Render Deployment Compatible
-- =========================================================

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Groups Table
CREATE TABLE IF NOT EXISTS memory_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Group Members Table
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

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_memory_groups_memory_id ON memory_groups(memory_id);
CREATE INDEX IF NOT EXISTS idx_photos_group_id ON photos(group_id);
CREATE INDEX IF NOT EXISTS idx_videos_group_id ON videos(group_id);
CREATE INDEX IF NOT EXISTS idx_quotes_group_id ON quotes(group_id);

-- Initial Administrator Seed Data (bcrypt hashed password for 'admin123')
INSERT INTO admins (email, password_hash)
VALUES ('admin@memoryverse.com', '$2a$10$7R6v/25d9kC88zS91Sg1.O5Wq52G1eN4iG/P5vE1o0c.G/YqA6p6S')
ON CONFLICT (email) DO NOTHING;
