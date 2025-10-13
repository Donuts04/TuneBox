-- TuneBox Analytics Dashboard Queries
-- Use these in Supabase SQL Editor for insights

-- 1. Most Popular Songs (by processing count)
SELECT 
  audio_name,
  artist_name,
  COUNT(*) as processing_count,
  AVG(processing_time_ms) as avg_processing_time_ms
FROM audio_processing_analytics 
WHERE audio_source = 'deezer_search'  -- Focus on real songs
  AND processing_success = true
GROUP BY audio_name, artist_name 
ORDER BY processing_count DESC
LIMIT 20;

-- 2. Most Popular Artists
SELECT 
  artist_name,
  COUNT(*) as total_processing,
  COUNT(DISTINCT audio_name) as unique_songs,
  AVG(processing_time_ms) as avg_processing_time_ms
FROM audio_processing_analytics 
WHERE audio_source = 'deezer_search'
  AND processing_success = true
  AND artist_name IS NOT NULL
GROUP BY artist_name 
ORDER BY total_processing DESC
LIMIT 20;

-- 3. Processing Performance Trends (Last 30 Days)
SELECT 
  DATE(created_at) as date,
  processing_type,
  COUNT(*) as total_requests,
  AVG(processing_time_ms) as avg_processing_time_ms,
  COUNT(CASE WHEN processing_success = true THEN 1 END) as successful_requests,
  ROUND(
    COUNT(CASE WHEN processing_success = true THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate_percent
FROM audio_processing_analytics 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), processing_type
ORDER BY date DESC, processing_type;

-- 4. User Engagement (Selections vs Processing)
SELECT 
  'Selections' as event_type,
  COUNT(*) as count,
  COUNT(DISTINCT ip_address) as unique_users
FROM user_selection_analytics 
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Processing' as event_type,
  COUNT(*) as count,
  COUNT(DISTINCT ip_address) as unique_users
FROM audio_processing_analytics 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 5. Featured Songs Performance
SELECT 
  song_title,
  artist,
  COUNT(*) as detail_views,
  COUNT(DISTINCT ip_address) as unique_viewers
FROM featured_analytics 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY song_title, artist
ORDER BY detail_views DESC;

-- 6. Processing Success Rates
SELECT 
  processing_type,
  audio_source,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN processing_success = true THEN 1 END) as successful_requests,
  ROUND(
    COUNT(CASE WHEN processing_success = true THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate_percent,
  AVG(processing_time_ms) as avg_processing_time_ms
FROM audio_processing_analytics 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY processing_type, audio_source
ORDER BY processing_type, audio_source;

-- 7. Hourly Usage Patterns
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as requests
FROM audio_processing_analytics 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- 8. Slow Processing Operations (>30 seconds)
SELECT 
  audio_name,
  artist_name,
  processing_type,
  processing_time_ms,
  created_at
FROM audio_processing_analytics 
WHERE processing_time_ms > 30000  -- > 30 seconds
ORDER BY processing_time_ms DESC
LIMIT 50;

-- 9. Error Analysis - Most Common Errors
SELECT 
  error_message,
  processing_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT audio_name) as affected_songs
FROM audio_processing_analytics 
WHERE processing_success = false
  AND error_message IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_message, processing_type
ORDER BY error_count DESC;

-- 10. Error Trends Over Time
SELECT 
  DATE(created_at) as date,
  processing_type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN processing_success = false THEN 1 END) as failed_requests,
  ROUND(
    COUNT(CASE WHEN processing_success = false THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as error_rate_percent
FROM audio_processing_analytics 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), processing_type
ORDER BY date DESC, processing_type;

-- 11. Songs with Most Errors
SELECT 
  audio_name,
  artist_name,
  processing_type,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN processing_success = false THEN 1 END) as failed_attempts,
  ROUND(
    COUNT(CASE WHEN processing_success = false THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as error_rate_percent
FROM audio_processing_analytics 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY audio_name, artist_name, processing_type
HAVING COUNT(CASE WHEN processing_success = false THEN 1 END) > 0
ORDER BY failed_attempts DESC
LIMIT 20;
