-- migration.sql
-- Add new columns for Final Experience Update

-- 1. Add to memory_groups
ALTER TABLE memory_groups 
ADD COLUMN IF NOT EXISTS ending_audio TEXT,
ADD COLUMN IF NOT EXISTS intro_quote TEXT,
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_share BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_watermark BOOLEAN DEFAULT true;

-- 2. Add to photos
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS animation_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS date VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- 3. Add to quotes
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(50);

-- Note: audio_url in memory_groups is already used as ambient_audio, so we don't need to rename it, we can just use it or rename it.
-- For compatibility we'll keep audio_url and map it to ambient_audio in the frontend, or just add ambient_audio.
ALTER TABLE memory_groups
ADD COLUMN IF NOT EXISTS ambient_audio TEXT;

-- Move data from audio_url to ambient_audio if needed
UPDATE memory_groups SET ambient_audio = audio_url WHERE ambient_audio IS NULL AND audio_url IS NOT NULL;
