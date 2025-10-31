-- TuneBox Analytics Database Schema

-- 0. Create ENUMs for better data integrity
CREATE TYPE processing_type_enum AS ENUM ('separation', 'conversion');
CREATE TYPE audio_source_enum AS ENUM ('search', 'file_upload');
CREATE TYPE source_enum AS ENUM ('tunebox_website');

-- 1. Featured Songs Analytics Table
CREATE TABLE featured_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id VARCHAR(50) NOT NULL,
  song_title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
--   action VARCHAR(50) NOT NULL, -- 'details_view', 'play', 'pause'
  user_agent TEXT,
  ip_address INET,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Content Selection Analytics Table
CREATE TABLE user_selection_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_source audio_source_enum NOT NULL,
  audio_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255), -- NULL for file uploads, populated for deezer searches
  user_agent TEXT,
  ip_address INET,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Audio Processing Analytics Table
CREATE TABLE audio_processing_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source source_enum NOT NULL DEFAULT 'tunebox_website',
  audio_source audio_source_enum NOT NULL,
  audio_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255), -- NULL for file uploads, populated for deezer searches
  processing_type processing_type_enum NOT NULL,
  processing_success BOOLEAN DEFAULT true,
  processing_time_ms INTEGER, 
  error_message TEXT,
  user_agent TEXT,
  ip_address INET,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better query performance
-- Featured analytics
-- CREATE INDEX idx_featured_analytics_created_at ON featured_analytics(created_at);

-- -- User selection analytics
-- CREATE INDEX idx_user_selection_analytics_created_at ON user_selection_analytics(created_at);

-- -- Audio processing analytics - MOST IMPORTANT for tracking popular songs
-- CREATE INDEX idx_audio_processing_analytics_audio_name ON audio_processing_analytics(audio_name);
-- CREATE INDEX idx_audio_processing_analytics_artist_name ON audio_processing_analytics(artist_name);
-- CREATE INDEX idx_audio_processing_analytics_created_at ON audio_processing_analytics(created_at);
-- CREATE INDEX idx_audio_processing_analytics_processing_type ON audio_processing_analytics(processing_type);

-- -- Composite index for most common query: popular songs by artist
-- CREATE INDEX idx_audio_processing_analytics_artist_audio ON audio_processing_analytics(artist_name, audio_name);
