-- Create the media table to store image/video metadata
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  event_id UUID,
  user_id UUID -- For future user authentication
);

-- Create the comments table for media comments
CREATE TABLE IF NOT EXISTS media_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  author_name TEXT DEFAULT 'Guest',
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_comment_id UUID REFERENCES media_comments(id) ON DELETE CASCADE, -- For replies
  user_id UUID -- For future user authentication
);

-- Create the comment_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES media_comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  user_id UUID, -- For future user authentication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji) -- One reaction per user per comment per emoji
);

-- Create the guestbook_messages table
CREATE TABLE IF NOT EXISTS guestbook_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT DEFAULT 'Guest',
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID -- For future user authentication
);

-- Create the message_replies table
CREATE TABLE IF NOT EXISTS message_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES guestbook_messages(id) ON DELETE CASCADE,
  author_name TEXT DEFAULT 'Guest',
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID -- For future user authentication
);

-- Create the message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES guestbook_messages(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  user_id UUID, -- For future user authentication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji) -- One reaction per user per message per emoji
);

-- Create the settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES 
  ('default', '{"theme": "light", "uploadLimit": 100, "privacy": {"password": ""}, "loveStartDate": "2025-05-29"}')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_favorite ON media(is_favorite);
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON media_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON media_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- Enable Row Level Security (RLS) for future user authentication
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (everyone can view)
CREATE POLICY "Public read access" ON media FOR SELECT USING (true);
CREATE POLICY "Public read access" ON media_comments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON guestbook_messages FOR SELECT USING (true);
CREATE POLICY "Public read access" ON message_replies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON app_settings FOR SELECT USING (true);

-- Create policies for public insert access (everyone can create)
CREATE POLICY "Public insert access" ON media FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON media_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON comment_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON guestbook_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON message_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON message_reactions FOR INSERT WITH CHECK (true);

-- Create policies for public update access (everyone can update)
CREATE POLICY "Public update access" ON media FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON media_comments FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON comment_reactions FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON guestbook_messages FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON message_replies FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON message_reactions FOR UPDATE USING (true);

-- Create policies for public delete access (everyone can delete)
CREATE POLICY "Public delete access" ON media FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON media_comments FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON comment_reactions FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON guestbook_messages FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON message_replies FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON message_reactions FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
